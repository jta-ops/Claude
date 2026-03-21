package com.example.horrormod.entity.client;

import com.example.horrormod.HorrorModCommon;
import com.example.horrormod.entity.LurkerEntity;
import com.example.horrormod.entity.ModEntities;
import net.fabricmc.api.EnvType;
import net.fabricmc.api.Environment;
import net.minecraft.client.render.entity.EntityRendererFactory;
import net.minecraft.client.render.entity.MobEntityRenderer;
import net.minecraft.util.Identifier;

/**
 * Renders The Lurker using {@link LurkerModel}.
 *
 * <h2>Rendering pipeline</h2>
 * <pre>
 *   Each frame:
 *     EntityRenderDispatcher.render(LurkerEntity, ...)
 *       → LurkerRenderer.render(entity, yaw, tickDelta, ctx, light, overlay)
 *           → MobEntityRenderer applies position, shadow, leash, etc.
 *               → model.setAngles(entity, ...)  ← BipedEntityModel animates limbs
 *               → model.render(...)             ← draws all cuboids
 *               → texture sampled from TEXTURE
 * </pre>
 *
 * <h2>Texture placeholder</h2>
 * <p>The texture path {@code textures/entity/lurker.png} is relative to the
 * {@code assets/horrormod/} resource folder.  Until a real texture is
 * created, you can use any 64×64 PNG (even a solid colour) and the model
 * will render with it.  The texture file must be placed at:</p>
 * <pre>
 *   common/src/main/resources/assets/horrormod/textures/entity/lurker.png
 * </pre>
 *
 * <h2>Adding features to the renderer</h2>
 * <ul>
 *   <li>To show the Lurker's "alert eye glow" (future feature), add a
 *       {@code RenderLayer} feature renderer via
 *       {@code this.addFeature(new AlertGlowFeatureRenderer(this))}.</li>
 *   <li>To hide the hat layer (the Lurker doesn't wear hats), override
 *       {@code render()} and set {@code model.hat.visible = false} before
 *       calling {@code super.render()}.</li>
 * </ul>
 *
 * <h2>Version compatibility (1.20.1 and 1.21.1)</h2>
 * <p>{@code MobEntityRenderer}, {@code EntityRendererFactory.Context}, and
 * {@code getTexture()} are unchanged between the two versions.  This class
 * can live in {@code common/} and compile for both.</p>
 */
@Environment(EnvType.CLIENT)
public class LurkerRenderer extends MobEntityRenderer<LurkerEntity, LurkerModel> {

    /**
     * Path to the Lurker's texture.
     *
     * <p>You must provide the actual PNG file.  A quick placeholder:
     * copy any 64×64 PNG here and rename it {@code lurker.png}.
     * The UV layout matches the standard player skin (see {@link LurkerModel}).</p>
     */
    private static final Identifier TEXTURE =
            new Identifier(HorrorModCommon.MOD_ID, "textures/entity/lurker.png");

    /**
     * @param ctx  provides the baked {@code ModelPart} tree and other
     *             per-renderer resources.  Access the baked root via
     *             {@code ctx.getPart(ModEntities.LURKER_MODEL_LAYER)}.
     */
    public LurkerRenderer(EntityRendererFactory.Context ctx) {
        super(
                ctx,
                new LurkerModel(ctx.getPart(ModEntities.LURKER_MODEL_LAYER)),
                0.5f   // shadow radius in blocks
        );
    }

    @Override
    public Identifier getTexture(LurkerEntity entity) {
        return TEXTURE;
    }
}
