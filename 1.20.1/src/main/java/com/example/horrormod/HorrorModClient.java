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

/**
 * Client-only entry point for Minecraft 1.20.1.
 *
 * <h2>Version difference: HudRenderCallback (★ only real split between versions ★)</h2>
 *
 * <p><b>1.20.1</b> — Fabric API passes a raw {@code float tickDelta}:</p>
 * <pre>
 *   HudRenderCallback.EVENT.register(
 *       (DrawContext ctx, float tickDelta) -> SanityHudRenderer.render(ctx, tickDelta));
 * </pre>
 *
 * <p><b>1.21.1</b> — Fabric API passes a {@code RenderTickCounter} instead.
 * See {@code 1.21.1/HorrorModClient.java} for that version's registration.
 * The renderer itself ({@link SanityHudRenderer}) is in {@code common/} and
 * handles both, because both versions call {@code render(ctx, float)}.</p>
 *
 * <p>Everything else in this file is identical to the 1.21.1 version.</p>
 */
@Environment(EnvType.CLIENT)
public class HorrorModClient implements ClientModInitializer {

    private final AmbientSoundScheduler ambientSounds = new AmbientSoundScheduler();

    @Override
    public void onInitializeClient() {
        HorrorModCommon.LOGGER.info("Horror Mod client (1.20.1) initializing.");

        // ── Ambient sound scheduler ───────────────────────────────────────
        ClientTickEvents.END_CLIENT_TICK.register(ambientSounds::tick);

        // ── Sanity sync packet receiver ───────────────────────────────────
        // The server sends a single float every ~20 ticks.  We store it in
        // ClientSanityState so the HUD and fog can read it.
        //
        // Lambda signature for 1.20.1 FAPI PlayChannelHandler:
        //   (MinecraftClient client, ClientPlayNetworkHandler handler,
        //    PacketByteBuf buf, PacketSender responseSender)
        //
        // client.execute() schedules the write on the main thread, which is
        // required because ClientPlayNetworking fires on the network thread.
        ClientPlayNetworking.registerGlobalReceiver(
                SanityNetworking.SANITY_SYNC_PACKET,
                (client, handler, buf, responseSender) -> {
                    float receivedSanity = buf.readFloat();
                    client.execute(() -> ClientSanityState.sanity = receivedSanity);
                });

        // ── Sanity HUD bar ── 1.20.1-specific signature ───────────────────
        // In 1.20.1 the second parameter is a raw float (partial tick).
        HudRenderCallback.EVENT.register(
                (ctx, tickDelta) -> SanityHudRenderer.render(ctx, tickDelta));

        // ── Future client registrations ───────────────────────────────────
        //
        // Entity renderers:
        //   EntityRendererRegistry.register(ModEntities.LURKER, LurkerRenderer::new);
        //
        // Dynamic fog is handled automatically by MixinFogRenderer — no
        // explicit registration needed here.
    }
}
