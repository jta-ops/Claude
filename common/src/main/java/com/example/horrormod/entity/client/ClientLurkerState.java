package com.example.horrormod.entity.client;

import net.fabricmc.api.EnvType;
import net.fabricmc.api.Environment;

/**
 * Client-side state for Lurker-triggered effects.
 *
 * <p>The server sends a {@code lurker_enrage} packet the moment the Lurker
 * is enraged by a player looking at its face.  The client receiver (in
 * {@code HorrorModClient}) sets {@link #jumpscareTicks} to its initial value;
 * a {@code ClientTickEvents} listener decrements it each tick.</p>
 *
 * <p>{@link com.example.horrormod.entity.client.LurkerJumpscareRenderer}
 * reads this value each frame to draw a fading red vignette overlay.</p>
 */
@Environment(EnvType.CLIENT)
public final class ClientLurkerState {

    /**
     * Counts down from {@code 40} (2 seconds) to {@code 0}.
     * While {@code > 0}, the jumpscare red flash is rendered.
     * Reset to 40 each time a {@code lurker_enrage} packet arrives.
     */
    public static int jumpscareTicks = 0;

    private ClientLurkerState() {}
}
