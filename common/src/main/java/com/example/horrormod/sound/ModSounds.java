package com.example.horrormod.sound;

import com.example.horrormod.HorrorModCommon;
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;
import net.minecraft.sound.SoundEvent;
import net.minecraft.util.Identifier;

/**
 * Registers every SoundEvent for the mod.
 *
 * <h2>How Minecraft sound registration works</h2>
 * <ol>
 *   <li>You register a {@link SoundEvent} object with Minecraft's registry.
 *       This is what this class does.</li>
 *   <li>You declare the event in {@code assets/horrormod/sounds.json}, mapping
 *       it to one or more {@code .ogg} audio files on disk.</li>
 *   <li>You play it in code with
 *       {@code client.getSoundManager().play(PositionedSoundInstance.master(ModSounds.SOME_SOUND, pitch))}.</li>
 * </ol>
 *
 * <h2>Why this class lives in common/</h2>
 * <p>The registration code below uses only:</p>
 * <ul>
 *   <li>{@code net.minecraft.registry.Registries} — stable since 1.19.3</li>
 *   <li>{@code net.minecraft.sound.SoundEvent} — stable across all versions</li>
 *   <li>{@code net.minecraft.util.Identifier} — stable across all versions</li>
 * </ul>
 * <p>None of these changed between 1.20.1 and 1.21.x, so a single copy
 * compiles correctly for every version subproject.</p>
 *
 * <h2>How the static initialiser trick works</h2>
 * <p>Each {@code public static final} field calls the private {@link #register}
 * helper, which immediately registers the event with Minecraft's registry.
 * Java only loads (and thus initialises) a class the first time it is
 * referenced.  Calling the empty {@link #register()} method from
 * {@code HorrorMod.onInitialize()} is enough to trigger class loading and
 * therefore run all those field initialisers.</p>
 */
public class ModSounds {

    // -----------------------------------------------------------------------
    // Ambient atmosphere
    // -----------------------------------------------------------------------

    /** A distant, muffled scream.  Rare.  Plays in darkness or underground. */
    public static final SoundEvent AMBIENT_DISTANT_SCREAM =
            register("ambient.distant_scream");

    /** Close, slow breathing.  Common in darkness.  Unsettling up close. */
    public static final SoundEvent AMBIENT_BREATHING =
            register("ambient.breathing");

    /**
     * Phantom footsteps that seem to come from just behind the player.
     * Plays in darkness.
     */
    public static final SoundEvent AMBIENT_FOOTSTEPS =
            register("ambient.footsteps");

    /** Faint whispering.  Plays near Cursed Ruins or in the Ashwood Forest. */
    public static final SoundEvent AMBIENT_WHISPER =
            register("ambient.whisper");

    // -----------------------------------------------------------------------
    // Environment
    // -----------------------------------------------------------------------

    /**
     * The crackle and pop of a torch flickering out.
     * Will be triggered by the torch-extinguishing mechanic in cursed zones.
     */
    public static final SoundEvent TORCH_FLICKER =
            register("torch_flicker");

    // -----------------------------------------------------------------------
    // The Lurker  (blind cave hunter)
    // -----------------------------------------------------------------------

    /** Low ambient growl.  Plays while the Lurker is idle underground. */
    public static final SoundEvent LURKER_AMBIENT =
            register("entity.lurker.ambient");

    /**
     * Aggressive snarl.  Plays when the Lurker detects the player's sound
     * (i.e. the player starts moving near it).
     */
    public static final SoundEvent LURKER_GROWL =
            register("entity.lurker.growl");

    /** Plays when the Lurker takes damage. */
    public static final SoundEvent LURKER_HURT =
            register("entity.lurker.hurt");

    /** Plays when the Lurker is killed. */
    public static final SoundEvent LURKER_DEATH =
            register("entity.lurker.death");

    // -----------------------------------------------------------------------
    // The Watcher  (distant, unmoving, vanishes on eye contact)
    // -----------------------------------------------------------------------

    /**
     * Subtle tone that plays when The Watcher first materialises in the
     * distance.  Should be barely audible so the player isn't sure they heard it.
     */
    public static final SoundEvent WATCHER_APPEAR =
            register("entity.watcher.appear");

    /**
     * A low, uncomfortable drone that plays while The Watcher is actively
     * staring at the player (i.e. the player has NOT looked at it yet).
     */
    public static final SoundEvent WATCHER_STARE =
            register("entity.watcher.stare");

    // -----------------------------------------------------------------------
    // The Hollow  (fast, aggressive night-spawner in the Ashwood Forest)
    // -----------------------------------------------------------------------

    /** Ambient skittering.  Plays while The Hollow is nearby. */
    public static final SoundEvent HOLLOW_AMBIENT =
            register("entity.hollow.ambient");

    /** Bloodcurdling screech at the start of an attack sprint. */
    public static final SoundEvent HOLLOW_SCREECH =
            register("entity.hollow.screech");

    /** Plays when The Hollow takes damage. */
    public static final SoundEvent HOLLOW_HURT =
            register("entity.hollow.hurt");

    /** Plays when The Hollow is killed. */
    public static final SoundEvent HOLLOW_DEATH =
            register("entity.hollow.death");

    // -----------------------------------------------------------------------
    // Registration
    // -----------------------------------------------------------------------

    /**
     * Call this from {@code HorrorMod.onInitialize()} to force class loading.
     *
     * <p>The method body can stay empty — calling it is enough to make Java
     * load this class, which triggers all the static field initialisers above,
     * which call {@link #register(String)} and write to Minecraft's registry.</p>
     */
    public static void register() {
        HorrorModCommon.LOGGER.debug("Horror Mod sounds registered.");
    }

    // -----------------------------------------------------------------------
    // Private helper
    // -----------------------------------------------------------------------

    /**
     * Registers a {@link SoundEvent} under the {@code horrormod} namespace.
     *
     * @param name  the path portion of the sound ID, e.g. {@code "ambient.breathing"}.
     *              The full identifier will be {@code horrormod:ambient.breathing}.
     */
    private static SoundEvent register(String name) {
        // new Identifier(namespace, path) works in both 1.20.1 and 1.21.x.
        // (In 1.21 it is deprecated in favour of Identifier.of(), but still compiles.)
        Identifier id = new Identifier(HorrorModCommon.MOD_ID, name);
        return Registry.register(Registries.SOUND_EVENT, id, SoundEvent.of(id));
    }
}
