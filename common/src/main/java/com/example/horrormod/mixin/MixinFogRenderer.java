package com.example.horrormod.mixin;

import com.example.horrormod.fog.FogHelper;
import com.mojang.blaze3d.systems.RenderSystem;
import net.fabricmc.api.EnvType;
import net.fabricmc.api.Environment;
import net.minecraft.client.render.BackgroundRenderer;
import net.minecraft.client.render.Camera;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfo;

/**
 * Mixin that modifies Minecraft's fog rendering to create the horror atmosphere.
 *
 * <h2>Injection point</h2>
 * <p>We inject at the {@code RETURN} of {@code BackgroundRenderer.applyFog()}.
 * By the time our code runs, vanilla has already called
 * {@code RenderSystem.setShaderFogStart/End()} with its own values.  We
 * then overwrite those values with our adjusted (denser) fog distances.</p>
 *
 * <h2>What we modify</h2>
 * <ul>
 *   <li><b>Fog end</b>  = {@code viewDistance × multiplier}  (where fog is fully opaque)</li>
 *   <li><b>Fog start</b> = {@code fog end × 0.75}            (where fog begins to appear)</li>
 * </ul>
 * <p>The multiplier is computed by {@link FogHelper} and includes night-time
 * and sanity factors.</p>
 *
 * <h2>Why we only change FOG_TERRAIN, not FOG_SKY</h2>
 * <p>{@code FOG_TERRAIN} controls ground-level view distance (the fog you
 * "walk through").  {@code FOG_SKY} controls the horizon haze on clear days.
 * Modifying only terrain fog gives a ground-level claustrophobic effect
 * without breaking the skybox.</p>
 *
 * <h2>Version compatibility: 1.20.1 and 1.21.1</h2>
 * <p>The {@code applyFog} signature is:
 * {@code (Camera, BackgroundRenderer.FogType, float viewDistance, boolean thickenFog, float tickDelta)}
 * in <em>both</em> versions.  The {@code RenderTickCounter} introduced in 1.21
 * affects callers higher up the call chain ({@code GameRenderer.renderWorld}),
 * but the resolved {@code float tickDelta} is still passed down to
 * {@code applyFog} as a primitive — no change here.</p>
 *
 * <p>If a future Minecraft version changes this signature, move this class
 * to each version's own {@code mixin/} folder and update the parameters.</p>
 *
 * <h2>Why Mixin and not a Fabric API event?</h2>
 * <p>Fabric API does not expose a dedicated fog-modification event.  Injecting
 * via Mixin into {@code BackgroundRenderer.applyFog} is the established
 * community approach for custom fog.</p>
 */
@Environment(EnvType.CLIENT)
@Mixin(BackgroundRenderer.class)
public abstract class MixinFogRenderer {

    /**
     * Injects at the end of {@code BackgroundRenderer.applyFog} to apply
     * horror-mode fog distances.
     *
     * <p>Parameter names must match the target method exactly for Mixin to
     * capture them.  They are:
     * <ol>
     *   <li>{@code camera}       — the active camera.</li>
     *   <li>{@code fogType}      — {@code FOG_TERRAIN} or {@code FOG_SKY}.</li>
     *   <li>{@code viewDistance} — the fog far-plane in blocks (proportional
     *       to the Render Distance setting).</li>
     *   <li>{@code thickenFog}   — vanilla flag set e.g. inside lava/blindness.</li>
     *   <li>{@code tickDelta}    — partial tick for smooth animation.</li>
     * </ol>
     */
    @Inject(method = "applyFog", at = @At("RETURN"))
    private static void horrormod_applyFog(
            Camera camera,
            BackgroundRenderer.FogType fogType,
            float viewDistance,
            boolean thickenFog,
            float tickDelta,
            CallbackInfo ci) {

        // Only active in the Overworld
        if (!FogHelper.isActive()) return;

        // Only modify ground-level fog; leave sky fog alone
        if (fogType != BackgroundRenderer.FogType.FOG_TERRAIN) return;

        float multiplier = FogHelper.computeFogMultiplier();

        // If multiplier == 1.0 we have nothing to do
        if (multiplier >= 1.0f) return;

        // Overwrite vanilla fog distances.
        // RenderSystem.setShaderFogStart/End are Blaze3D methods that set the
        // GLSL fog uniform for the current frame.  Stable since 1.17.
        float fogEnd   = viewDistance * multiplier;
        float fogStart = fogEnd * 0.75f;

        RenderSystem.setShaderFogStart(fogStart);
        RenderSystem.setShaderFogEnd(fogEnd);
    }
}
