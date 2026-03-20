package com.example.horrormod;

import com.example.horrormod.sound.ModSounds;
import net.fabricmc.api.ModInitializer;

/**
 * Server-side (and shared) mod entry point for Minecraft 1.21.1.
 *
 * <p>Mirrors 1.20.1/HorrorMod.java exactly — version differences appear
 * inside feature classes, not here.</p>
 */
public class HorrorMod implements ModInitializer {

    @Override
    public void onInitialize() {
        HorrorModCommon.initialize();
        ModSounds.register();

        // Future registrations:
        //   ModItems.register();
        //   ModEntities.register();
        //   ModBiomes.register();

        HorrorModCommon.LOGGER.info("Horror Mod (1.21.1) loaded successfully.");
    }
}
