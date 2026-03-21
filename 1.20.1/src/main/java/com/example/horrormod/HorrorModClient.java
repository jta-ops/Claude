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
import net.minecraft.client.sound.PositionedSoundInstance;
import net.minecraft.sound.SoundCategory;

/**
 * Client-only entry point for Minecraft 1.20.1.
 *
 * <h2>Version difference: HudRenderCallback signature</h2>
 * <p>1.20.1 → raw {@code float tickDelta}.
 * 1.21.1 → {@code RenderTickCounter} (see that version's file).</p>
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
                    // Only trigger if not already mid-jumpscare
                    if (ClientLurkerState.jumpscareTicks <= 0) {
                        ClientLurkerState.jumpscareTicks = 40;
                        // Non-positional shriek — plays at full volume wherever you are
                        client.getSoundManager().play(
                                PositionedSoundInstance.master(
                                        com.example.horrormod.sound.ModSounds.LURKER_GROWL,
                                        0.7f));  // pitch 0.7 = low and menacing
                    }
                }));

        // ── HUD: sanity bar — 1.20.1 signature (raw float) ───────────────
        HudRenderCallback.EVENT.register(
                (ctx, tickDelta) -> SanityHudRenderer.render(ctx, tickDelta));

        // ── HUD: jumpscare red flash — same signature ─────────────────────
        HudRenderCallback.EVENT.register(
                (ctx, tickDelta) -> LurkerJumpscareRenderer.render(ctx, tickDelta));
    }
}
