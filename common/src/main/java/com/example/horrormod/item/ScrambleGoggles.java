package com.example.horrormod.item;

import net.minecraft.item.Item;

/**
 * Scramble Goggles — the player's protection against the Lurker's face.
 *
 * <h2>How they work</h2>
 * <p>The goggles have no active Item behaviour of their own.  The protection
 * is purely passive: {@link com.example.horrormod.entity.LurkerEntity} checks
 * whether the player holds the goggles in their <b>offhand or mainhand</b>
 * before deciding to enrage.</p>
 *
 * <pre>
 *   boolean wearsGoggles = player.getOffHandStack().isOf(ModItems.SCRAMBLE_GOGGLES)
 *                       || player.getMainHandStack().isOf(ModItems.SCRAMBLE_GOGGLES);
 * </pre>
 *
 * <p>Holding the goggles represents physically looking through them — the
 * scrambled lens prevents your brain from "registering" the Lurker's face.</p>
 *
 * <h2>Why not an ArmorItem?</h2>
 * <p>In 1.20.1 {@code ArmorMaterial} is an enum and in 1.21.1 it became
 * a registry entry — the constructor signatures are completely different.
 * Using a plain {@code Item} (offhand check) keeps this class in
 * {@code common/} and compiles for both versions with zero changes.</p>
 *
 * <h2>Crafting</h2>
 * <pre>
 *   I G I
 *   G _ G     I = iron_nugget,  G = glass_pane
 *   I G I
 * </pre>
 * See {@code data/horrormod/recipes/scramble_goggles.json}.
 */
public class ScrambleGoggles extends Item {

    public ScrambleGoggles(Settings settings) {
        super(settings);
    }
}
