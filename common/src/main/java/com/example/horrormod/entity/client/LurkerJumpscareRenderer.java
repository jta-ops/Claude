package com.example.horrormod.entity.client;

import net.fabricmc.api.EnvType;
import net.fabricmc.api.Environment;
import net.minecraft.client.MinecraftClient;
import net.minecraft.client.gui.DrawContext;

/**
 * Renders the jumpscare red-flash vignette when the Lurker enrages.
 *
 * <h2>Effect</h2>
 * <p>A full-screen semi-transparent red rectangle that fades out over
 * 2 seconds (40 ticks).  The opacity follows a quadratic curve so it
 * peaks instantly (200/255 alpha) and decays quickly at first, then
 * slowly — mimicking the feeling of blood rushing to your head.</p>
 *
 * <h2>Integration</h2>
 * <ul>
 *   <li>{@link #clientTick()} — call from {@code ClientTickEvents.END_CLIENT_TICK}
 *       to decrement the countdown each game tick.</li>
 *   <li>{@link #render(DrawContext, float)} — call from a second
 *       {@code HudRenderCallback} registration in {@code HorrorModClient}.</li>
 * </ul>
 *
 * <h2>Version compatibility</h2>
 * <p>{@code DrawContext.fill()} and {@code MinecraftClient.getWindow()}
 * are stable in both 1.20.1 and 1.21.1.</p>
 */
@Environment(EnvType.CLIENT)
public final class LurkerJumpscareRenderer {

    private static final int DURATION = 40; // ticks (2 seconds)

    // -----------------------------------------------------------------------
    // Server-tick callback
    // -----------------------------------------------------------------------

    /**
     * Decrements the jumpscare countdown.
     * Register via {@code ClientTickEvents.END_CLIENT_TICK}.
     */
    public static void clientTick() {
        if (ClientLurkerState.jumpscareTicks > 0) {
            ClientLurkerState.jumpscareTicks--;
        }
    }

    // -----------------------------------------------------------------------
    // Render callback
    // -----------------------------------------------------------------------

    /**
     * Draws a fading red vignette over the entire HUD.
     * Register via {@code HudRenderCallback.EVENT}.
     *
     * @param context   draw context for the current frame.
     * @param tickDelta partial tick for smooth animation.
     */
    public static void render(DrawContext context, float tickDelta) {
        int ticks = ClientLurkerState.jumpscareTicks;
        if (ticks <= 0) return;

        MinecraftClient client = MinecraftClient.getInstance();
        int w = client.getWindow().getScaledWidth();
        int h = client.getWindow().getScaledHeight();

        // Quadratic fade: full at ticks=40, zero at ticks=0.
        // progress: 1.0 → 0.0 as effect winds down.
        float progress = (ticks + tickDelta) / DURATION;
        // Clamp to [0, 1] in case of over-shoot
        progress = Math.min(1.0f, Math.max(0.0f, progress));

        // Alpha: peaks at 200, decays quadratically so the first frame is
        // very intense (0xFF blood-red) and the last frames barely visible.
        int alpha = (int) (progress * progress * 200);
        if (alpha <= 0) return;

        // ARGB: pack computed alpha + dark red
        int colour = (alpha << 24) | 0x5C0000;
        context.fill(0, 0, w, h, colour);
    }

    private LurkerJumpscareRenderer() {}
}
