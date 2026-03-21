package com.example.horrormod.entity;

import com.example.horrormod.entity.goal.LurkerHuntGoal;
import com.example.horrormod.sound.ModSounds;
import net.minecraft.entity.EntityType;
import net.minecraft.entity.SpawnReason;
import net.minecraft.entity.ai.goal.LookAroundGoal;
import net.minecraft.entity.ai.goal.MeleeAttackGoal;
import net.minecraft.entity.ai.goal.WanderAroundFarGoal;
import net.minecraft.entity.attribute.DefaultAttributeContainer;
import net.minecraft.entity.attribute.EntityAttributes;
import net.minecraft.entity.damage.DamageSource;
import net.minecraft.entity.mob.HostileEntity;
import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.sound.SoundEvent;
import net.minecraft.util.math.BlockPos;
import net.minecraft.util.math.Vec3d;
import net.minecraft.util.math.random.Random;
import net.minecraft.world.LightType;
import net.minecraft.world.ServerWorldAccess;
import net.minecraft.world.World;

/**
 * The Lurker — a blind, sound-hunting cave predator.
 *
 * <h2>Core design</h2>
 * <p>The Lurker cannot see.  It has no {@code NearestAttackableTargetGoal}
 * and no line-of-sight check anywhere in its AI.  Instead,
 * {@link LurkerHuntGoal} scores each nearby player by the noise they make
 * (sprinting &gt; walking &gt; standing &gt; sneaking) and navigates to
 * wherever it heard the loudest sound.</p>
 *
 * <p>Gameplay implications for the player:</p>
 * <ul>
 *   <li><b>Sneak</b> to pass undetected — even at point-blank range.</li>
 *   <li><b>Never sprint</b> near a Lurker: sprinting broadcasts a 32-block alert.</li>
 *   <li>Standing still and breathing is safe — the Lurker will wander away.</li>
 *   <li>If the Lurker physically bumps into you (proximity override), it
 *       <em>will</em> attack even if you were sneaking.</li>
 * </ul>
 *
 * <h2>Stats</h2>
 * <ul>
 *   <li>HP: 30 (15 hearts) — tanky enough to not be one-shotted but killable</li>
 *   <li>Attack: 5 (2.5 hearts)</li>
 *   <li>Speed: 0.25 base, 0.35 (×1.4) when chasing</li>
 *   <li>Armour: 4 (2 chestplates equivalent) — resistant but not immune</li>
 *   <li>XP: 12</li>
 * </ul>
 *
 * <h2>Sound design</h2>
 * <ul>
 *   <li>Idle: low ambient growl (infrequent, adds atmosphere)</li>
 *   <li>Alert: sharp snarl played once when it first detects a sound</li>
 *   <li>Hurt: single bark — short so it doesn't mask other audio cues</li>
 *   <li>Death: long groan (reward signal for the player)</li>
 * </ul>
 *
 * <h2>Sanity</h2>
 * <p>The generic {@code HostileEntity} check in {@code SanityTracker} already
 * drains sanity when the player is within 16 blocks.  Future work: add a
 * Lurker-specific check for extra drain at close range.</p>
 *
 * <h2>Version compatibility (1.20.1 and 1.21.1)</h2>
 * <p>All APIs used here have the same package path and signature in both
 * versions:</p>
 * <ul>
 *   <li>{@code HostileEntity} and its attribute builder method</li>
 *   <li>{@code EntityAttributes.GENERIC_*} — attribute keys are unchanged</li>
 *   <li>{@code SpawnReason}, {@code ServerWorldAccess} — same class paths</li>
 *   <li>{@code net.minecraft.util.math.random.Random} — Minecraft's own random
 *       interface (not {@code java.util.Random})</li>
 * </ul>
 */
public class LurkerEntity extends HostileEntity {

    // -----------------------------------------------------------------------
    // Alert state constants
    // -----------------------------------------------------------------------

    /** How long (ticks) the Lurker stays alert after hearing a sound. 5 seconds. */
    private static final int ALERT_DURATION_TICKS = 100;

    // -----------------------------------------------------------------------
    // Alert state  (server-only; not synced to client)
    // -----------------------------------------------------------------------

    /** World position of the last heard sound, or {@code null} when calm. */
    private Vec3d lastHeardPos = null;

    /** Ticks remaining in the current alert.  0 = calm/not alerted. */
    private int alertTicksRemaining = 0;

    // -----------------------------------------------------------------------
    // Constructor
    // -----------------------------------------------------------------------

    public LurkerEntity(EntityType<? extends LurkerEntity> type, World world) {
        super(type, world);
        this.experiencePoints = 12;

        // The Lurker doesn't care about light — it can't see anyway.
        // Removing the default light-avoidance penalty prevents it from
        // refusing to path through lit areas (which would look very wrong
        // given its "blind" identity).
        this.setPathfindingPenalty(
                net.minecraft.entity.ai.pathing.PathNodeType.LIGHT, 0.0f);
    }

    // -----------------------------------------------------------------------
    // Goal setup
    // -----------------------------------------------------------------------

    /**
     * Registers AI goals for the Lurker.
     *
     * <p><b>Note: no TargetGoal is added.</b>  Vanilla target goals (like
     * {@code NearestAttackableTargetGoal}) use line-of-sight.  The Lurker
     * sets its target from within {@link LurkerHuntGoal} only when it
     * physically locates the player by noise — this is what makes it blind.</p>
     *
     * <h3>Priority table (lower = higher priority)</h3>
     * <table border="1">
     *   <caption>Goal priorities</caption>
     *   <tr><th>Priority</th><th>Goal</th><th>Controls</th></tr>
     *   <tr><td>1</td><td>MeleeAttackGoal</td><td>MOVE, LOOK</td></tr>
     *   <tr><td>2</td><td>LurkerHuntGoal</td><td>MOVE, LOOK</td></tr>
     *   <tr><td>3</td><td>WanderAroundFarGoal</td><td>MOVE</td></tr>
     *   <tr><td>4</td><td>LookAroundGoal</td><td>LOOK</td></tr>
     * </table>
     *
     * <p>{@code MeleeAttackGoal} at priority 1 preempts {@code LurkerHuntGoal}
     * once a target has been set — handling the final approach and
     * damage dealing.  {@code LurkerHuntGoal} sets the target when the
     * Lurker arrives at the noise source and finds the player.</p>
     */
    @Override
    protected void initGoals() {
        // ── 1: Melee attack — executes only when a target has been set ────
        // speed=1.4: 140% of base speed for the final lunge.
        // pauseWhenMobIdle=false: never stop moving even if target has no LOS.
        this.goalSelector.add(1, new MeleeAttackGoal(this, 1.4, false));

        // ── 2: Noise hunt — the defining behaviour ────────────────────────
        this.goalSelector.add(2, new LurkerHuntGoal(this));

        // ── 3: Wander when calm ───────────────────────────────────────────
        // 0.7 speed, probability=0.001 (rarely wanders far).
        this.goalSelector.add(3, new WanderAroundFarGoal(this, 0.7, 0.001f));

        // ── 4: Idle look ──────────────────────────────────────────────────
        this.goalSelector.add(4, new LookAroundGoal(this));

        // ── No target goals — the Lurker is blind ─────────────────────────
        // The LurkerHuntGoal calls setTarget() when it arrives at the player.
    }

    // -----------------------------------------------------------------------
    // Attribute declaration
    // -----------------------------------------------------------------------

    /**
     * Declares which entity attributes the Lurker uses and their base values.
     *
     * <p>Called by {@link ModEntities#register()} via
     * {@code FabricDefaultAttributeRegistry.register(LURKER, createAttributes())}.</p>
     *
     * <p>{@code HostileEntity.createHostileAttributes()} already includes
     * {@code GENERIC_MAX_HEALTH} (20) and {@code GENERIC_MOVEMENT_SPEED} (0.25),
     * and {@code GENERIC_FOLLOW_RANGE} (16).  We override several values here.</p>
     */
    public static DefaultAttributeContainer.Builder createAttributes() {
        return HostileEntity.createHostileAttributes()
                .add(EntityAttributes.GENERIC_MAX_HEALTH,      30.0)  // 15 hearts
                .add(EntityAttributes.GENERIC_MOVEMENT_SPEED,  0.25)  // zombie-like
                .add(EntityAttributes.GENERIC_ATTACK_DAMAGE,   5.0)   // 2.5 hearts
                .add(EntityAttributes.GENERIC_FOLLOW_RANGE,   32.0)  // detection range hint
                .add(EntityAttributes.GENERIC_ARMOR,           4.0);  // light natural armour
    }

    // -----------------------------------------------------------------------
    // Alert state API  (used by LurkerHuntGoal)
    // -----------------------------------------------------------------------

    /** Returns {@code true} if the Lurker is currently tracking a sound. */
    public boolean isAlerted() {
        return alertTicksRemaining > 0;
    }

    /** Returns the last heard position, or {@code null} when calm. */
    public Vec3d getLastHeardPos() {
        return lastHeardPos;
    }

    /**
     * Records a new sound position and resets the alert timer.
     * Plays the growl sound the first time the Lurker is alerted
     * (i.e. when transitioning from calm to alert).
     *
     * @param pos  world coordinates of the sound source.
     */
    public void alertTo(Vec3d pos) {
        boolean wasCalm = !isAlerted();
        this.lastHeardPos = pos;
        this.alertTicksRemaining = ALERT_DURATION_TICKS;

        if (wasCalm) {
            // Growl once to signal that the Lurker has "heard" something.
            // Pitch varies slightly so it doesn't sound robotic.
            float pitch = 0.9f + getRandom().nextFloat() * 0.2f;
            this.playSound(ModSounds.LURKER_GROWL, 1.0f, pitch);
        }
    }

    // -----------------------------------------------------------------------
    // Tick override — countdown and target management
    // -----------------------------------------------------------------------

    @Override
    public void tick() {
        super.tick();

        if (alertTicksRemaining > 0) {
            alertTicksRemaining--;
        }

        // ── Lose target if player went silent AND alertness expired ───────
        // This is what makes sneaking effective as an escape strategy:
        // the player can "shake" the Lurker by hiding and crouching until
        // ALERT_DURATION_TICKS passes without making noise.
        if (alertTicksRemaining == 0 && this.getTarget() instanceof PlayerEntity player) {
            if (player.isSneaking()) {
                this.setTarget(null);
                this.lastHeardPos = null;
            }
        }
    }

    // -----------------------------------------------------------------------
    // Spawn condition
    // -----------------------------------------------------------------------

    /**
     * Custom spawn predicate used with {@code SpawnRestriction.register()}.
     *
     * <p>The Lurker only spawns when <em>all three</em> conditions hold:</p>
     * <ol>
     *   <li>Below Y=50 — underground only.</li>
     *   <li>Block light level == 0 — not near torches, lava, etc.</li>
     *   <li>Sky light level == 0 — not in open caves connected to the sky.</li>
     * </ol>
     *
     * <p>This makes the Lurker a deep-cave mob.  It will not spawn in
     * surface biomes, Nether, or End (the sky-light check blocks the Nether;
     * the Overworld biome selector in {@code ModEntities.register()} blocks
     * the End).</p>
     *
     * @param type    the entity type (provided by the MC spawning system).
     * @param world   server-side world access for light/block queries.
     * @param reason  spawn reason (natural, command, spawn egg, etc.).
     * @param pos     the candidate spawn position.
     * @param random  world RNG (not used — kept for the functional interface).
     */
    public static boolean canSpawn(
            EntityType<LurkerEntity> type,
            ServerWorldAccess world,
            SpawnReason reason,
            BlockPos pos,
            Random random) {

        return pos.getY() < 50
                && world.getLightLevel(LightType.BLOCK, pos) == 0
                && world.getLightLevel(LightType.SKY, pos) == 0;
    }

    // -----------------------------------------------------------------------
    // Sound overrides
    // -----------------------------------------------------------------------

    @Override
    protected SoundEvent getAmbientSound() {
        return ModSounds.LURKER_AMBIENT;
    }

    @Override
    protected SoundEvent getHurtSound(DamageSource source) {
        return ModSounds.LURKER_HURT;
    }

    @Override
    protected SoundEvent getDeathSound() {
        return ModSounds.LURKER_DEATH;
    }

    @Override
    protected float getSoundVolume() {
        return 1.0f;
    }

    /**
     * Plays the ambient sound roughly every 10–14 seconds.
     * Overriding this controls the wait timer between ambient sounds.
     */
    @Override
    public int getMinAmbientSoundDelay() {
        return 200;   // ticks (200 = 10 seconds minimum)
    }
}
