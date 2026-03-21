package com.example.horrormod.sanity;

import com.example.horrormod.HorrorModCommon;
import net.fabricmc.fabric.api.networking.v1.PacketByteBufs;
import net.fabricmc.fabric.api.networking.v1.ServerPlayNetworking;
import net.minecraft.network.PacketByteBuf;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.util.Identifier;

/**
 * Networking constants and helpers for the sanity system.
 *
 * <h2>Flow</h2>
 * <pre>
 *   Server tick
 *     → SanityTracker.tickPlayer(player)
 *     → SanityNetworking.sendToPlayer(player, sanity)  ← this class
 *     → [packet travels over the network]
 *     → ClientPlayNetworking receiver (registered in HorrorModClient)
 *     → ClientSanityState.sanity = receivedValue
 *     → SanityHudRenderer reads ClientSanityState.sanity and draws the bar
 * </pre>
 *
 * <h2>API note — PacketByteBuf (legacy) vs CustomPayload (modern)</h2>
 * <p>Fabric API introduced a cleaner {@code CustomPayload}-based networking
 * system in 1.20.4+.  We intentionally use the older
 * {@code PacketByteBuf + Identifier} approach here because it compiles and
 * works on both 1.20.1 and 1.21.1.  The old API is deprecated in newer FAPI
 * versions but will not be removed mid-cycle.</p>
 *
 * <p>If you want to update to the modern approach, see the FAPI wiki for
 * {@code ServerPlayNetworking.send(player, payload)} with a custom
 * {@code CustomPayload} record.</p>
 */
public class SanityNetworking {

    /**
     * Channel identifier for the server→client sanity sync packet.
     * Must be unique — using mod ID + descriptive path is the convention.
     */
    public static final Identifier SANITY_SYNC_PACKET =
            new Identifier(HorrorModCommon.MOD_ID, "sanity_sync");

    /**
     * Sends the player's current sanity value to their game client.
     *
     * <p>Called server-side from {@link SanityTracker#tickPlayer} every second.
     * The packet contains a single {@code float} (the sanity value).</p>
     *
     * @param player  the target player (must be online).
     * @param sanity  the current sanity value (0–100).
     */
    public static void sendToPlayer(ServerPlayerEntity player, float sanity) {
        PacketByteBuf buf = PacketByteBufs.create();
        buf.writeFloat(sanity);
        ServerPlayNetworking.send(player, SANITY_SYNC_PACKET, buf);
    }
}
