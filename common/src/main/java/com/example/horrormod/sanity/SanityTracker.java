package com.example.horrormod.sanity;

import com.example.horrormod.HorrorModCommon;
import net.fabricmc.fabric.api.entity.event.v1.ServerPlayerEvents;
import net.fabricmc.fabric.api.event.lifecycle.v1.ServerTickEvents;
import net.fabricmc.fabric.api.networking.v1.ServerPlayConnectionEvents;
import net.minecraft.entity.mob.HostileEntity;
import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.nbt.NbtCompound;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.util.math.Box;
import net.minecraft.world.LightType;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Server-side manager for every player's sanity.
 *
 * <h2>Responsibilities</h2>
 * <ol>
 *   <li>Store one {@link SanityManager} per player UUID in a map.</li>
 *   <li>Tick each player's sanity once per server tick (drain/restore based
 *       on conditions).</li>
 *   <li>Sync the sanity value to the player's client once per second.</li>
 *   <li>Save sanity to NBT when the player is written to disk (via
 *       {@link com.example.horrormod.mixin.MixinPlayerEntity}).</li>
 *   <li>Load sanity from NBT when the player is read from disk (same mixin).</li>
 * </ol>
 *
 * <h2>Why a static map instead of a component?</h2>
 * <p>A proper "component" system (like Cardinal Components API) is the
 * cleanest long-term approach, but it adds a dependency.  Using a
 * {@code ConcurrentHashMap<UUID, SanityManager>} is simpler to explain and
 * requires no extra libraries.  The map is populated on player join and
 * cleared on disconnect.</p>
 *
 * <h2>Why this class lives in common/</h2>
 * <p>All FAPI events used here ({@code ServerTickEvents}, {@code ServerPlayerEvents},
 * {@code ServerPlayConnectionEvents}) and all MC server classes used
 * ({@code ServerPlayerEntity}, {@code HostileEntity}, etc.) have identical
 * package paths and method signatures in 1.20.1 and 1.21.1, so a single
 * copy compiles for both.</p>
 */
public class SanityTracker {

    // -----------------------------------------------------------------------
    // NBT key — the tag written into the player's save file
    // -----------------------------------------------------------------------
    static final String NBT_KEY = "horrormod_sanity";

    // -----------------------------------------------------------------------
    // State
    // -----------------------------------------------------------------------

    /**
     * Server-side store.  One {@link SanityManager} per player UUID.
     * ConcurrentHashMap is used because players can join/leave while the
     * server tick is running on a different thread.
     */
    private static final Map<UUID, SanityManager> serverSanity = new ConcurrentHashMap<>();

    // -----------------------------------------------------------------------
    // Event registration
    // -----------------------------------------------------------------------

    /**
     * Registers all server-side Fabric events needed to run the sanity system.
     * Call once from {@code HorrorMod.onInitialize()}.
     */
    public static void registerEvents() {

        // ── Tick: update sanity for every online player ───────────────────
        ServerTickEvents.END_SERVER_TICK.register(server -> {
            for (ServerPlayerEntity player : server.getPlayerManager().getPlayerList()) {
                tickPlayer(player);
            }
        });

        // ── Join: make sure the player has a SanityManager entry ─────────
        // (NBT is loaded by MixinPlayerEntity before this fires, so the map
        // should already have the loaded value.  getOrCreate is a safety net.)
        ServerPlayConnectionEvents.JOIN.register((handler, sender, server) -> {
            ServerPlayerEntity player = handler.getPlayer();
            SanityManager sanity = getOrCreate(player.getUuid());
            // Send the loaded sanity value to the joining client immediately.
            SanityNetworking.sendToPlayer(player, sanity.getSanity());
            HorrorModCommon.LOGGER.debug("[SanityTracker] Player {} joined, sanity={}",
                    player.getNameForScoreboard(), sanity.getSanity());
        });

        // ── Disconnect: remove from the map (NBT was saved by MixinPlayerEntity) ─
        ServerPlayConnectionEvents.DISCONNECT.register((handler, server) -> {
            serverSanity.remove(handler.getPlayer().getUuid());
        });

        // ── Respawn: keep sanity (it was saved/loaded via NBT automatically),
        //            but re-send the current value to the newly spawned client ─
        ServerPlayerEvents.AFTER_RESPAWN.register((oldPlayer, newPlayer, alive) -> {
            SanityManager sanity = getOrCreate(newPlayer.getUuid());
            SanityNetworking.sendToPlayer(newPlayer, sanity.getSanity());
        });
    }

    // -----------------------------------------------------------------------
    // Per-player tick
    // -----------------------------------------------------------------------

    /**
     * Called once per server tick per player.
     *
     * <p>Checks game conditions and drains/restores sanity accordingly.
     * Syncs the new value to the client once per second (every 20 ticks).</p>
     *
     * @param player  the player whose sanity to update.
     */
    static void tickPlayer(ServerPlayerEntity player) {
        SanityManager sanity = getOrCreate(player.getUuid());

        // ── Condition: darkness vs bright light ─────────────────────────
        // getLightLevel(BLOCK, pos) returns the block-light level (0-15).
        // Torches and lava emit 14-15; a fully dark cave is 0.
        int blockLight = player.getWorld().getLightLevel(LightType.BLOCK, player.getBlockPos());

        if (blockLight <= 4) {
            sanity.drain(SanityManager.DRAIN_IN_DARKNESS);
        } else if (blockLight >= 10) {
            sanity.restore(SanityManager.RESTORE_IN_LIGHT);
        }

        // ── Condition: nearby hostile mobs ───────────────────────────────
        // HostileEntity is the Yarn-mapped abstract class that all hostile
        // mobs (zombies, creepers, etc.) extend.
        // Later we will also check for our custom horror mobs specifically.
        Box scanBox = player.getBoundingBox().expand(16.0);
        List<HostileEntity> nearbyMobs =
                player.getWorld().getNonSpectatingEntities(HostileEntity.class, scanBox);
        if (!nearbyMobs.isEmpty()) {
            sanity.drain(SanityManager.DRAIN_NEAR_MONSTER);
        }

        // ── Condition: Ashwood Forest / Cursed Ruins ─────────────────────
        // TODO: add biome/structure check once those are registered.
        //   if (player is in ASHWOOD_FOREST biome) sanity.drain(DRAIN_IN_CURSED_ZONE);

        // ── Sync: send updated value to client once per second ───────────
        // getTicks() returns the total server ticks elapsed (wraps at MAX_INT).
        // Modulo 20 == 1-second interval.
        if (player.getServer().getTicks() % 20 == 0) {
            SanityNetworking.sendToPlayer(player, sanity.getSanity());
        }
    }

    // -----------------------------------------------------------------------
    // Accessors
    // -----------------------------------------------------------------------

    /**
     * Returns the player's {@link SanityManager}, creating one at full sanity
     * if it does not exist yet (e.g. on first ever login).
     */
    public static SanityManager getOrCreate(UUID uuid) {
        return serverSanity.computeIfAbsent(uuid,
                k -> new SanityManager(SanityManager.MAX_SANITY));
    }

    /** Removes the player's entry from the map (called on disconnect). */
    public static void remove(UUID uuid) {
        serverSanity.remove(uuid);
    }

    // -----------------------------------------------------------------------
    // NBT helpers — called by MixinPlayerEntity
    // -----------------------------------------------------------------------

    /**
     * Writes the player's sanity value into the player's NBT compound.
     * Called from
     * {@link com.example.horrormod.mixin.MixinPlayerEntity#horrormod_writeSanity}.
     */
    public static void saveSanity(PlayerEntity player, NbtCompound nbt) {
        SanityManager sanity = serverSanity.get(player.getUuid());
        if (sanity != null) {
            nbt.putFloat(NBT_KEY, sanity.getSanity());
        }
    }

    /**
     * Reads the player's sanity value from the player's NBT compound and
     * populates the map.  Called from
     * {@link com.example.horrormod.mixin.MixinPlayerEntity#horrormod_readSanity}.
     */
    public static void loadSanity(PlayerEntity player, NbtCompound nbt) {
        if (nbt.contains(NBT_KEY)) {
            float value = nbt.getFloat(NBT_KEY);
            serverSanity.put(player.getUuid(), new SanityManager(value));
            HorrorModCommon.LOGGER.debug("[SanityTracker] Loaded sanity={} for {}",
                    value, player.getNameForScoreboard());
        }
    }
}
