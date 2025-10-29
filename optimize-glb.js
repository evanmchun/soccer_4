/**
 * GLB File Optimization Script
 * Reduces file size of GLB models using gltf-transform
 */

const { NodeIO } = require('@gltf-transform/core');
const { draco, textureCompress, textureResize, dedup, prune, simplify, resample } = require('@gltf-transform/functions');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  // Texture optimization
  textureMaxSize: 2048,      // Resize textures to max 2048px (reduce from higher if needed)
  textureFormat: 'webp',     // Use WebP format (better compression than PNG/JPG)
  
  // Geometry optimization
  draco: true,               // Enable Draco compression (can reduce geometry by 90%+)
  dracoQuantizationPosition: 14,  // Position quantization (11-16, higher = better quality, larger size)
  dracoQuantizationNormal: 10,    // Normal quantization
  dracoQuantizationTexcoord: 12,   // Texture coordinate quantization
  
  // Mesh optimization
  simplify: false,           // Simplify meshes (can cause quality loss, use carefully)
  simplifyRatio: 0.75,        // If simplifying, reduce to 75% of original
  
  // Other optimizations
  prune: true,               // Remove unused data
  dedup: true,               // Deduplicate materials/textures
  resample: true,            // Optimize animations
};

async function optimizeGLB(inputPath, outputPath) {
  console.log(`\n📦 Optimizing: ${inputPath}`);
  
  // Check if input file exists
  if (!fs.existsSync(inputPath)) {
    console.error(`❌ Error: File not found: ${inputPath}`);
    return;
  }
  
  // Get original file size
  const originalSize = fs.statSync(inputPath).size;
  console.log(`📊 Original size: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);
  
  try {
    // Initialize gltf-transform
    const io = new NodeIO();
    
    // Read GLB file
    console.log('📖 Reading GLB file...');
    const document = await io.read(inputPath);
    
    // Get root
    const root = document.getRoot();
    console.log(`✅ Loaded: ${root.listMeshes().length} meshes, ${root.listMaterials().length} materials`);
    
    // Apply optimizations
    console.log('🔧 Applying optimizations...');
    
    // 1. Remove unused data
    if (config.prune) {
      await document.transform(prune());
      console.log('  ✓ Pruned unused data');
    }
    
    // 2. Deduplicate
    if (config.dedup) {
      await document.transform(dedup());
      console.log('  ✓ Deduplicated materials/textures');
    }
    
    // 3. Resize textures (with error handling)
    if (config.textureMaxSize) {
      try {
        await document.transform(
          textureResize({
            size: [config.textureMaxSize, config.textureMaxSize],
            slots: ['baseColor', 'normal', 'occlusion', 'roughness', 'metallic', 'emissive']
          })
        );
        console.log(`  ✓ Resized textures to max ${config.textureMaxSize}px`);
      } catch (error) {
        console.log(`  ⚠️  Texture resize skipped (may not be needed): ${error.message}`);
      }
    }
    
    // 4. Compress textures (with error handling)
    if (config.textureFormat) {
      try {
        await document.transform(
          textureCompress({
            targetFormat: config.textureFormat,
            quality: 'high', // 'high', 'medium', or 'low'
          })
        );
        console.log(`  ✓ Compressed textures to ${config.textureFormat.toUpperCase()}`);
      } catch (error) {
        console.log(`  ⚠️  Texture compression skipped: ${error.message}`);
      }
    }
    
    // 5. Draco compression for geometry
    if (config.draco) {
      await document.transform(
        draco({
          quantizePosition: config.dracoQuantizationPosition,
          quantizeNormal: config.dracoQuantizationNormal,
          quantizeTexcoord: config.dracoQuantizationTexcoord,
          quantizeColor: 8,
          quantizeGeneric: 12,
        })
      );
      console.log('  ✓ Applied Draco geometry compression');
    }
    
    // 6. Simplify meshes (optional, can cause quality loss)
    if (config.simplify) {
      await document.transform(simplify({ ratio: config.simplifyRatio }));
      console.log(`  ✓ Simplified meshes to ${config.simplifyRatio * 100}%`);
    }
    
    // 7. Optimize animations
    if (config.resample) {
      await document.transform(resample());
      console.log('  ✓ Optimized animations');
    }
    
    // Write optimized GLB
    console.log('💾 Writing optimized GLB...');
    await io.write(outputPath, document);
    
    // Get new file size
    const newSize = fs.statSync(outputPath).size;
    const savings = ((1 - newSize / originalSize) * 100).toFixed(1);
    
    console.log(`\n✅ Optimization complete!`);
    console.log(`📊 New size: ${(newSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`💾 Size reduction: ${savings}%`);
    console.log(`📁 Output: ${outputPath}\n`);
    
  } catch (error) {
    console.error('❌ Error during optimization:', error);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log('Usage: node optimize-glb.js <input.glb> [output.glb]');
    console.log('\nExample:');
    console.log('  node optimize-glb.js character/low_poly_stadium.glb character/low_poly_stadium_optimized.glb');
    return;
  }
  
  const inputPath = args[0];
  const outputPath = args[1] || inputPath.replace('.glb', '_optimized.glb');
  
  await optimizeGLB(inputPath, outputPath);
}

main();

