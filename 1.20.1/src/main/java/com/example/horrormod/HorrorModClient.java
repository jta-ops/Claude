package com.example.horrormod;

import net.fabricmc.api.ClientModInitializer;
import net.fabricmc.api.EnvType;
import net.fabricmc.api.Environment;

/**
 * Client-only entry point for Minecraft 1.20.1.
 *
 * <p>Fabric calls {@link #onInitializeClient()} only when the game is running
 * as a client (not on a dedicated server).  This is the place to register:</p>
 * <ul>
 *   <li>Custom HUD elements (the sanity bar)</li>
 *   <li>Entity renderers (how custom mobs look)</li>
 *   <li>Dynamic fog events</li>
 *   <li>Screen overlays / visual distortions</li>
 * </ul>
 *
 * <h2>1.20.1 vs 1.21.1 — HUD rendering</h2>
 * <p>In 1.20.1, Fabric's HUD callback signature is:</p>
 * <pre>
 *   HudRenderCallback.EVENT.register((DrawContext ctx, float tickDelta) -> { ... });
 * </pre>
 * <p>In 1.21.1 this changed to:</p>
 * <pre>
 *   HudRenderCallback.EVENT.register((DrawContext ctx, RenderTickCounter counter) -> { ... });
 * </pre>
 * <p>Because the signature differs, {@code HorrorModClient} is kept in each
 * version's own source tree (not in {@code common/}) so each version can use
 * the correct API without compiler errors.</p>
 */
@Environment(EnvType.CLIENT)
public class HorrorModClient implements ClientModInitializer {

    @Override
    public void onInitializeClient() {
        HorrorModCommon.LOGGER.info("Horror Mod client (1.20.1) initializing.");

        // Future registrations will go here.  Examples:
        //
        // 1. Sanity HUD bar (uses 1.20.1-style float tickDelta):
        //    HudRenderCallback.EVENT.register(SanityHudRenderer::render);
        //
        // 2. Entity renderers:
        //    EntityRendererRegistry.register(ModEntities.LURKER, LurkerRenderer::new);
        //
        // 3. Dynamic fog (thickens at night or in cursed zones):
        //    WorldRenderEvents.FOG_RENDERING.register(FogHandler::onFogRender);
    }
}
