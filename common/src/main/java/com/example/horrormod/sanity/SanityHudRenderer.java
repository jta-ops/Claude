package com.example.horrormod.sanity;

import net.fabricmc.api.EnvType;
import net.fabricmc.api.Environment;
import net.minecraft.client.MinecraftClient;
import net.minecraft.client.gui.DrawContext;
import net.minecraft.text.Text;

/**
 * Draws the sanity bar on the player's HUD.
 *
 * <h2>What is rendered</h2>
 * <ul>
 *   <li>A dark semi-transparent background rectangle.</li>
 *   <li>A coloured fill bar: green (healthy) → orange (low) → red (critical).</li>
 *   <li>A small "SANITY" label above the bar.</li>
 * </ul>
 *
 * <h2>Position</h2>
 * <p>Bottom-left corner, 2 px from the left edge, just above the hotbar (Y = screenHeight − 56).
 * Adjust {@link #BAR_X} and the Y calculation to taste.</p>
 *
 * <h2>Why this class lives in common/</h2>
 * <p>All rendering APIs used here are stable across 1.20.1 and 1.21.1:</p>
 * <ul>
 *   <li>{@code DrawContext.fill(x1,y1,x2,y2,color)} — added 1.20, unchanged in 1.21.</li>
 *   <li>{@code DrawContext.drawText(TextRenderer,Text,x,y,color,shadow)} — same in both.</li>
 *   <li>{@code MinecraftClient.getWindow().getScaledHeight()} — same in both.</li>
 * </ul>
 *
 * <h2>The one version difference (handled in HorrorModClient)</h2>
 * <p>This class declares {@code render(DrawContext, float tickDelta)}.  The caller
 * ({@code HorrorModClient.onInitializeClient}) registers a {@code HudRenderCallback}
 * whose lambda signature differs between 1.20.1 (raw {@code float}) and
 * 1.21.1 ({@code RenderTickCounter}).  Both versions extract the {@code float}
 * and call {@code SanityHudRenderer.render(ctx, tickDelta)}, so this class
 * needs no version-specific code.</p>
 */
@Environment(EnvType.CLIENT)
public final class SanityHudRenderer {

    // -----------------------------------------------------------------------
    // Layout constants
    // -----------------------------------------------------------------------

    private static final int BAR_X      = 2;
    private static final int BAR_WIDTH  = 81;   // same width as vanilla XP bar
    private static final int BAR_HEIGHT = 5;

    /**
     * Distance in pixels from the bottom of the screen.
     * 39 px = vanilla hotbar height; add bar height + a small gap.
     */
    private static final int BAR_Y_FROM_BOTTOM = 39 + BAR_HEIGHT + 4;

    // -----------------------------------------------------------------------
    // Colours (ARGB format: 0xAARRGGBB)
    // -----------------------------------------------------------------------

    private static final int COLOUR_BG       = 0xAA000000; // semi-transparent black
    private static final int COLOUR_HEALTHY  = 0xFF55FF55; // green
    private static final int COLOUR_LOW      = 0xFFFFAA00; // orange
    private static final int COLOUR_CRITICAL = 0xFFFF3333; // red
    private static final int COLOUR_LABEL    = 0xCCCCCCCC; // light grey

    // -----------------------------------------------------------------------
    // Public API
    // -----------------------------------------------------------------------

    /**
     * Renders the sanity bar.  Call from a {@code HudRenderCallback} in
     * {@code HorrorModClient.onInitializeClient()}.
     *
     * @param context    the current draw context (provides all drawing helpers).
     * @param tickDelta  partial tick (0.0–1.0) for smooth animation.
     *                   Currently unused — reserved for future interpolation.
     */
    public static void render(DrawContext context, float tickDelta) {
        MinecraftClient client = MinecraftClient.getInstance();
        if (client.player == null) return;

        float sanity    = ClientSanityState.sanity;
        int screenHeight = client.getWindow().getScaledHeight();

        int barY = screenHeight - BAR_Y_FROM_BOTTOM;

        // ── Background ────────────────────────────────────────────────────
        context.fill(
                BAR_X - 1,
                barY - 1,
                BAR_X + BAR_WIDTH + 1,
                barY + BAR_HEIGHT + 1,
                COLOUR_BG);

        // ── Coloured fill bar ─────────────────────────────────────────────
        int fillWidth = Math.max(0, (int) (BAR_WIDTH * (sanity / SanityManager.MAX_SANITY)));
        if (fillWidth > 0) {
            context.fill(BAR_X, barY, BAR_X + fillWidth, barY + BAR_HEIGHT, barColour(sanity));
        }

        // ── "SANITY" label ────────────────────────────────────────────────
        // Text.literal() produces an unstyled string. Both 1.20.1 and 1.21.1
        // have DrawContext.drawText(TextRenderer, Text, x, y, color, shadow).
        context.drawText(
                client.textRenderer,
                Text.literal("SANITY"),
                BAR_X,
                barY - 10,
                COLOUR_LABEL,
                true);   // true = drop shadow
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    private static int barColour(float sanity) {
        if (sanity >= SanityManager.THRESHOLD_LOW)      return COLOUR_HEALTHY;
        if (sanity >= SanityManager.THRESHOLD_CRITICAL) return COLOUR_LOW;
        return COLOUR_CRITICAL;
    }

    private SanityHudRenderer() {}
}
