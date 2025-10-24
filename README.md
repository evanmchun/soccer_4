# Three.js GLB Game

A simple Three.js game that loads and displays GLB models with interactive camera controls.

## Features

- Load GLB/GLTF models
- Interactive camera controls (orbit, pan, zoom)
- Keyboard controls (WASD for movement)
- Drag and drop GLB files
- Performance monitoring (FPS counter)
- Responsive design
- Shadow mapping
- Modern lighting setup

## Getting Started

### Option 1: Using npm (Recommended)

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

This will open your browser automatically to `http://localhost:8080`

### Option 2: Using Python (if you have Python installed)

```bash
# Python 3
python -m http.server 8080

# Python 2
python -m SimpleHTTPServer 8080
```

### Option 3: Using Node.js http-server

```bash
npx http-server -p 8080 -c-1
```

## Usage

1. Open your browser to `http://localhost:8080`
2. Replace `'your-model.glb'` in `game.js` with the path to your GLB file
3. Or simply drag and drop your GLB file onto the browser window

## Controls

- **Mouse:**
  - Left click + drag: Rotate camera around the model
  - Right click + drag: Pan camera
  - Scroll wheel: Zoom in/out

- **Keyboard:**
  - W/A/S/D: Move camera
  - Q/E: Move camera up/down

## GLB Export Tips from Blender

For best results when exporting from Blender:

1. **Apply all transforms** (Ctrl+A → All Transforms)
2. **Center the pivot point** at origin (0,0,0)
3. **Merge by distance** to remove duplicate vertices
4. **Pack textures** into the .blend file before export
5. **Export settings:**
   - Format: GLB (Binary)
   - Include: Selected Objects, Textures, Animations
   - Apply Modifiers: ✓

## File Structure

```
├── index.html          # Main HTML file
├── game.js            # Three.js game logic
├── package.json       # Project configuration
└── README.md          # This file
```

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Performance Tips

- Keep polygon count reasonable (< 50k triangles for good performance)
- Use compressed textures when possible
- Optimize your GLB file size
- Consider LOD (Level of Detail) for complex models

## Troubleshooting

- **Model not loading:** Check the file path and ensure the GLB file is accessible
- **Performance issues:** Reduce polygon count or texture resolution
- **CORS errors:** Make sure you're running from a local server, not opening the HTML file directly
