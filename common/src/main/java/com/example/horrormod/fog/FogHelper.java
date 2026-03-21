package com.example.horrormod.fog;

import com.example.horrormod.sanity.ClientSanityState;
import com.example.horrormod.sanity.SanityManager;
import net.fabricmc.api.EnvType;
import net.fabricmc.api.Environment;
import net.minecraft.client.MinecraftClient;

/**
 * Pure fog-mathematics helper used by {@link MixinFogRenderer}.
 *
 * <h2>Design</h2>
 * <p>All the "should we thicken fog?" logic lives here, with no Blaze3D or
 * rendering-pipeline imports.  {@link MixinFogRenderer} handles the
 * actual {@code RenderSystem} calls so this class stays testable and
 * easy to read.</p>
 *
 * <h2>Fog thickening sources</h2>
 * <ol>
 *   <li><b>Night-time</b> — when the sun is below the horizon the fog
 *       distance shrinks to ~55 % of normal.</li>
 *   <li><b>Low sanity</b> — at full sanity no extra fog.  At zero sanity
 *       the fog is at 35 % of normal, closing in around the player.</li>
 *   <li><b>Cursed zone</b> (TODO) — the Ashwood Forest biome will add a
 *       further multiplier once biomes are registered.</li>
 * </ol>
 *
 * <h2>Why this class lives in common/</h2>
 * <p>Only uses {@code MinecraftClient}, {@code World.getSkyAngle()}, and
 * {@code World.getDimension().hasSkyLight()} — all stable across 1.20.1
 * and 1.21.1.</p>
 */
@Environment(EnvType.CLIENT)
public final class FogHelper {

    // -----------------------------------------------------------------------
    // Fog multiplier constants
    // -----------------------------------------------------------------------

    /** Night fog: shrink render distance to this fraction. */
    private static final float NIGHT_MULTIPLIER   = 0.55f;

    /**
     * Sanity-fog range.
     * At {@code MAX_SANITY}: fog multiplier contribution = {@code SANITY_FOG_MAX} (1.0, no change).
     * At {@code MIN_SANITY}: fog multiplier contribution = {@code SANITY_FOG_MIN} (0.35, very close fog).
     */
    private static final float SANITY_FOG_MIN = 0.35f;
    private static final float SANITY_FOG_MAX = 1.00f;

    /**
     * Sky-angle range that counts as "night".
     * {@code getSkyAngle()} returns 0.0 at noon and wraps through 0.5 at midnight.
     * Values between 0.26 and 0.74 represent dusk → midnight → dawn.
     */
    private static final float NIGHT_START = 0.26f;
    private static final float NIGHT_END   = 0.74f;

    // -----------------------------------------------------------------------
    // Public API
    // -----------------------------------------------------------------------

    /**
     * Returns {@code true} if the horror fog system should modify the current
     * frame's fog at all.
     *
     * <p>Returns {@code false} in dimensions without a sky (Nether, End) so
     * we do not interfere with their built-in fog effects.</p>
     */
    public static boolean isActive() {
        MinecraftClient client = MinecraftClient.getInstance();
        if (client.world == null || client.player == null) return false;
        // hasSkyLight() is true in the Overworld only.
        return client.world.getDimension().hasSkyLight();
    }

    /**
     * Computes the fog-distance multiplier for the current frame.
     *
     * <p>A value of {@code 1.0} means "vanilla fog, no change".  Lower values
     * mean denser fog (fog end is {@code viewDistance * multiplier}).</p>
     *
     * <p>Multiply vanilla fog start/end by this value to get the modified
     * distances.  The caller ({@link MixinFogRenderer}) applies them via
     * {@code RenderSystem.setShaderFogStart/End}.</p>
     *
     * @return a multiplier in the range [{@link #SANITY_FOG_MIN}, 1.0].
     */
    public static float computeFogMultiplier() {
        MinecraftClient client = MinecraftClient.getInstance();
        if (client.world == null) return 1.0f;

        float multiplier = 1.0f;

        // ── Night-time fog ───────────────────────────────────────────────
        // getSkyAngle(1.0f) returns the sky rotation (0.0–1.0) at the current
        // tick.  Passing 1.0f means "no interpolation, use current tick".
        float skyAngle = client.world.getSkyAngle(1.0f);
        boolean isNight = skyAngle > NIGHT_START && skyAngle < NIGHT_END;
        if (isNight) {
            multiplier *= NIGHT_MULTIPLIER;
        }

        // ── Sanity-driven fog ────────────────────────────────────────────
        // sanityFraction: 1.0 = full sanity, 0.0 = totally insane.
        // Lerp between SANITY_FOG_MIN and SANITY_FOG_MAX based on sanity.
        float sanityFraction = ClientSanityState.sanity / SanityManager.MAX_SANITY;
        float sanityMod = SANITY_FOG_MIN + sanityFraction * (SANITY_FOG_MAX - SANITY_FOG_MIN);
        multiplier *= sanityMod;

        // ── Cursed-zone fog (placeholder) ────────────────────────────────
        // TODO: when the Ashwood Forest biome is registered, add:
        //   if (isInAshwoodForest(client.player)) multiplier *= 0.60f;

        return multiplier;
    }

    private FogHelper() {}
}
