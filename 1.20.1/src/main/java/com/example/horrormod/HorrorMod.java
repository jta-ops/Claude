package com.example.horrormod;

import com.example.horrormod.sanity.SanityTracker;
import com.example.horrormod.sound.ModSounds;
import net.fabricmc.api.ModInitializer;

/**
 * Server-side (and shared) mod entry point for Minecraft 1.20.1.
 */
public class HorrorMod implements ModInitializer {

    @Override
    public void onInitialize() {
        // 1. Shared startup log
        HorrorModCommon.initialize();

        // 2. Register sound events (forces class-loading of ModSounds,
        //    which registers all SoundEvent objects with the MC registry).
        ModSounds.register();

        // 3. Wire up the sanity system:
        //      - ServerTickEvents  → tick every player's sanity each game tick
        //      - ServerPlayConnectionEvents.JOIN/DISCONNECT → manage the UUID map
        //      - ServerPlayerEvents.AFTER_RESPAWN → re-send sanity after respawn
        SanityTracker.registerEvents();

        // Future registrations:
        //   ModItems.register();    // Herbal Remedy
        //   ModEntities.register(); // The Lurker, Watcher, Hollow
        //   ModBiomes.register();   // Ashwood Forest

        HorrorModCommon.LOGGER.info("Horror Mod (1.20.1) loaded successfully.");
    }
}
