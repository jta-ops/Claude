package com.example.horrormod;

import com.example.horrormod.entity.ModEntities;
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
 * <h2>Version difference: HudRenderCallback</h2>
 * <p>1.21.1 passes a {@code RenderTickCounter}; extract the float via
 * {@code counter.getTickDelta(true)}. Everything else is identical to 1.20.1.</p>
 */
@Environment(EnvType.CLIENT)
public class HorrorModClient implements ClientModInitializer {

    private final AmbientSoundScheduler ambientSounds = new AmbientSoundScheduler();

    @Override
    public void onInitializeClient() {
        // ── Entity renderers + model layers ───────────────────────────────
        ModEntities.registerRenderers();

        // ── Ambient sound scheduler ───────────────────────────────────────
        ClientTickEvents.END_CLIENT_TICK.register(ambientSounds::tick);

        // ── Sanity sync packet receiver ───────────────────────────────────
        ClientPlayNetworking.registerGlobalReceiver(
                SanityNetworking.SANITY_SYNC_PACKET,
                (client, handler, buf, responseSender) -> {
                    float received = buf.readFloat();
                    client.execute(() -> ClientSanityState.sanity = received);
                });

        // ── Sanity HUD bar — 1.21.1 signature ────────────────────────────
        HudRenderCallback.EVENT.register(
                (ctx, counter) ->
                        SanityHudRenderer.render(ctx, ((RenderTickCounter) counter).getTickDelta(true)));
    }
}
