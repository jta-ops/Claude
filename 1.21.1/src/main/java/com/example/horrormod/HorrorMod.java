package com.example.horrormod;

import net.fabricmc.api.ModInitializer;

/**
 * Server-side (and shared) mod entry point for Minecraft 1.21.1.
 *
 * <p>Mirrors the structure of the 1.20.1 version exactly — the differences
 * between versions will appear inside the feature-specific registry classes
 * (ModEntities, ModBiomes, etc.), not here.</p>
 *
 * @see com.example.horrormod.HorrorModClient  client-only counterpart
 */
public class HorrorMod implements ModInitializer {

    @Override
    public void onInitialize() {
        // 1. Shared startup
        HorrorModCommon.initialize();

        // 2. Version-specific registrations (added feature by feature):
        //
        //    ModEntities.register();   // The Lurker, Watcher, Hollow
        //    ModBiomes.register();     // Ashwood Forest
        //    ModSounds.register();     // Ambient horror sounds
        //    ModItems.register();      // Herbal Remedy, etc.
        //
        HorrorModCommon.LOGGER.info("Horror Mod (1.21.1) loaded successfully.");
    }
}
