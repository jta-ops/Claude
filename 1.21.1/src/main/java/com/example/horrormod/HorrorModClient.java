package com.example.horrormod;

import com.example.horrormod.entity.LurkerPackets;
import com.example.horrormod.entity.ModEntities;
import com.example.horrormod.entity.client.ClientLurkerState;
import com.example.horrormod.entity.client.LurkerJumpscareRenderer;
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
import net.minecraft.client.sound.PositionedSoundInstance;

/**
 * Client-only entry point for Minecraft 1.21.1.
 *
 * <h2>Version difference: HudRenderCallback signature</h2>
 * <p>1.21.1 → {@code RenderTickCounter}; extract float with
 * {@code counter.getTickDelta(true)}.  1.20.1 uses a raw float.</p>
 */
@Environment(EnvType.CLIENT)
public class HorrorModClient implements ClientModInitializer {

    private final AmbientSoundScheduler ambientSounds = new AmbientSoundScheduler();

    @Override
    public void onInitializeClient() {
        // ── Entity renderers + model layers ───────────────────────────────
        ModEntities.registerRenderers();

        // ── Client tick: ambient sounds + jumpscare countdown ─────────────
        ClientTickEvents.END_CLIENT_TICK.register(client -> {
            ambientSounds.tick(client);
            LurkerJumpscareRenderer.clientTick();
        });

        // ── Sanity sync packet ────────────────────────────────────────────
        ClientPlayNetworking.registerGlobalReceiver(
                SanityNetworking.SANITY_SYNC_PACKET,
                (client, handler, buf, responseSender) -> {
                    float received = buf.readFloat();
                    client.execute(() -> ClientSanityState.sanity = received);
                });

        // ── Lurker enrage / jumpscare packet ──────────────────────────────
        ClientPlayNetworking.registerGlobalReceiver(
                LurkerPackets.LURKER_ENRAGE,
                (client, handler, buf, responseSender) -> client.execute(() -> {
                    if (ClientLurkerState.jumpscareTicks <= 0) {
                        ClientLurkerState.jumpscareTicks = 40;
                        client.getSoundManager().play(
                                PositionedSoundInstance.master(
                                        com.example.horrormod.sound.ModSounds.LURKER_GROWL,
                                        0.7f));
                    }
                }));

        // ── HUD: sanity bar — 1.21.1 signature (RenderTickCounter) ───────
        HudRenderCallback.EVENT.register((ctx, counter) ->
                SanityHudRenderer.render(ctx, ((RenderTickCounter) counter).getTickDelta(true)));

        // ── HUD: jumpscare red flash — same signature ─────────────────────
        HudRenderCallback.EVENT.register((ctx, counter) ->
                LurkerJumpscareRenderer.render(ctx, ((RenderTickCounter) counter).getTickDelta(true)));
    }
}
