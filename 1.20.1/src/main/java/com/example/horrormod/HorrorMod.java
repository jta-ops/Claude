package com.example.horrormod;

import net.fabricmc.api.ModInitializer;

/**
 * Server-side (and shared) mod entry point for Minecraft 1.20.1.
 *
 * <p>Fabric calls {@link #onInitialize()} once when the game starts, on the
 * logical server side.  This is where you register blocks, items, entities,
 * biomes, sounds, and any other game content.</p>
 *
 * <p>This class is declared as the {@code "main"} entrypoint in
 * {@code fabric.mod.json}.  The {@code "client"} entrypoint is handled by
 * {@link HorrorModClient}.</p>
 *
 * <p><b>Strategy:</b> Call {@link HorrorModCommon#initialize()} first to run
 * code shared with every version, then do 1.20.1-specific registration below.
 * As we add mobs, biomes, sounds, etc. we will create dedicated registry
 * classes (e.g. {@code ModEntities}, {@code ModSounds}) and call their
 * {@code register()} methods from here.</p>
 */
public class HorrorMod implements ModInitializer {

    @Override
    public void onInitialize() {
        // 1. Shared startup (logging, config, etc.)
        HorrorModCommon.initialize();

        // 2. Version-specific registrations will be added here as we build
        //    each feature.  For example:
        //
        //    ModEntities.register();   // The Lurker, Watcher, Hollow
        //    ModBiomes.register();     // Ashwood Forest
        //    ModSounds.register();     // Ambient horror sounds
        //    ModItems.register();      // Herbal Remedy, etc.
        //
        HorrorModCommon.LOGGER.info("Horror Mod (1.20.1) loaded successfully.");
    }
}
