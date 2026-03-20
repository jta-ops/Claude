package com.example.horrormod;

import com.example.horrormod.sound.AmbientSoundScheduler;
import net.fabricmc.api.ClientModInitializer;
import net.fabricmc.api.EnvType;
import net.fabricmc.api.Environment;
import net.fabricmc.fabric.api.client.event.lifecycle.v1.ClientTickEvents;

/**
 * Client-only entry point for Minecraft 1.20.1.
 *
 * <p>Fabric calls {@link #onInitializeClient()} only when the game is running
 * as a client (not on a dedicated server).  Rendering, HUD, and audio
 * registrations live here.</p>
 *
 * <h2>1.20.1 vs 1.21.1 difference: HudRenderCallback</h2>
 * <p>When we add the sanity HUD bar, this file and its 1.21.1 counterpart
 * will diverge.  In 1.20.1:</p>
 * <pre>
 *   HudRenderCallback.EVENT.register((DrawContext ctx, float tickDelta) -> { … });
 * </pre>
 * <p>In 1.21.1 the second parameter changed to {@code RenderTickCounter}.
 * Everything else in this file is identical across both versions.</p>
 */
@Environment(EnvType.CLIENT)
public class HorrorModClient implements ClientModInitializer {

    /**
     * One instance per logical client.  Holds the countdown timer so its
     * state persists across ticks.
     */
    private final AmbientSoundScheduler ambientSounds = new AmbientSoundScheduler();

    @Override
    public void onInitializeClient() {
        HorrorModCommon.LOGGER.info("Horror Mod client (1.20.1) initializing.");

        // Register the ambient sound scheduler to run at the end of every
        // client tick.  'END_CLIENT_TICK' fires after the world has been
        // updated, which is what we want (so light levels are current).
        ClientTickEvents.END_CLIENT_TICK.register(ambientSounds::tick);

        // Future client registrations (same in both versions unless noted):
        //
        // ── Sanity HUD bar ── 1.20.1-specific signature ──
        //   HudRenderCallback.EVENT.register(
        //       (DrawContext ctx, float tickDelta) ->
        //           SanityHudRenderer.render(ctx, tickDelta));
        //
        // ── Entity renderers ─────────────────────────────
        //   EntityRendererRegistry.register(ModEntities.LURKER, LurkerRenderer::new);
        //
        // ── Dynamic fog ──────────────────────────────────
        //   WorldRenderEvents.FOG_RENDERING.register(FogHandler::onFogRender);
    }
}
