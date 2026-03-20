package com.example.horrormod;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Shared initialisation logic compiled into EVERY version of the mod.
 *
 * <p><b>Rule:</b> This class (and everything else in {@code common/}) must NOT
 * import any Minecraft or Fabric API class.  Minecraft's API changes between
 * versions, so any direct MC import here would break at least one build.
 * Put MC-specific code in the version subproject's own source tree instead.</p>
 *
 * <p>Safe to place in {@code common/}:</p>
 * <ul>
 *   <li>Constants and enums</li>
 *   <li>Pure-Java logic (sanity maths, config parsing, data structures)</li>
 *   <li>SLF4J logging (the API is provided by Fabric Loader on all versions)</li>
 * </ul>
 */
public class HorrorModCommon {

    /** The mod ID.  Must match the "id" field in every fabric.mod.json. */
    public static final String MOD_ID = "horrormod";

    /**
     * Shared logger.  Import this in any mod class instead of creating a new
     * logger, so all Horror Mod messages share the same prefix in the console.
     *
     * <p>Usage:  {@code HorrorModCommon.LOGGER.info("something happened");}</p>
     */
    public static final Logger LOGGER = LoggerFactory.getLogger(MOD_ID);

    /**
     * Called once from each version's {@code ModInitializer.onInitialize()}.
     *
     * <p>Currently only logs a startup message.  As we add systems (registries,
     * config loading, etc.) the shared parts will be wired in here.</p>
     */
    public static void initialize() {
        LOGGER.info("Horror Mod is awakening…");
    }
}
