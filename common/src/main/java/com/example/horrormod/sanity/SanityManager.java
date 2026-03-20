package com.example.horrormod.sanity;

/**
 * Pure-Java state machine for the sanity system.
 *
 * <h2>What is the sanity system?</h2>
 * <p>Every player has a sanity value between 0 (fully insane) and 100 (fully
 * sane).  It drains when the player is in darkness, near horror mobs, or
 * inside a cursed biome/structure.  It restores when the player sleeps, stays
 * in bright light, or consumes a herbal remedy item.</p>
 *
 * <p>At low sanity the game starts doing frightening things:</p>
 * <ul>
 *   <li>{@code < 40} — minor visual distortions, occasional fake sounds</li>
 *   <li>{@code < 20} — full hallucinations: phantom mobs, heavy distortions</li>
 * </ul>
 *
 * <h2>Why is this in common/?</h2>
 * <p>This class has zero Minecraft imports.  It only tracks a float and
 * computes thresholds.  The version-specific code (applying potion effects,
 * rendering the sanity bar, spawning phantom entities) will live in each
 * version subproject and call these methods.</p>
 *
 * <h2>Usage in version-specific code</h2>
 * <pre>
 *   // Stored on a player (e.g. via Fabric's PlayerApiUtil or a Mixin)
 *   SanityManager sanity = new SanityManager(SanityManager.MAX_SANITY);
 *
 *   // Called each tick:
 *   if (isInDarkness) sanity.drain(SanityManager.DRAIN_IN_DARKNESS);
 *   if (isInLight)    sanity.restore(SanityManager.RESTORE_IN_LIGHT);
 *
 *   if (sanity.isCritical()) { // spawn hallucinations ... }
 * </pre>
 */
public class SanityManager {

    // -----------------------------------------------------------------------
    // Constants — drain / restore rates are per game tick (20 ticks = 1 s)
    // -----------------------------------------------------------------------

    public static final float MAX_SANITY = 100f;
    public static final float MIN_SANITY =   0f;

    /** Drained each tick while the player is in darkness (light level < 4). */
    public static final float DRAIN_IN_DARKNESS    = 0.05f;

    /** Drained each tick while a horror mob is within 16 blocks. */
    public static final float DRAIN_NEAR_MONSTER   = 0.10f;

    /** Drained each tick while inside the Ashwood Forest biome or Cursed Ruins. */
    public static final float DRAIN_IN_CURSED_ZONE = 0.08f;

    /** Restored each tick while the player is in bright light (level ≥ 10). */
    public static final float RESTORE_IN_LIGHT     = 0.03f;

    /** Flat bonus applied when the player wakes from sleep. */
    public static final float RESTORE_FROM_SLEEP   = 20f;

    /** Flat bonus when the player consumes a Herbal Remedy item. */
    public static final float RESTORE_FROM_REMEDY  = 35f;

    // -----------------------------------------------------------------------
    // Thresholds
    // -----------------------------------------------------------------------

    /**
     * Below this value: minor effects begin.
     * (screen vignette darkens, occasional fake footstep sounds)
     */
    public static final float THRESHOLD_LOW      = 40f;

    /**
     * Below this value: full hallucinations.
     * (phantom mobs appear, severe visual distortion, fake mob sounds)
     */
    public static final float THRESHOLD_CRITICAL = 20f;

    // -----------------------------------------------------------------------
    // State
    // -----------------------------------------------------------------------

    private float sanity;

    // -----------------------------------------------------------------------
    // Constructor
    // -----------------------------------------------------------------------

    /**
     * Creates a SanityManager with the given starting value.
     * The value is clamped to [MIN_SANITY, MAX_SANITY].
     */
    public SanityManager(float initialSanity) {
        this.sanity = clamp(initialSanity, MIN_SANITY, MAX_SANITY);
    }

    // -----------------------------------------------------------------------
    // Mutators
    // -----------------------------------------------------------------------

    /**
     * Drain sanity by {@code amount} (pass a positive number to make the
     * player more insane).  Floors at {@link #MIN_SANITY}.
     */
    public void drain(float amount) {
        sanity = Math.max(MIN_SANITY, sanity - amount);
    }

    /**
     * Restore sanity by {@code amount} (pass a positive number to make the
     * player more sane).  Caps at {@link #MAX_SANITY}.
     */
    public void restore(float amount) {
        sanity = Math.min(MAX_SANITY, sanity + amount);
    }

    /** Sets sanity to exactly {@code value}, clamped to valid range. */
    public void set(float value) {
        sanity = clamp(value, MIN_SANITY, MAX_SANITY);
    }

    // -----------------------------------------------------------------------
    // Accessors
    // -----------------------------------------------------------------------

    /** Current sanity value in the range [0, 100]. */
    public float getSanity() { return sanity; }

    /** Sanity as a fraction in [0.0, 1.0]. Useful for rendering a progress bar. */
    public float getSanityPercent() { return sanity / MAX_SANITY; }

    /** {@code true} when sanity has dropped below {@link #THRESHOLD_LOW}. */
    public boolean isLow() { return sanity < THRESHOLD_LOW; }

    /** {@code true} when sanity has dropped below {@link #THRESHOLD_CRITICAL}. */
    public boolean isCritical() { return sanity < THRESHOLD_CRITICAL; }

    /** {@code true} when sanity is at maximum. */
    public boolean isFull() { return sanity >= MAX_SANITY; }

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    // Note: Java 21 has Math.clamp for int/long/double but NOT float,
    // so we roll our own one-liner.
    private static float clamp(float value, float min, float max) {
        return Math.max(min, Math.min(max, value));
    }
}
