package com.example.horrormod;

import net.fabricmc.api.ClientModInitializer;
import net.fabricmc.api.EnvType;
import net.fabricmc.api.Environment;

/**
 * Client-only entry point for Minecraft 1.21.1.
 *
 * <h2>Key 1.21.1 difference: HudRenderCallback</h2>
 * <p>In 1.21.1, Fabric's HUD event passes a {@code RenderTickCounter} instead
 * of a raw {@code float tickDelta}.  Retrieve the delta with:</p>
 * <pre>
 *   HudRenderCallback.EVENT.register((DrawContext ctx, RenderTickCounter counter) -> {
 *       float tickDelta = counter.getTickDelta(true);
 *       // ... render sanity bar using ctx ...
 *   });
 * </pre>
 * <p>The 1.20.1 version of this file uses the old {@code float tickDelta}
 * parameter.  That is why this class lives in each version's own folder
 * rather than in {@code common/}.</p>
 */
@Environment(EnvType.CLIENT)
public class HorrorModClient implements ClientModInitializer {

    @Override
    public void onInitializeClient() {
        HorrorModCommon.LOGGER.info("Horror Mod client (1.21.1) initializing.");

        // Future registrations (1.21.1-specific API):
        //
        // 1. Sanity HUD bar (uses 1.21.1-style RenderTickCounter):
        //    HudRenderCallback.EVENT.register(SanityHudRenderer::render);
        //
        // 2. Entity renderers:
        //    EntityRendererRegistry.register(ModEntities.LURKER, LurkerRenderer::new);
        //
        // 3. Dynamic fog:
        //    WorldRenderEvents.FOG_RENDERING.register(FogHandler::onFogRender);
    }
}
