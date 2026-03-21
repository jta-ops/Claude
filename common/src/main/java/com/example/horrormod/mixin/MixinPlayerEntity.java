package com.example.horrormod.mixin;

import com.example.horrormod.sanity.SanityTracker;
import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.nbt.NbtCompound;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfo;

/**
 * Persists the player's sanity by hooking into Minecraft's built-in NBT
 * save/load cycle.
 *
 * <h2>What NBT is</h2>
 * <p>NBT (Named Binary Tag) is Minecraft's serialisation format.  Every
 * player is saved to a {@code .dat} file under
 * {@code world/playerdata/<uuid>.dat}.  Whenever the player logs out (or
 * the world saves), {@code PlayerEntity.writeCustomDataToNbt()} is called;
 * on login or respawn {@code readCustomDataFromNbt()} is called.</p>
 *
 * <h2>What this Mixin does</h2>
 * <ul>
 *   <li>Adds a {@code "horrormod_sanity"} float tag to the player's NBT on save.</li>
 *   <li>Reads that tag back on load and populates the {@link SanityTracker} map.</li>
 * </ul>
 *
 * <h2>Injection point: TAIL</h2>
 * <p>Injecting at {@code TAIL} (the end of the method) ensures we run
 * <em>after</em> vanilla has finished reading/writing its own tags, so
 * there is no risk of interfering with vanilla data.</p>
 *
 * <h2>Version compatibility: 1.20.1 and 1.21.1</h2>
 * <p>The Yarn method names {@code writeCustomDataToNbt} and
 * {@code readCustomDataFromNbt} on {@code PlayerEntity} have been stable
 * since at least 1.16.  Both 1.20.1 and 1.21.1 use the same names, so this
 * Mixin lives in {@code common/} and compiles for both.</p>
 *
 * <h2>The (Object) cast</h2>
 * <p>Mixin targets the class but the injected method's receiver type is the
 * Mixin class itself.  Casting through {@code Object} first is the standard
 * pattern to obtain a reference to the Minecraft class being mixed into.</p>
 */
@Mixin(PlayerEntity.class)
public abstract class MixinPlayerEntity {

    /**
     * Appends the sanity float to the player's NBT on save.
     *
     * @param nbt  the compound being written to disk.
     * @param ci   (Mixin boilerplate) not used.
     */
    @Inject(method = "writeCustomDataToNbt", at = @At("TAIL"))
    private void horrormod_writeSanity(NbtCompound nbt, CallbackInfo ci) {
        SanityTracker.saveSanity((PlayerEntity) (Object) this, nbt);
    }

    /**
     * Reads the sanity float from the player's NBT on load.
     *
     * @param nbt  the compound read from disk.
     * @param ci   (Mixin boilerplate) not used.
     */
    @Inject(method = "readCustomDataFromNbt", at = @At("TAIL"))
    private void horrormod_readSanity(NbtCompound nbt, CallbackInfo ci) {
        SanityTracker.loadSanity((PlayerEntity) (Object) this, nbt);
    }
}
