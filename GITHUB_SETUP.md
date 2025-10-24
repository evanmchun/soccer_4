# GitHub Setup Instructions

## Step 1: Create GitHub Repository
1. Go to https://github.com
2. Click "New repository" (green button)
3. Repository name: `threejs-soccer-game` (or your preferred name)
4. Description: "Three.js Soccer Game with GLB Character"
5. Make it Public or Private (your choice)
6. **DO NOT** initialize with README, .gitignore, or license (we already have these)
7. Click "Create repository"

## Step 2: Connect Local Repository to GitHub
After creating the repository, GitHub will show you commands. Use these:

```bash
# Add the remote origin (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/threejs-soccer-game.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 3: Verify Upload
- Go to your GitHub repository
- You should see all files: index.html, game.js, character/, package.json, etc.
- The character GLB files should be uploaded (they're large, so it might take a moment)

## Your Repository Will Include:
- ✅ Complete Three.js soccer game
- ✅ Character model (Ch_idle-2.glb)
- ✅ Professional soccer field
- ✅ Optimized lighting system
- ✅ Interactive controls
- ✅ Performance monitoring
- ✅ Documentation (README.md)

## To Run the Game:
```bash
npm install
npm run dev
```

Then open http://localhost:8080 in your browser!

