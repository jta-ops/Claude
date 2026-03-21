package com.example.horrormod.item;

import com.example.horrormod.HorrorModCommon;
import net.minecraft.item.Item;
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;
import net.minecraft.util.Identifier;

/**
 * Registers all items added by the mod.
 *
 * <h2>How to add a new item</h2>
 * <ol>
 *   <li>Create a class in {@code common/.../item/} that extends {@link Item}
 *       (or a subclass like {@link net.minecraft.item.SwordItem}).</li>
 *   <li>Add a {@code public static final} field here using the same
 *       {@link #register} pattern.</li>
 *   <li>Add a translation key to both {@code en_us.json} files.</li>
 *   <li>Add a crafting recipe to {@code data/horrormod/recipes/}.</li>
 *   <li>Add a model to {@code assets/horrormod/models/item/} and a texture
 *       to {@code assets/horrormod/textures/item/}.</li>
 * </ol>
 *
 * <h2>Version compatibility</h2>
 * <p>{@code Registries.ITEM} and {@code Item.Settings} have the same API in
 * both 1.20.1 and 1.21.1.</p>
 */
public final class ModItems {

    // -----------------------------------------------------------------------
    // Item declarations
    // -----------------------------------------------------------------------

    /**
     * Scramble Goggles — hold in offhand (or mainhand) to prevent the
     * Lurker from enraging when you look at its face.
     *
     * <p>Max stack: 1 (like a tool/armour).  No durability — they last
     * forever (you'll need them for every cave trip).</p>
     */
    public static final Item SCRAMBLE_GOGGLES = register(
            "scramble_goggles",
            new ScrambleGoggles(new Item.Settings().maxCount(1)));

    // Future items:
    // public static final Item HERBAL_REMEDY = register("herbal_remedy", new HerbalRemedy(...));

    // -----------------------------------------------------------------------
    // Bootstrap
    // -----------------------------------------------------------------------

    /**
     * Call from {@code HorrorMod.onInitialize()} to force class-loading and
     * therefore all static field initialisers.
     */
    public static void register() {
        HorrorModCommon.LOGGER.debug("Horror Mod items registered.");
    }

    // -----------------------------------------------------------------------
    // Private helper
    // -----------------------------------------------------------------------

    private static <T extends Item> T register(String name, T item) {
        return Registry.register(Registries.ITEM, new Identifier(HorrorModCommon.MOD_ID, name), item);
    }

    private ModItems() {}
}
