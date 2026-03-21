package com.example.horrormod.entity.goal;

import com.example.horrormod.entity.LurkerEntity;
import net.minecraft.entity.LivingEntity;
import net.minecraft.entity.ai.goal.Goal;

import java.util.EnumSet;

/**
 * Priority-1 goal that activates when the Lurker has been enraged by a
 * player looking directly at its face.
 *
 * <h2>SCP-096 "Shy Guy" behaviour</h2>
 * <p>Once triggered, the Lurker enters a relentless pursuit mode:</p>
 * <ul>
 *   <li>Sprints at 2.0× base speed (≈ 0.5 blocks/tick) — faster than the
 *       player's sprint.</li>
 *   <li>Does not stop until the target is dead or the 30-second timeout
 *       expires.</li>
 *   <li>Attacks directly every second when within melee range, bypassing
 *       the normal {@code MeleeAttackGoal}.</li>
 * </ul>
 *
 * <h2>Goal priority structure</h2>
 * <pre>
 *   1: LurkerEnrageGoal  ← this class  (highest — rage overrides everything)
 *   2: MeleeAttackGoal               (normal close attack for noise-hunt path)
 *   3: LurkerHuntGoal                (noise detection)
 *   4: WanderAroundFarGoal
 *   5: LookAroundGoal
 * </pre>
 *
 * <p>Because this goal claims {@code MOVE} and {@code LOOK}, it preempts all
 * lower-priority goals while active.  The attack is performed directly via
 * {@code MobEntity.tryAttack()} with a manual 20-tick cooldown.</p>
 *
 * <h2>Version compatibility</h2>
 * <p>{@code MobEntity.tryAttack(Entity)} and {@code EntityNavigation.startMovingTo}
 * are unchanged between 1.20.1 and 1.21.1.</p>
 */
public class LurkerEnrageGoal extends Goal {

    private static final double ENRAGE_SPEED     = 2.0;   // 2× base movement speed
    private static final double MELEE_REACH_SQ   = 4.0;   // 2-block melee range²
    private static final int    ATTACK_COOLDOWN  = 20;    // ticks between attacks (1 sec)

    private final LurkerEntity lurker;
    private int attackCooldown = 0;

    public LurkerEnrageGoal(LurkerEntity lurker) {
        this.lurker = lurker;
        this.setControls(EnumSet.of(Control.MOVE, Control.LOOK));
    }

    // -----------------------------------------------------------------------
    // Lifecycle
    // -----------------------------------------------------------------------

    @Override
    public boolean canStart() {
        return lurker.isEnraged() && lurker.getTarget() != null && lurker.getTarget().isAlive();
    }

    @Override
    public boolean shouldContinue() {
        LivingEntity target = lurker.getTarget();
        return lurker.isEnraged() && target != null && target.isAlive();
    }

    @Override
    public void start() {
        attackCooldown = 0;
    }

    @Override
    public void stop() {
        lurker.getNavigation().stop();
    }

    // -----------------------------------------------------------------------
    // Per-tick update
    // -----------------------------------------------------------------------

    @Override
    public void tick() {
        LivingEntity target = lurker.getTarget();
        if (target == null) return;

        // ── Face toward target ────────────────────────────────────────────
        // 30.0f = max yaw/pitch turn per tick (faster than vanilla)
        lurker.getLookControl().lookAt(target, 30.0f, 30.0f);

        // ── Sprint toward target ──────────────────────────────────────────
        // Re-path every 5 ticks to track a moving player
        if (lurker.age % 5 == 0) {
            lurker.getNavigation().startMovingTo(target, ENRAGE_SPEED);
        }

        // ── Melee attack ──────────────────────────────────────────────────
        if (attackCooldown > 0) {
            attackCooldown--;
        }
        if (attackCooldown == 0 && lurker.squaredDistanceTo(target) <= MELEE_REACH_SQ) {
            lurker.tryAttack(target);
            attackCooldown = ATTACK_COOLDOWN;
        }
    }
}
