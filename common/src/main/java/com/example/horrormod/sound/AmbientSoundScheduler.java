package com.example.horrormod.sound;

import com.example.horrormod.HorrorModCommon;
import net.fabricmc.api.EnvType;
import net.fabricmc.api.Environment;
import net.minecraft.client.MinecraftClient;
import net.minecraft.client.sound.PositionedSoundInstance;
import net.minecraft.sound.SoundEvent;

/**
 * Client-side scheduler that randomly plays ambient horror sounds.
 *
 * <h2>What it does</h2>
 * <p>Every game tick (20 ticks = 1 second) this class counts down an internal
 * timer.  When the timer hits zero it checks whether the player is in a
 * condition that warrants a horror sound, picks one from a weighted list, plays
 * it through the player's speakers, and resets the timer.</p>
 *
 * <h2>Conditions checked</h2>
 * <ul>
 *   <li><b>Darkness</b> — block-light level ≤ 4 at the player's feet</li>
 *   <li><b>Underground</b> — player Y below 64</li>
 * </ul>
 * <p>Later, when biomes are implemented, we will add a third condition:
 * "inside the Ashwood Forest or near Cursed Ruins".</p>
 *
 * <h2>Why this class lives in common/</h2>
 * <p>The MC APIs used here ({@code MinecraftClient}, {@code PositionedSoundInstance},
 * {@code world.getLightLevel()}, {@code world.random}) have the same package
 * paths and method signatures in both 1.20.1 and 1.21.1, so a single copy
 * compiles correctly for both versions.</p>
 *
 * <p>The {@code @Environment(EnvType.CLIENT)} annotation tells Fabric Loader
 * to strip this class entirely on dedicated servers, preventing any crash.</p>
 *
 * <h2>How to hook it up (already done in HorrorModClient)</h2>
 * <pre>
 *   AmbientSoundScheduler scheduler = new AmbientSoundScheduler();
 *   ClientTickEvents.END_CLIENT_TICK.register(scheduler::tick);
 * </pre>
 */
@Environment(EnvType.CLIENT)
public class AmbientSoundScheduler {

    // -----------------------------------------------------------------------
    // Timing constants (all values are in game ticks; 20 ticks = 1 second)
    // -----------------------------------------------------------------------

    /** Minimum gap between ambient sounds: 15 seconds. */
    private static final int MIN_INTERVAL = 20 * 15;

    /** Random extra gap added on top of the minimum: up to 30 extra seconds. */
    private static final int RANDOM_EXTRA  = 20 * 30;

    /**
     * Light level at or below which we consider the player to be "in darkness".
     * Vanilla torches emit level 14; a completely unlit cave is level 0.
     * Level 4 means "very dim — one torch would need to be about 10 blocks away."
     */
    private static final int DARK_THRESHOLD = 4;

    // -----------------------------------------------------------------------
    // State
    // -----------------------------------------------------------------------

    /** Ticks remaining before the next ambient sound may play. */
    private int ticksUntilNext = MIN_INTERVAL;

    // -----------------------------------------------------------------------
    // Public API — called every tick by ClientTickEvents
    // -----------------------------------------------------------------------

    /**
     * Must be called every client tick.  Passed as a method reference:
     * {@code ClientTickEvents.END_CLIENT_TICK.register(scheduler::tick)}.
     *
     * @param client  the active {@link MinecraftClient} instance, provided
     *                by Fabric's tick event.
     */
    public void tick(MinecraftClient client) {

        // Guard: in-game only
        if (client.player == null || client.world == null) return;

        // Count down
        ticksUntilNext--;
        if (ticksUntilNext > 0) return;

        // Reset timer BEFORE the early-return checks so we never spin at 0
        ticksUntilNext = MIN_INTERVAL + client.world.random.nextInt(RANDOM_EXTRA);

        // -----------------------------------------------------------------------
        // Condition checks
        // -----------------------------------------------------------------------

        var player = client.player;
        var world  = client.world;

        int blockLight   = world.getLightLevel(player.getBlockPos());
        boolean dark     = blockLight <= DARK_THRESHOLD;
        boolean underground = player.getY() < 64;

        // Do not play ambient sounds in broad daylight at the surface
        if (!dark && !underground) return;

        // -----------------------------------------------------------------------
        // Sound selection (weighted)
        // -----------------------------------------------------------------------
        // roll is 0-9.  We weight each sound differently and add conditions.

        int roll = world.random.nextInt(10);

        SoundEvent chosen;
        if (roll < 3 && dark) {
            // 30 % — close breathing.  Only in actual darkness so it feels intimate.
            chosen = ModSounds.AMBIENT_BREATHING;
        } else if (roll < 5) {
            // 20 % — distant scream.  Works underground even with some light.
            chosen = ModSounds.AMBIENT_DISTANT_SCREAM;
        } else if (roll < 7 && dark) {
            // 20 % — phantom footsteps.  Dark only; most frightening of the set.
            chosen = ModSounds.AMBIENT_FOOTSTEPS;
        } else {
            // 30 % (fallback) — whisper.  Subtle, always valid underground.
            chosen = ModSounds.AMBIENT_WHISPER;
        }

        // -----------------------------------------------------------------------
        // Playback
        // -----------------------------------------------------------------------
        // PositionedSoundInstance.master() plays through the player's headphones
        // at the same volume regardless of where they are in the world.
        // The slight pitch variation (±10 %) keeps repeated plays from sounding
        // identical.
        //
        // Signature: master(SoundEvent event, float pitch)
        // This 2-argument overload exists in 1.20.1, 1.21.1, and beyond.

        float pitch = 0.9f + world.random.nextFloat() * 0.2f;
        client.getSoundManager().play(PositionedSoundInstance.master(chosen, pitch));

        HorrorModCommon.LOGGER.debug(
                "Played ambient sound '{}' (pitch={}, light={}, Y={})",
                chosen.getId(), pitch, blockLight, (int) player.getY());
    }

    // -----------------------------------------------------------------------
    // Package-private helpers (for future sanity integration)
    // -----------------------------------------------------------------------

    /**
     * Immediately resets the cooldown timer.
     * Useful when the sanity system wants to force an ambient sound sooner
     * (e.g. at critical sanity levels).
     */
    void resetCooldown() {
        ticksUntilNext = 0;
    }
}
