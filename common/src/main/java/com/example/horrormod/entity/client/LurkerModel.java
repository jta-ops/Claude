package com.example.horrormod.entity.client;

import com.example.horrormod.entity.LurkerEntity;
import net.fabricmc.api.EnvType;
import net.fabricmc.api.Environment;
import net.minecraft.client.model.*;
import net.minecraft.client.render.entity.model.BipedEntityModel;
import net.minecraft.client.render.entity.model.EntityModelPartNames;

/**
 * Model for The Lurker.
 *
 * <h2>Shape</h2>
 * <p>The Lurker uses the standard biped skeleton (head, body, two arms,
 * two legs) so that the default {@link BipedEntityModel} walking animations
 * work without any extra code.  The texture UV layout is the same as a
 * player skin (64×64 pixels), making it easy to swap in a custom texture.</p>
 *
 * <h2>Customising the model</h2>
 * <p>To give the Lurker its own shape (longer arms, hunched body, etc.),
 * adjust the cuboid size/position values in {@link #getTexturedModelData()}
 * and override {@code setAngles()} to add custom pose logic (e.g. tilt
 * the head based on alertness).  No version-specific code is needed.</p>
 *
 * <h2>How the model/texture pipeline works</h2>
 * <pre>
 *   ModEntities.registerRenderers()
 *     → EntityModelLayerRegistry.registerModelLayer(LURKER_MODEL_LAYER,
 *                                                    LurkerModel::getTexturedModelData)
 *     → MC bakes ModelPart tree during resource loading
 *     → LurkerRenderer constructor receives baked ModelPart via Context
 *     → LurkerRenderer creates new LurkerModel(bakedRoot)
 *     → Per frame: LurkerRenderer calls model.render(...)
 * </pre>
 *
 * <h2>Version compatibility (1.20.1 and 1.21.1)</h2>
 * <p>All APIs used here are stable across both versions:</p>
 * <ul>
 *   <li>{@code ModelData}, {@code ModelPartData} — model builder classes</li>
 *   <li>{@code ModelPartBuilder.create().uv().cuboid()} — cuboid definition</li>
 *   <li>{@code ModelTransform.pivot()} — positional transform</li>
 *   <li>{@code TexturedModelData.of(ModelData, width, height)} — finalises UV space</li>
 *   <li>{@code BipedEntityModel<T extends LivingEntity>} — generic biped, no entity bound</li>
 *   <li>{@code EntityModelPartNames} — string constants for standard part names</li>
 * </ul>
 */
@Environment(EnvType.CLIENT)
public class LurkerModel extends BipedEntityModel<LurkerEntity> {

    /**
     * Creates the model from the pre-baked {@code ModelPart} tree.
     * The tree was built by {@link #getTexturedModelData()} and baked by
     * Minecraft's resource system; it is passed in by {@link LurkerRenderer}.
     *
     * @param root  the root {@code ModelPart} containing all named children.
     */
    public LurkerModel(ModelPart root) {
        super(root);
    }

    /**
     * Defines the Lurker's geometry and UV mapping.
     *
     * <p>The texture atlas is 64×64 pixels, matching the player skin layout.
     * If you add new parts (e.g. a tail), expand the atlas dimensions and add
     * a new {@code addChild()} call.</p>
     *
     * <p>UV coordinates are in pixels from the top-left corner of the texture.
     * Cuboid arguments: {@code (x, y, z, width, height, depth, dilation)}.
     * The pivot is the rotation/translation origin in model space, where
     * Y=0 is the "feet" level when the entity stands on the ground.</p>
     *
     * <h3>Part positions (Y axis: 0 = feet, 24 = top of head)</h3>
     * <ul>
     *   <li>Head pivot Y = 0 (i.e. the head hangs from the body pivot at Y=0,
     *       head extends from Y=−8 to Y=0 in local space).</li>
     *   <li>Body pivot Y = 0 (torso from Y=0 to Y=12).</li>
     *   <li>Legs pivot Y = 12 (below the body).</li>
     * </ul>
     */
    public static TexturedModelData getTexturedModelData() {
        ModelData model = new ModelData();
        ModelPartData root = model.getRoot();

        // ── Head ──────────────────────────────────────────────────────────
        // UV (0,0): standard biped head placement.
        // Cuboid: 8w × 8h × 8d, centred on the pivot X-axis.
        root.addChild(
                EntityModelPartNames.HEAD,
                ModelPartBuilder.create()
                        .uv(0, 0)
                        .cuboid(-4.0f, -8.0f, -4.0f, 8, 8, 8, Dilation.NONE),
                ModelTransform.pivot(0.0f, 0.0f, 0.0f));

        // ── Head outer layer (hat slot) ───────────────────────────────────
        // UV (32,0): second head layer, inflated by 0.5 px per side.
        // Used for helmets in the vanilla renderer; can be repurposed for
        // a hood/blindfold on the Lurker texture.
        root.addChild(
                EntityModelPartNames.HAT,
                ModelPartBuilder.create()
                        .uv(32, 0)
                        .cuboid(-4.0f, -8.0f, -4.0f, 8, 8, 8, new Dilation(0.5f)),
                ModelTransform.pivot(0.0f, 0.0f, 0.0f));

        // ── Body (torso) ──────────────────────────────────────────────────
        // UV (16,16): 8w × 12h × 4d.
        root.addChild(
                EntityModelPartNames.BODY,
                ModelPartBuilder.create()
                        .uv(16, 16)
                        .cuboid(-4.0f, 0.0f, -2.0f, 8, 12, 4, Dilation.NONE),
                ModelTransform.pivot(0.0f, 0.0f, 0.0f));

        // ── Right arm ─────────────────────────────────────────────────────
        // UV (40,16): 4w × 12h × 4d.  Pivot shifted −5 on X (right side).
        root.addChild(
                EntityModelPartNames.RIGHT_ARM,
                ModelPartBuilder.create()
                        .uv(40, 16)
                        .cuboid(-3.0f, -2.0f, -2.0f, 4, 12, 4, Dilation.NONE),
                ModelTransform.pivot(-5.0f, 2.0f, 0.0f));

        // ── Left arm ──────────────────────────────────────────────────────
        // UV (32,48): mirrored arm.  Pivot shifted +5 on X (left side).
        root.addChild(
                EntityModelPartNames.LEFT_ARM,
                ModelPartBuilder.create()
                        .uv(32, 48)
                        .cuboid(-1.0f, -2.0f, -2.0f, 4, 12, 4, Dilation.NONE),
                ModelTransform.pivot(5.0f, 2.0f, 0.0f));

        // ── Right leg ─────────────────────────────────────────────────────
        // UV (0,16): 4w × 12h × 4d.  Pivot at body bottom (Y=12) − 1.9 X.
        root.addChild(
                EntityModelPartNames.RIGHT_LEG,
                ModelPartBuilder.create()
                        .uv(0, 16)
                        .cuboid(-2.0f, 0.0f, -2.0f, 4, 12, 4, Dilation.NONE),
                ModelTransform.pivot(-1.9f, 12.0f, 0.0f));

        // ── Left leg ──────────────────────────────────────────────────────
        // UV (16,48): mirrored leg.
        root.addChild(
                EntityModelPartNames.LEFT_LEG,
                ModelPartBuilder.create()
                        .uv(16, 48)
                        .cuboid(-2.0f, 0.0f, -2.0f, 4, 12, 4, Dilation.NONE),
                ModelTransform.pivot(1.9f, 12.0f, 0.0f));

        // UV atlas is 64×64 pixels — matches the player skin layout.
        return TexturedModelData.of(model, 64, 64);
    }
}
