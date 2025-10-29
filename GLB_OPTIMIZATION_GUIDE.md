# GLB File Size Optimization Guide

## Problem
Your `low_poly_stadium.glb` is over 50MB, which is extremely large for web use. This guide will help you reduce it significantly.

## Quick Start (Recommended)

### Option 1: Using the optimization script

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Optimize your stadium:**
   ```bash
   npm run optimize-stadium
   ```
   
   Or manually:
   ```bash
   node optimize-glb.js character/low_poly_stadium.glb character/low_poly_stadium_optimized.glb
   ```

3. **Test the optimized file** and if it looks good, replace the original:
   ```bash
   mv character/low_poly_stadium_optimized.glb character/low_poly_stadium.glb
   ```

### Option 2: Using gltf-transform CLI directly

```bash
npx @gltf-transform/cli optimize \
  character/low_poly_stadium.glb \
  character/low_poly_stadium_optimized.glb \
  --texture-compress webp \
  --resize-textures 2048 \
  --draco
```

## Expected Results

With proper optimization, you should see:
- **50MB → 5-15MB** (70-90% reduction)
- Most reduction comes from:
  - Texture compression (WebP can be 80% smaller than PNG)
  - Draco geometry compression (90%+ reduction on geometry)
  - Texture resizing (if textures are larger than needed)

## Manual Optimization Steps

### 1. Texture Optimization (Biggest Impact)

**In Blender before export:**
- Check texture sizes in the model
- Resize to 2048x2048 or 1024x1024 (depending on detail needed)
- Use JPEG or WebP instead of PNG when possible
- Use compressed texture formats

**After export (using script):**
- Textures automatically resized and compressed
- Converted to WebP format

### 2. Geometry Optimization

**Draco Compression** (automatic in script):
- Compresses geometry data by 90%+
- Requires THREE.js Draco loader (already supported)
- Minimal quality loss

**Mesh Simplification** (optional):
- Reduces polygon count
- Only use if file is still too large
- May cause visible quality loss

### 3. Material/Mesh Cleanup

- Remove unused materials
- Merge duplicate materials
- Remove hidden/invisible meshes

## Advanced: Manual Blender Optimization

If you have access to Blender:

1. **Import the GLB into Blender**
2. **Reduce textures:**
   - Select materials → check texture sizes
   - Use Image Editor to resize textures to 2048x2048
   - Save as JPEG (quality 85%) instead of PNG

3. **Optimize geometry:**
   - Apply "Decimate" modifier (carefully - test quality)
   - Remove double vertices: Mesh → Clean Up → Merge by Distance

4. **Clean up:**
   - Remove unused materials
   - Remove hidden objects

5. **Re-export:**
   - File → Export → glTF 2.0
   - Format: GLB
   - Check "Compression: Draco" (if available)

## Other GLB Files

You can optimize all your GLB files:

```bash
# Optimize character
node optimize-glb.js character/ch_animations.glb character/ch_animations_optimized.glb

# Optimize goalie
node optimize-glb.js character/ch_goalie.glb character/ch_goalie_optimized.glb

# Optimize ball
node optimize-glb.js character/ball.glb character/ball_optimized.glb

# Optimize goal
node optimize-glb.js character/goal.glb character/goal_optimized.glb
```

## Tips

1. **Always test optimized files** before replacing originals
2. **Keep backups** of original files
3. **Optimize incrementally** - try one optimization at a time to see impact
4. **Texture size matters most** - reducing from 4096x4096 to 2048x2048 can cut size by 75%
5. **Draco compression** is your friend - enables massive geometry compression

## Troubleshooting

**"Module not found" error:**
- Run `npm install` first

**File still too large:**
- Try reducing texture size to 1024x1024
- Check if textures are embedded (may be better to reference externally)
- Consider simplifying geometry in Blender

**Quality loss:**
- Increase Draco quantization values in `optimize-glb.js`
- Use 'high' quality for texture compression
- Don't enable mesh simplification

