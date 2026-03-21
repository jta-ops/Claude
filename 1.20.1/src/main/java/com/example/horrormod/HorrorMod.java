package com.example.horrormod;

import com.example.horrormod.entity.ModEntities;
import com.example.horrormod.sanity.SanityTracker;
import com.example.horrormod.sound.ModSounds;
import net.fabricmc.api.ModInitializer;

public class HorrorMod implements ModInitializer {

    @Override
    public void onInitialize() {
        HorrorModCommon.initialize();
        ModSounds.register();
        ModEntities.register();
        SanityTracker.registerEvents();

        // Future: ModItems.register(), ModBiomes.register()

        HorrorModCommon.LOGGER.info("Horror Mod (1.20.1) loaded successfully.");
    }
}
