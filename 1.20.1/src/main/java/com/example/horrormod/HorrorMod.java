package com.example.horrormod;

import com.example.horrormod.sound.ModSounds;
import net.fabricmc.api.ModInitializer;

/**
 * Server-side (and shared) mod entry point for Minecraft 1.20.1.
 *
 * <p>Fabric calls {@link #onInitialize()} once when the game starts, on the
 * logical server side.  Registrations that affect both client and server
 * (items, entities, sounds, biomes) happen here.</p>
 */
public class HorrorMod implements ModInitializer {

    @Override
    public void onInitialize() {
        // 1. Shared startup (logger setup, config loading later)
        HorrorModCommon.initialize();

        // 2. Sound events ― must be registered before the world loads
        ModSounds.register();

        // Future registrations (added one feature at a time):
        //   ModItems.register();    // Herbal Remedy, etc.
        //   ModEntities.register(); // The Lurker, Watcher, Hollow
        //   ModBiomes.register();   // Ashwood Forest

        HorrorModCommon.LOGGER.info("Horror Mod (1.20.1) loaded successfully.");
    }
}
