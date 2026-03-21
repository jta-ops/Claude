package com.example.horrormod;

import com.example.horrormod.sanity.ClientSanityState;
import com.example.horrormod.sanity.SanityHudRenderer;
import com.example.horrormod.sanity.SanityNetworking;
import com.example.horrormod.sound.AmbientSoundScheduler;
import net.fabricmc.api.ClientModInitializer;
import net.fabricmc.api.EnvType;
import net.fabricmc.api.Environment;
import net.fabricmc.fabric.api.client.event.lifecycle.v1.ClientTickEvents;
import net.fabricmc.fabric.api.client.networking.v1.ClientPlayNetworking;
import net.fabricmc.fabric.api.client.rendering.v1.HudRenderCallback;
import net.minecraft.client.render.RenderTickCounter;

/**
 * Client-only entry point for Minecraft 1.21.1.
 *
 * <h2>Version difference: HudRenderCallback (★ only real split between versions ★)</h2>
 *
 * <p><b>1.21.1</b> — Fabric API passes a {@code RenderTickCounter}.  Call
 * {@code getTickDelta(true)} to get the partial tick float:</p>
 * <pre>
 *   HudRenderCallback.EVENT.register(
 *       (DrawContext ctx, RenderTickCounter counter) ->
 *           SanityHudRenderer.render(ctx, counter.getTickDelta(true)));
 * </pre>
 *
 * <p>{@code RenderTickCounter} is a 1.21 class.  Importing it here is fine
 * because this file only compiles against the 1.21.1 Minecraft jar.  It would
 * not compile in the 1.20.1 subproject, which is exactly why each version has
 * its own {@code HorrorModClient.java}.</p>
 */
@Environment(EnvType.CLIENT)
public class HorrorModClient implements ClientModInitializer {

    private final AmbientSoundScheduler ambientSounds = new AmbientSoundScheduler();

    @Override
    public void onInitializeClient() {
        HorrorModCommon.LOGGER.info("Horror Mod client (1.21.1) initializing.");

        // ── Ambient sound scheduler ───────────────────────────────────────
        ClientTickEvents.END_CLIENT_TICK.register(ambientSounds::tick);

        // ── Sanity sync packet receiver ───────────────────────────────────
        ClientPlayNetworking.registerGlobalReceiver(
                SanityNetworking.SANITY_SYNC_PACKET,
                (client, handler, buf, responseSender) -> {
                    float receivedSanity = buf.readFloat();
                    client.execute(() -> ClientSanityState.sanity = receivedSanity);
                });

        // ── Sanity HUD bar ── 1.21.1-specific signature ───────────────────
        // RenderTickCounter was introduced in 1.21 as a replacement for raw
        // float tickDelta throughout the rendering pipeline.
        // getTickDelta(true) = use real-time interpolation (recommended).
        HudRenderCallback.EVENT.register(
                (ctx, counter) -> {
                    float tickDelta = ((RenderTickCounter) counter).getTickDelta(true);
                    SanityHudRenderer.render(ctx, tickDelta);
                });

        // ── Future client registrations ───────────────────────────────────
        //
        // Entity renderers:
        //   EntityRendererRegistry.register(ModEntities.LURKER, LurkerRenderer::new);
        //
        // Dynamic fog is handled automatically by MixinFogRenderer.
    }
}
