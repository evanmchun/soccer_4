# Deployment Guide - Soccer Quiz Game

## 🚀 Quick Deploy Options

### Option 1: GitHub Pages (FREE & Easiest)

Since your code is already on GitHub, this is the fastest option:

1. **Go to your GitHub repository**
   - Navigate to: `https://github.com/evanmchun/soccer_4`

2. **Enable GitHub Pages**
   - Click **Settings** tab
   - Scroll down to **Pages** section (left sidebar)
   - Under **Source**, select:
     - **Branch:** `main`
     - **Folder:** `/ (root)`
   - Click **Save**

3. **Your game will be live at:**
   ```
   https://evanmchun.github.io/soccer_4/
   ```
   (Replace `evanmchun` with your GitHub username)

4. **Access your game:**
   - Game: `https://evanmchun.github.io/soccer_4/index.html`
   - Admin: `https://evanmchun.github.io/soccer_4/admin.html`

**✅ Pros:** Free, automatic deployment on every push, HTTPS  
**⚠️ Cons:** Questions stored in localStorage (per browser, not synced across devices)

---

### Option 2: Netlify (FREE - Recommended for Production)

**Best for:** Easy deployment, custom domain support, form handling

1. **Go to https://www.netlify.com**
   - Sign up with GitHub (easiest)

2. **Deploy from Git**
   - Click **"New site from Git"**
   - Choose **GitHub**
   - Authorize Netlify
   - Select repository: `soccer_4`
   - **Build settings:**
     - Build command: (leave empty - static site)
     - Publish directory: `/`
   - Click **Deploy site**

3. **Your game will be live at:**
   ```
   https://your-site-name.netlify.app
   ```

4. **Custom Domain (Optional)**
   - Go to **Domain settings**
   - Add your custom domain

**✅ Pros:** Free tier, automatic HTTPS, custom domains, easy to use  
**✅ Bonus:** Can add backend functions later for question syncing

---

### Option 3: Vercel (FREE - Great for Performance)

**Best for:** Fast global CDN, excellent performance

1. **Go to https://vercel.com**
   - Sign up with GitHub

2. **Import Repository**
   - Click **"Add New Project"**
   - Select repository: `soccer_4`
   - **Settings:**
     - Framework Preset: Other
     - Root Directory: `./`
   - Click **Deploy**

3. **Your game will be live at:**
   ```
   https://soccer-4.vercel.app
   ```

**✅ Pros:** Fast CDN, automatic HTTPS, custom domains  
**✅ Bonus:** Great for embedding in LMS systems

---

## 🔒 Important Notes About Admin Page

**Current Limitation:** 
- Questions are stored in `localStorage` (browser storage)
- This means questions are **per browser/device**
- If you want questions to sync across all learners, you'll need a backend

**Current Workflow:**
1. Admin opens `admin.html` in their browser
2. Adds questions (saved to their browser's localStorage)
3. Learners access the game
4. Game loads questions from the learner's localStorage (which might be empty)

**Future Solution:** Backend API
- Store questions in a database
- Game fetches questions from API
- Admin updates via API
- All learners see same questions

---

## 📋 Pre-Deployment Checklist

- [ ] Test game on localhost
- [ ] Test admin page saves questions
- [ ] Test game loads questions
- [ ] Check all assets load (GLB files, sounds, images)
- [ ] Test on different browsers
- [ ] Test on mobile devices (if needed)
- [ ] Verify HTTPS works (required for some features)

---

## 🌐 Embedding for E-Learning Platforms

Once deployed, learners can embed your game in their LMS:

```html
<iframe 
  src="https://your-site.netlify.app/index.html" 
  width="1200" 
  height="800" 
  frameborder="0"
  allowfullscreen>
</iframe>
```

### With Custom Questions (URL Parameter)

You can add URL parameters to load specific question sets:
```
https://your-site.netlify.app/index.html?questions=set1
```

---

## 📊 File Size Considerations

Your optimized files:
- Total game size: ~30-35 MB
- Individual GLB files: Already optimized
- Audio files: Consider further compression if needed

**CDN Benefits:** 
- Files are cached globally
- Faster loading for users worldwide
- Reduced server costs

---

## 🛠️ Optional: Add a Backend (Later)

When ready to sync questions across devices:

### Option A: Firebase (Google) - Free Tier
- Database for questions
- Authentication for admin
- Free tier: Very generous

### Option B: Supabase - Free Tier
- PostgreSQL database
- Real-time sync
- Similar to Firebase but open source

### Option C: Custom Backend
- Node.js/Express server
- Simple JSON storage or database
- Deploy on Railway, Render, or Fly.io

---

## 🔧 Environment-Specific Settings

If you need different settings for dev/production, create a config file:

```javascript
// config.js
const config = {
  isDevelopment: window.location.hostname === 'localhost',
  apiUrl: window.location.hostname === 'localhost' 
    ? 'http://localhost:8080/api'
    : 'https://your-api.com/api'
};
```

---

## 📝 Recommended: GitHub Pages

**Recommended for you:** Start with GitHub Pages since your code is already there!

1. Just enable Pages in Settings
2. Push your code
3. Done! 🎉

Then later, if you need:
- Custom domain → Netlify or Vercel
- Backend features → Add Firebase/Supabase
- Better performance → Vercel's CDN is great

---

## 🚨 Troubleshooting

### Files not loading after deployment?

1. **Check file paths** - Use relative paths (`./` not absolute)
2. **Check browser console** - Look for 404 errors
3. **Check file sizes** - Some hosts have file size limits
4. **Check MIME types** - GLB files might need proper headers

### Questions not syncing?

- This is expected with localStorage
- Each browser/device has its own storage
- Need backend API for true syncing

---

## 📞 Need Help?

If you encounter issues:
1. Check browser console (F12)
2. Check network tab for failed requests
3. Verify all files committed to Git
4. Check hosting platform logs

---

## ✅ Quick Start Deployment

**Fastest way to go live RIGHT NOW:**

1. Go to GitHub repo → Settings → Pages
2. Enable Pages on `main` branch
3. Wait 2-3 minutes
4. Visit `https://evanmchun.github.io/soccer_4/`
5. Done! 🎉

