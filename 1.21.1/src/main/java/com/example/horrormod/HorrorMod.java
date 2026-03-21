package com.example.horrormod;

import com.example.horrormod.sanity.SanityTracker;
import com.example.horrormod.sound.ModSounds;
import net.fabricmc.api.ModInitializer;

/**
 * Server-side (and shared) mod entry point for Minecraft 1.21.1.
 * Identical to the 1.20.1 version — all version differences are inside
 * feature classes or HorrorModClient.
 */
public class HorrorMod implements ModInitializer {

    @Override
    public void onInitialize() {
        HorrorModCommon.initialize();
        ModSounds.register();
        SanityTracker.registerEvents();

        // Future registrations:
        //   ModItems.register();
        //   ModEntities.register();
        //   ModBiomes.register();

        HorrorModCommon.LOGGER.info("Horror Mod (1.21.1) loaded successfully.");
    }
}
