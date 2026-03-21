package com.example.horrormod.entity;

import com.example.horrormod.HorrorModCommon;
import com.example.horrormod.entity.client.LurkerModel;
import com.example.horrormod.entity.client.LurkerRenderer;
import net.fabricmc.api.EnvType;
import net.fabricmc.api.Environment;
import net.fabricmc.fabric.api.biome.v1.BiomeModifications;
import net.fabricmc.fabric.api.biome.v1.BiomeSelectors;
import net.fabricmc.fabric.api.client.rendering.v1.EntityModelLayerRegistry;
import net.fabricmc.fabric.api.client.rendering.v1.EntityRendererRegistry;
import net.fabricmc.fabric.api.object.builder.v1.entity.FabricDefaultAttributeRegistry;
import net.minecraft.client.render.entity.model.EntityModelLayer;
import net.minecraft.entity.EntityType;
import net.minecraft.entity.SpawnGroup;
import net.minecraft.entity.SpawnRestriction;
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;
import net.minecraft.util.Identifier;
import net.minecraft.world.Heightmap;
import net.minecraft.world.biome.SpawnSettings;

/**
 * Registers all entity types added by the mod.
 *
 * <h2>Registration sequence</h2>
 * <ol>
 *   <li>{@link #register()} — must be called from {@code HorrorMod.onInitialize()}.
 *       Creates the entity type, registers default attributes, and sets spawn conditions.</li>
 *   <li>{@link #registerRenderers()} — must be called from
 *       {@code HorrorModClient.onInitializeClient()}.
 *       Registers the entity renderer and model layer (client-only).</li>
 * </ol>
 *
 * <h2>Why both calls are the same in 1.20.1 and 1.21.1</h2>
 * <ul>
 *   <li>{@code EntityType.Builder} — unchanged in both versions.</li>
 *   <li>{@code FabricDefaultAttributeRegistry} — same FAPI class in both.</li>
 *   <li>{@code BiomeModifications.addSpawn} — same FAPI method signature in both.</li>
 *   <li>{@code EntityRendererRegistry} — same FAPI class in both.</li>
 *   <li>{@code EntityModelLayerRegistry} — same FAPI class in both.</li>
 * </ul>
 */
public final class ModEntities {

    // -----------------------------------------------------------------------
    // Entity type declarations
    // -----------------------------------------------------------------------

    /**
     * The Lurker — a blind, sound-hunting cave predator.
     *
     * <p>Dimensions: 0.6 blocks wide, 1.95 blocks tall (similar to a zombie).
     * Lives underground below Y=50, spawns only in complete darkness.</p>
     */
    public static final EntityType<LurkerEntity> LURKER = Registry.register(
            Registries.ENTITY_TYPE,
            new Identifier(HorrorModCommon.MOD_ID, "lurker"),
            EntityType.Builder.<LurkerEntity>create(LurkerEntity::new, SpawnGroup.MONSTER)
                    .dimensions(0.6f, 1.95f)      // hitbox width × height (blocks)
                    .build()
    );

    // ─── Future mobs ───────────────────────────────────────────────────────
    // public static final EntityType<WatcherEntity> WATCHER = ...
    // public static final EntityType<HollowEntity>  HOLLOW  = ...

    // -----------------------------------------------------------------------
    // Client-side: model layer location
    // -----------------------------------------------------------------------

    /**
     * Identifies the Lurker's model layer for the texture baking pipeline.
     * The string "main" is the conventional name for a mob's primary layer.
     */
    @Environment(EnvType.CLIENT)
    public static final EntityModelLayer LURKER_MODEL_LAYER =
            new EntityModelLayer(new Identifier(HorrorModCommon.MOD_ID, "lurker"), "main");

    // -----------------------------------------------------------------------
    // Server-side registration
    // -----------------------------------------------------------------------

    /**
     * Registers entity attributes and spawn conditions.
     * Call once from {@code HorrorMod.onInitialize()}.
     *
     * <h3>Attributes</h3>
     * <p>Each entity type needs a registered {@code DefaultAttributeContainer} that
     * declares which entity attributes it uses and their base values.  The Fabric API
     * class {@code FabricDefaultAttributeRegistry} does this registration for us.</p>
     *
     * <h3>Spawn conditions</h3>
     * <p>Two steps are needed for a mob to spawn naturally:</p>
     * <ol>
     *   <li>{@code SpawnRestriction.register} — validates EACH candidate spawn position
     *       (light level, Y coordinate, etc.).</li>
     *   <li>{@code BiomeModifications.addSpawn} — adds the mob to the spawn table of
     *       every biome matching the selector.</li>
     * </ol>
     */
    public static void register() {
        // ── Attributes ───────────────────────────────────────────────────
        FabricDefaultAttributeRegistry.register(LURKER, LurkerEntity.createAttributes());

        // ── Spawn restriction: filter individual positions ────────────────
        // ON_GROUND: must have a solid block below the spawn position.
        // MOTION_BLOCKING_NO_LEAVES: standard heightmap for surface mobs (also used underground).
        // LurkerEntity::canSpawn: our custom check (Y < 50, pitch black).
        SpawnRestriction.register(
                LURKER,
                SpawnRestriction.Location.ON_GROUND,
                Heightmap.Type.MOTION_BLOCKING_NO_LEAVES,
                LurkerEntity::canSpawn);

        // ── Spawn table: add to biome pools ─────────────────────────────
        // weight=3  → rare (zombie=100, skeleton=100, creeper=100 for context).
        // groups of 1–2 Lurkers at a time; solo makes it more horrifying.
        BiomeModifications.addSpawn(
                BiomeSelectors.foundInOverworld(),
                SpawnGroup.MONSTER,
                LURKER,
                3,   // weight (rare)
                1,   // min group size
                2    // max group size
        );

        HorrorModCommon.LOGGER.debug("Horror Mod entities registered.");
    }

    // -----------------------------------------------------------------------
    // Client-side registration
    // -----------------------------------------------------------------------

    /**
     * Registers the entity renderer and model layer.
     * Call once from {@code HorrorModClient.onInitializeClient()}.
     *
     * <p>This method is {@code @Environment(CLIENT)} because
     * {@code EntityRendererRegistry} and {@code EntityModelLayerRegistry}
     * are client-only Fabric API classes.</p>
     */
    @Environment(EnvType.CLIENT)
    public static void registerRenderers() {
        // Register the model data so the texture baking system can build the ModelPart tree.
        EntityModelLayerRegistry.registerModelLayer(LURKER_MODEL_LAYER, LurkerModel::getTexturedModelData);

        // Register the renderer factory.  The factory receives an
        // EntityRendererFactory.Context that contains the baked model parts.
        EntityRendererRegistry.register(LURKER, LurkerRenderer::new);
    }

    private ModEntities() {}
}
