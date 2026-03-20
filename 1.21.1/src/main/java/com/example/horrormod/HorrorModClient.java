package com.example.horrormod;

import com.example.horrormod.sound.AmbientSoundScheduler;
import net.fabricmc.api.ClientModInitializer;
import net.fabricmc.api.EnvType;
import net.fabricmc.api.Environment;
import net.fabricmc.fabric.api.client.event.lifecycle.v1.ClientTickEvents;

/**
 * Client-only entry point for Minecraft 1.21.1.
 *
 * <p>Structurally identical to the 1.20.1 version right now.  The two files
 * will diverge when we add the sanity HUD bar — 1.21.1 uses a different
 * {@code HudRenderCallback} signature (see comment below).</p>
 *
 * <h2>1.21.1 vs 1.20.1 difference: HudRenderCallback</h2>
 * <p>In 1.21.1:</p>
 * <pre>
 *   HudRenderCallback.EVENT.register(
 *       (DrawContext ctx, RenderTickCounter counter) -> {
 *           float tickDelta = counter.getTickDelta(true);
 *           SanityHudRenderer.render(ctx, tickDelta);
 *       });
 * </pre>
 */
@Environment(EnvType.CLIENT)
public class HorrorModClient implements ClientModInitializer {

    private final AmbientSoundScheduler ambientSounds = new AmbientSoundScheduler();

    @Override
    public void onInitializeClient() {
        HorrorModCommon.LOGGER.info("Horror Mod client (1.21.1) initializing.");

        ClientTickEvents.END_CLIENT_TICK.register(ambientSounds::tick);

        // Future client registrations:
        //
        // ── Sanity HUD bar ── 1.21.1-specific signature ──
        //   HudRenderCallback.EVENT.register(
        //       (DrawContext ctx, RenderTickCounter counter) -> {
        //           float td = counter.getTickDelta(true);
        //           SanityHudRenderer.render(ctx, td);
        //       });
        //
        // ── Entity renderers ─────────────────────────────
        //   EntityRendererRegistry.register(ModEntities.LURKER, LurkerRenderer::new);
        //
        // ── Dynamic fog ──────────────────────────────────
        //   WorldRenderEvents.FOG_RENDERING.register(FogHandler::onFogRender);
    }
}
