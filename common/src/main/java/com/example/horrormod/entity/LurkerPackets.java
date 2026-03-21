package com.example.horrormod.entity;

import com.example.horrormod.HorrorModCommon;
import net.fabricmc.fabric.api.networking.v1.PacketByteBufs;
import net.fabricmc.fabric.api.networking.v1.ServerPlayNetworking;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.util.Identifier;

/**
 * Packet identifiers and send helpers for Lurker-specific networking.
 *
 * <h2>Current packets</h2>
 * <ul>
 *   <li>{@link #LURKER_ENRAGE} — sent from server to client the instant the
 *       Lurker is enraged by a player looking at its face.  Triggers the
 *       red-flash jumpscare on the client.</li>
 * </ul>
 *
 * <h2>Version compatibility</h2>
 * <p>Uses the same legacy {@code PacketByteBuf + Identifier} API as
 * {@link com.example.horrormod.sanity.SanityNetworking} — works in both
 * 1.20.1 and 1.21.1.</p>
 */
public final class LurkerPackets {

    /**
     * Channel for the server → client "Lurker has spotted you" jumpscare.
     * Payload: empty (just receiving it is the trigger).
     */
    public static final Identifier LURKER_ENRAGE =
            new Identifier(HorrorModCommon.MOD_ID, "lurker_enrage");

    /**
     * Sends the jumpscare packet to {@code player}.
     * Safe to call every tick — the client rate-limits itself via
     * {@link com.example.horrormod.entity.client.ClientLurkerState#jumpscareTicks}.
     */
    public static void sendJumpscare(ServerPlayerEntity player) {
        ServerPlayNetworking.send(player, LURKER_ENRAGE, PacketByteBufs.empty());
    }

    private LurkerPackets() {}
}
