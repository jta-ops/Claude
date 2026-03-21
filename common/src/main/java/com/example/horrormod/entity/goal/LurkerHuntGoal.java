package com.example.horrormod.entity.goal;

import com.example.horrormod.entity.LurkerEntity;
import net.minecraft.entity.EntityPredicates;
import net.minecraft.entity.ai.goal.Goal;
import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.util.math.Box;
import net.minecraft.util.math.Vec3d;
import net.minecraft.world.World;

import java.util.EnumSet;
import java.util.List;

/**
 * The core AI goal that makes the Lurker a sound-hunter.
 *
 * <h2>Behaviour overview</h2>
 * <ol>
 *   <li>Every tick, scan a 32-block radius for players.</li>
 *   <li>Score each player by how much noise they are making and how close they are.</li>
 *   <li>If the loudest player exceeds the alert threshold, call
 *       {@link LurkerEntity#alertTo(Vec3d)} to record the last heard position
 *       and play the growl sound.</li>
 *   <li>While alerted, navigate toward the last heard position at sprint speed.</li>
 *   <li>When the Lurker reaches the noise origin, scan for any player within
 *       melee distance and set them as the mob target so
 *       {@link net.minecraft.entity.ai.goal.MeleeAttackGoal} can take over.</li>
 *   <li>If alertness expires (no new noise for 5 seconds), stop chasing and
 *       yield to {@link net.minecraft.entity.ai.goal.WanderAroundFarGoal}.</li>
 * </ol>
 *
 * <h2>Why no sight check</h2>
 * <p>The Lurker is completely blind.  This goal deliberately does NOT call
 * {@code canSee(player)} at any point.  Detection is purely noise-based.
 * A player who crouches (sneaks) produces zero noise and is completely
 * invisible to the Lurker no matter how close they are — unless the Lurker
 * physically walks into them (see proximity override below).</p>
 *
 * <h2>Noise model</h2>
 * <table border="1">
 *   <caption>Noise levels by player state</caption>
 *   <tr><th>Player state</th><th>Base noise</th></tr>
 *   <tr><td>Sneaking</td><td>0.0 (silent)</td></tr>
 *   <tr><td>Standing still</td><td>0.0</td></tr>
 *   <tr><td>Walking</td><td>0.6</td></tr>
 *   <tr><td>Sprinting</td><td>1.5</td></tr>
 * </table>
 * <p>Effective noise is scaled down linearly with distance so that a sprinting
 * player at the edge of the 32-block detection range is heard at 1.5×0 = 0.
 * The threshold to trigger an alert is {@link #ALERT_THRESHOLD} (0.3).</p>
 *
 * <h2>Proximity override</h2>
 * <p>Even if a player is completely silent, if they are within
 * {@link #PHYSICAL_DETECT_RADIUS} (2 blocks) of the Lurker it will sense
 * them through vibration / physical contact and alert immediately.</p>
 *
 * <h2>Version compatibility (1.20.1 and 1.21.1)</h2>
 * <p>Only stable shared APIs are used:</p>
 * <ul>
 *   <li>{@code EntityPredicates.EXCEPT_CREATIVE_OR_SPECTATOR} ✓</li>
 *   <li>{@code World.getEntitiesByClass(Class, Box, Predicate)} ✓</li>
 *   <li>{@code EntityNavigation.findPathTo(double, double, double, int)} ✓</li>
 *   <li>{@code EntityNavigation.startMovingAlong(Path, double)} ✓</li>
 *   <li>{@code PlayerEntity.isSneaking() / isSprinting()} ✓</li>
 *   <li>{@code MobEntity.setTarget(LivingEntity)} ✓</li>
 * </ul>
 */
public class LurkerHuntGoal extends Goal {

    // -----------------------------------------------------------------------
    // Constants
    // -----------------------------------------------------------------------

    /** Radius (blocks) in which noise can be detected at all. */
    private static final float DETECT_RADIUS = 32.0f;

    /**
     * Minimum effective noise to trigger an alert.
     * Equivalent to a walking player ~18 blocks away,
     * or a sprinting player ~29 blocks away.
     */
    private static final float ALERT_THRESHOLD = 0.3f;

    /**
     * Within this radius the Lurker physically senses the player regardless
     * of how quiet they are.  Simulates vibration / contact detection.
     */
    private static final float PHYSICAL_DETECT_RADIUS = 2.0f;

    /**
     * Within this radius the Lurker considers itself to have "arrived" at
     * the last heard position and starts sweeping for the actual player.
     */
    private static final double ARRIVAL_THRESHOLD_SQ = 9.0;   // 3 blocks²

    // -----------------------------------------------------------------------
    // State
    // -----------------------------------------------------------------------

    private final LurkerEntity lurker;

    // -----------------------------------------------------------------------
    // Constructor
    // -----------------------------------------------------------------------

    public LurkerHuntGoal(LurkerEntity lurker) {
        this.lurker = lurker;
        // Claim both MOVE and LOOK controls so lower-priority goals cannot
        // override our navigation while we are active.
        this.setControls(EnumSet.of(Control.MOVE, Control.LOOK));
    }

    // -----------------------------------------------------------------------
    // Goal lifecycle
    // -----------------------------------------------------------------------

    /**
     * Starts the goal if there is any noise to investigate OR if the Lurker
     * is already alerted from a previous tick.
     */
    @Override
    public boolean canStart() {
        detectNoise();
        return lurker.isAlerted();
    }

    /** Continues while the Lurker is still counting down alert ticks. */
    @Override
    public boolean shouldContinue() {
        detectNoise();
        return lurker.isAlerted();
    }

    /** Begin moving toward the last heard position when the goal activates. */
    @Override
    public void start() {
        navigateToLastHeard();
    }

    @Override
    public void stop() {
        lurker.getNavigation().stop();
    }

    /**
     * Core update: re-detect noise, steer toward it, and set a mob target
     * once the Lurker physically arrives at the noise origin.
     */
    @Override
    public void tick() {
        detectNoise();

        Vec3d target = lurker.getLastHeardPos();
        if (target == null) return;

        // Face the noise source
        lurker.getLookControl().lookAt(target.x, target.y, target.z);

        // Navigate toward it (re-path every 10 ticks to follow a moving noise)
        if (lurker.getServer() != null && lurker.getServer().getTicks() % 10 == 0) {
            navigateToLastHeard();
        }

        // "Arrival" check: once close enough to the noise origin, sweep for
        // the actual player in melee range so MeleeAttackGoal can take over.
        if (lurker.squaredDistanceTo(target) < ARRIVAL_THRESHOLD_SQ) {
            acquireMeleeTarget();
        }
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    /**
     * Scans nearby players and updates the Lurker's alert state.
     *
     * <p>Skips spectators and creative players via
     * {@code EntityPredicates.EXCEPT_CREATIVE_OR_SPECTATOR}.</p>
     */
    private void detectNoise() {
        World world = lurker.getWorld();
        Box box = lurker.getBoundingBox().expand(DETECT_RADIUS);
        List<PlayerEntity> players = world.getEntitiesByClass(
                PlayerEntity.class, box, EntityPredicates.EXCEPT_CREATIVE_OR_SPECTATOR);

        float loudest = 0.0f;
        Vec3d loudestPos = null;

        for (PlayerEntity player : players) {
            double dist = lurker.distanceTo(player);

            // ── Proximity override: physical detection regardless of noise ─
            if (dist < PHYSICAL_DETECT_RADIUS) {
                lurker.alertTo(player.getPos());
                lurker.setTarget(player);
                return;
            }

            // ── Noise-based detection ─────────────────────────────────────
            float noise = noiseLevel(player);

            // Attenuate linearly with distance: at DETECT_RADIUS noise → 0.
            float effective = noise * (1.0f - (float) (dist / DETECT_RADIUS));

            if (effective > loudest) {
                loudest = effective;
                loudestPos = player.getPos();
            }
        }

        if (loudest >= ALERT_THRESHOLD && loudestPos != null) {
            lurker.alertTo(loudestPos);
        }
    }

    /**
     * Returns the base noise level emitted by {@code player}.
     *
     * <p>Both {@code isSneaking()} and {@code isSprinting()} are synced
     * to the server, so reading them here is accurate.</p>
     */
    private static float noiseLevel(PlayerEntity player) {
        if (player.isSneaking())  return 0.0f;   // silent
        if (player.isSprinting()) return 1.5f;   // loud
        // Moving but not sprinting (walking)
        if (player.getVelocity().horizontalLengthSquared() > 0.001) return 0.6f;
        return 0.0f;   // standing still
    }

    /**
     * Attempts to set the nearest player (within 3 blocks) as the melee
     * target so that the higher-priority {@code MeleeAttackGoal} can
     * take over and deal damage.
     */
    private void acquireMeleeTarget() {
        List<PlayerEntity> close = lurker.getWorld().getEntitiesByClass(
                PlayerEntity.class,
                lurker.getBoundingBox().expand(3.0),
                EntityPredicates.EXCEPT_CREATIVE_OR_SPECTATOR);
        if (!close.isEmpty()) {
            lurker.setTarget(close.get(0));
        }
    }

    /** Navigates to the last heard position at chase speed. */
    private void navigateToLastHeard() {
        Vec3d pos = lurker.getLastHeardPos();
        if (pos == null) return;
        var path = lurker.getNavigation().findPathTo(pos.x, pos.y, pos.z, 0);
        if (path != null) {
            // 1.4 speed multiplier = fast chase (base speed is 0.25, so ≈0.35 blocks/tick)
            lurker.getNavigation().startMovingAlong(path, 1.4);
        }
    }
}
