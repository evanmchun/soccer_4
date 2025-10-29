# Deploy to Vercel - Quick Guide

## ✅ Why Vercel is Great for This Project:

- **Free tier** - Perfect for testing
- **Fast global CDN** - Your GLB files load quickly worldwide
- **Automatic HTTPS** - Secure by default
- **GitHub integration** - Auto-deploy on every push
- **Easy to use** - Simple setup process

## 🚀 Deployment Steps:

### Option 1: Deploy via Vercel Website (Recommended for First Time)

1. **Go to https://vercel.com**
   - Sign up or log in (can use GitHub account)

2. **Click "Add New Project"**
   - Import your GitHub repository
   - Find: `evanmchun/soccer_4`
   - Click "Import"

3. **Configure Project Settings:**
   - **Framework Preset:** Other
   - **Root Directory:** `./` (leave as is)
   - **Build Command:** (leave empty - static site)
   - **Output Directory:** `./` (leave as is)

4. **Click "Deploy"**
   - Wait 2-3 minutes for deployment
   - Vercel will show you the live URL

5. **Your game will be live at:**
   ```
   https://soccer-4-xxx.vercel.app
   ```
   (or a custom domain if you add one)

### Option 2: Deploy via CLI (Advanced)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```
   
   Follow prompts:
   - Set up and deploy? **Yes**
   - Link to existing project? **No** (first time)
   - Project name? (hit enter for default)
   - Directory? `./`

4. **For production:**
   ```bash
   vercel --prod
   ```

## 📋 Files Ready:

✅ `vercel.json` - Configuration file (created)
✅ All game files committed to Git
✅ Static assets (GLB files, sounds, images)

## 🧪 Testing After Deployment:

1. **Visit your Vercel URL**
   - Game: `https://your-app.vercel.app/index.html`
   - Admin: `https://your-app.vercel.app/admin.html`

2. **Test the workflow:**
   - Open admin page
   - Add 2-3 questions
   - Save and copy the share link
   - Open share link in new browser/incognito
   - Verify questions load

3. **Test embedding:**
   - Copy embed code from admin
   - Test in an iframe

## 🔧 Important Notes:

### File Size Considerations:
- Your optimized GLB files (~30 MB total) should be fine
- Vercel free tier: 100 GB bandwidth/month
- Files are cached on CDN, so repeated visits are fast

### URL Limits:
- Very long quiz links (50+ questions) might hit URL length limits
- Solution: Use JSON export/import for very large quizzes

### Environment Variables (if needed later):
- Can add in Vercel dashboard → Settings → Environment Variables
- Useful for API keys if you add backend later

## 🔄 Continuous Deployment:

Once connected to GitHub:
- **Every push to `main` branch = automatic deploy**
- Vercel creates preview deployments for pull requests
- Production URL stays stable

## 📝 Access Your Deployed App:

After deployment, you'll get:
1. **Production URL:** Stable URL for sharing
2. **Preview URLs:** For each branch/PR
3. **Analytics:** View traffic (on pro plan)

## 🐛 Troubleshooting:

### Files not loading?
- Check browser console for 404 errors
- Verify all files committed to Git
- Check file paths (use relative paths)

### Questions not syncing?
- Make sure you're using the share link with `?quiz=ID&data=...`
- Check browser console for errors
- Try in incognito mode to simulate new learner

### Build errors?
- Your site is static (no build needed)
- If you see errors, check `vercel.json` syntax

## ✅ Next Steps After Deployment:

1. ✅ Test admin page → add questions
2. ✅ Test share link → open in new browser
3. ✅ Test embed code → try in iframe
4. ✅ Share with a test learner
5. ✅ Optional: Add custom domain (Settings → Domains)

---

## 🎉 You're Ready!

Your game will be live and shareable in minutes. Vercel is perfect for this use case!

