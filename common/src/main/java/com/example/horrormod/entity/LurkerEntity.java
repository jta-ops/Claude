package com.example.horrormod.entity;

import com.example.horrormod.entity.goal.LurkerEnrageGoal;
import com.example.horrormod.entity.goal.LurkerHuntGoal;
import com.example.horrormod.item.ModItems;
import com.example.horrormod.sound.ModSounds;
import net.minecraft.entity.EntityPredicates;
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
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.sound.SoundEvent;
import net.minecraft.util.hit.HitResult;
import net.minecraft.util.math.BlockPos;
import net.minecraft.util.math.Vec3d;
import net.minecraft.util.math.random.Random;
import net.minecraft.world.LightType;
import net.minecraft.world.RaycastContext;
import net.minecraft.world.ServerWorldAccess;
import net.minecraft.world.World;

import java.util.List;

/**
 * The Lurker — a blind, sound-hunting cave predator inspired by SCP-096.
 *
 * <h2>Two distinct threat modes</h2>
 *
 * <h3>1. Noise-hunt (passive default)</h3>
 * <p>The Lurker detects players by the sound they make (see
 * {@link LurkerHuntGoal}).  A sneaking player is completely silent and
 * safe to pass, even at close range.  A sprinting player triggers a
 * 5-second alert chase.</p>
 *
 * <h3>2. Face-look enrage (SCP-096 mechanic)</h3>
 * <p>If a player looks directly at the Lurker's face — without holding
 * {@link ModItems#SCRAMBLE_GOGGLES} in their offhand or mainhand — the
 * Lurker enters a 30-second enrage.  During enrage it sprints at 2× speed
 * and will not stop until the player is dead or the timer expires.
 * A jumpscare packet is sent to the player's client on first enrage.</p>
 *
 * <p>Protection: hold the Scramble Goggles (crafted from glass panes +
 * iron nuggets) in any hand.  The goggles scramble your visual perception
 * of the face, preventing enrage.</p>
 *
 * <h2>Stats</h2>
 * <ul>
 *   <li>HP: 30 (15 hearts), ATK: 5 (2.5 hearts), Speed: 0.25, Armour: 4</li>
 *   <li>XP: 12,  Spawn: Y &lt; 50, block-light = 0, sky-light = 0</li>
 * </ul>
 */
public class LurkerEntity extends HostileEntity {

    // -----------------------------------------------------------------------
    // Constants
    // -----------------------------------------------------------------------

    /** Max distance (blocks) for face-look detection. */
    private static final double FACE_DETECT_RANGE_SQ = 400.0;  // 20 blocks²

    /**
     * Dot-product threshold for "looking at face".
     * 0.97 ≈ 14° cone around the player's crosshair.
     */
    private static final double FACE_DOT_THRESHOLD = 0.97;

    /** How many ticks the Lurker stays enraged after eye contact. 30 seconds. */
    static final int ENRAGE_DURATION = 600;

    /** How many ticks the Lurker stays alert after hearing a sound. 5 seconds. */
    private static final int ALERT_DURATION_TICKS = 100;

    // -----------------------------------------------------------------------
    // Alert state  (noise-hunt path)
    // -----------------------------------------------------------------------

    private Vec3d lastHeardPos = null;
    private int alertTicksRemaining = 0;

    // -----------------------------------------------------------------------
    // Enrage state  (face-look path)
    // -----------------------------------------------------------------------

    private boolean enraged = false;
    private int enrageTicksRemaining = 0;

    // -----------------------------------------------------------------------
    // Constructor
    // -----------------------------------------------------------------------

    public LurkerEntity(EntityType<? extends LurkerEntity> type, World world) {
        super(type, world);
        this.experiencePoints = 12;
        // Remove light-avoidance: the Lurker can't see, so light level is irrelevant.
        this.setPathfindingPenalty(
                net.minecraft.entity.ai.pathing.PathNodeType.LIGHT, 0.0f);
    }

    // -----------------------------------------------------------------------
    // Goal setup
    // -----------------------------------------------------------------------

    /**
     * Goal priority table:
     * <pre>
     *  1: LurkerEnrageGoal   — face-look rage (highest; overrides all others)
     *  2: MeleeAttackGoal    — close attack when target is set by HuntGoal
     *  3: LurkerHuntGoal     — noise detection + navigate to sound
     *  4: WanderAroundFarGoal
     *  5: LookAroundGoal
     * </pre>
     * No {@code NearestAttackableTargetGoal} — the Lurker is completely blind.
     */
    @Override
    protected void initGoals() {
        this.goalSelector.add(1, new LurkerEnrageGoal(this));
        this.goalSelector.add(2, new MeleeAttackGoal(this, 1.4, false));
        this.goalSelector.add(3, new LurkerHuntGoal(this));
        this.goalSelector.add(4, new WanderAroundFarGoal(this, 0.7, 0.001f));
        this.goalSelector.add(5, new LookAroundGoal(this));
    }

    // -----------------------------------------------------------------------
    // Attribute declaration
    // -----------------------------------------------------------------------

    public static DefaultAttributeContainer.Builder createAttributes() {
        return HostileEntity.createHostileAttributes()
                .add(EntityAttributes.GENERIC_MAX_HEALTH,     30.0)
                .add(EntityAttributes.GENERIC_MOVEMENT_SPEED,  0.25)
                .add(EntityAttributes.GENERIC_ATTACK_DAMAGE,   5.0)
                .add(EntityAttributes.GENERIC_FOLLOW_RANGE,   32.0)
                .add(EntityAttributes.GENERIC_ARMOR,           4.0);
    }

    // -----------------------------------------------------------------------
    // Alert state API  (used by LurkerHuntGoal)
    // -----------------------------------------------------------------------

    public boolean isAlerted()        { return alertTicksRemaining > 0; }
    public Vec3d   getLastHeardPos()  { return lastHeardPos; }

    /**
     * Records a new sound and resets the alert timer.
     * Plays the growl once on the transition from calm → alert.
     */
    public void alertTo(Vec3d pos) {
        boolean wasCalm = !isAlerted();
        this.lastHeardPos = pos;
        this.alertTicksRemaining = ALERT_DURATION_TICKS;
        if (wasCalm) {
            float pitch = 0.9f + getRandom().nextFloat() * 0.2f;
            this.playSound(ModSounds.LURKER_GROWL, 1.0f, pitch);
        }
    }

    // -----------------------------------------------------------------------
    // Enrage state API  (used by LurkerEnrageGoal + face-look detection)
    // -----------------------------------------------------------------------

    public boolean isEnraged() { return enraged && enrageTicksRemaining > 0; }

    /**
     * Enrages the Lurker and sends a jumpscare to the triggering player.
     * Re-entrant: calling again while already enraged simply resets the timer.
     */
    public void enrageAt(PlayerEntity player) {
        boolean wasCalm = !isEnraged();
        enraged = true;
        enrageTicksRemaining = ENRAGE_DURATION;
        this.setTarget(player);

        if (wasCalm && player instanceof ServerPlayerEntity serverPlayer) {
            // Play growl loud for the aggressor
            float pitch = 0.7f + getRandom().nextFloat() * 0.1f;
            this.playSound(ModSounds.LURKER_GROWL, 1.5f, pitch);
            // Send jumpscare packet — client will show red flash
            LurkerPackets.sendJumpscare(serverPlayer);
        }
    }

    // -----------------------------------------------------------------------
    // Tick — countdown, face-look detection, target management
    // -----------------------------------------------------------------------

    @Override
    public void tick() {
        super.tick();

        // Countdown timers
        if (alertTicksRemaining > 0)  alertTicksRemaining--;
        if (enrageTicksRemaining > 0) enrageTicksRemaining--;
        if (enrageTicksRemaining == 0) enraged = false;

        // Server-only logic
        if (!this.getWorld().isClient()) {

            // ── Face-look detection (every 5 ticks) ───────────────────────
            if (this.age % 5 == 0) {
                detectFaceLook();
            }

            // ── Lose noise-based target if player went quiet ───────────────
            if (!enraged && alertTicksRemaining == 0
                    && this.getTarget() instanceof PlayerEntity player
                    && player.isSneaking()) {
                this.setTarget(null);
                this.lastHeardPos = null;
            }
        }
    }

    // -----------------------------------------------------------------------
    // Face-look detection (private, server-side only)
    // -----------------------------------------------------------------------

    /**
     * Scans players within 20 blocks and enrages if any unprotected player
     * is looking directly at this entity's face.
     *
     * <p>The detection cone is {@link #FACE_DOT_THRESHOLD} (≈14°) and
     * requires an unobstructed line of sight (raycast check).</p>
     */
    private void detectFaceLook() {
        World world = this.getWorld();
        List<PlayerEntity> players = world.getEntitiesByClass(
                PlayerEntity.class,
                this.getBoundingBox().expand(20.0),
                EntityPredicates.EXCEPT_CREATIVE_OR_SPECTATOR);

        for (PlayerEntity player : players) {
            // Skip if already enraged toward this player
            if (isEnraged() && this.getTarget() == player) continue;
            // Skip if the player holds Scramble Goggles
            if (isProtectedByGoggles(player)) continue;
            // Check face-look cone + LOS
            if (isLookingAtFace(player)) {
                enrageAt(player);
                return; // one trigger per scan is enough
            }
        }
    }

    /**
     * Returns {@code true} if {@code player} holds Scramble Goggles in
     * either hand.
     */
    private static boolean isProtectedByGoggles(PlayerEntity player) {
        return player.getOffHandStack().isOf(ModItems.SCRAMBLE_GOGGLES)
                || player.getMainHandStack().isOf(ModItems.SCRAMBLE_GOGGLES);
    }

    /**
     * Returns {@code true} if the player's camera is aimed within
     * {@link #FACE_DOT_THRESHOLD} of this entity's head AND there is no
     * solid block between the player's eyes and the head.
     *
     * <p>APIs used:</p>
     * <ul>
     *   <li>{@code Entity.getCameraPosVec(float)} — eye position, stable ✓</li>
     *   <li>{@code Entity.getRotationVec(float)}  — look direction, stable ✓</li>
     *   <li>{@code World.raycast(RaycastContext)}  — LOS check, stable ✓</li>
     * </ul>
     */
    private boolean isLookingAtFace(PlayerEntity player) {
        // Out-of-range fast exit
        if (this.squaredDistanceTo(player) > FACE_DETECT_RANGE_SQ) return false;

        Vec3d eyes       = player.getCameraPosVec(1.0f);
        Vec3d lurkerHead = this.getPos().add(0.0, 1.6, 0.0);
        Vec3d toFace     = lurkerHead.subtract(eyes).normalize();
        Vec3d lookDir    = player.getRotationVec(1.0f);

        // Dot product: 1.0 = directly aimed, 0 = 90° away
        if (toFace.dotProduct(lookDir) < FACE_DOT_THRESHOLD) return false;

        // Raycast: is there a solid block between the player's eye and the face?
        RaycastContext ctx = new RaycastContext(
                eyes, lurkerHead,
                RaycastContext.ShapeType.OUTLINE,
                RaycastContext.FluidHandling.NONE,
                player);
        HitResult result = player.getWorld().raycast(ctx);
        // MISS means no block in the way → clear line of sight
        return result.getType() == HitResult.Type.MISS;
    }

    // -----------------------------------------------------------------------
    // Spawn condition
    // -----------------------------------------------------------------------

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
    // Sounds
    // -----------------------------------------------------------------------

    @Override protected SoundEvent getAmbientSound()                     { return ModSounds.LURKER_AMBIENT; }
    @Override protected SoundEvent getHurtSound(DamageSource src)        { return ModSounds.LURKER_HURT;    }
    @Override protected SoundEvent getDeathSound()                       { return ModSounds.LURKER_DEATH;   }
    @Override protected float      getSoundVolume()                      { return 1.0f; }
    @Override public    int        getMinAmbientSoundDelay()             { return 200; }
}
