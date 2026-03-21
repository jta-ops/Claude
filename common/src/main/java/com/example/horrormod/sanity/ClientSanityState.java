package com.example.horrormod.sanity;

import net.fabricmc.api.EnvType;
import net.fabricmc.api.Environment;

/**
 * Client-side storage for the local player's sanity value.
 *
 * <p>The server owns the authoritative sanity value.  Every second the server
 * sends a {@code sanity_sync} packet; the {@code ClientPlayNetworking} receiver
 * (registered in {@code HorrorModClient}) writes the received float here.
 * All client-side code ({@link SanityHudRenderer}, {@link com.example.horrormod.fog.FogHelper},
 * {@link com.example.horrormod.sound.AmbientSoundScheduler}) reads from here.</p>
 *
 * <p>{@code @Environment(EnvType.CLIENT)} tells Fabric Loader to strip this
 * class entirely on a dedicated server, preventing a {@code ClassNotFoundException}.</p>
 */
@Environment(EnvType.CLIENT)
public final class ClientSanityState {

    /** The most recent sanity value received from the server (0–100). */
    public static float sanity = SanityManager.MAX_SANITY;

    // Pure data holder — no instances needed.
    private ClientSanityState() {}
}
