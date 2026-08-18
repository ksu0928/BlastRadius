# 🚀 DEPLOY TO VERCEL NOW — Step-by-Step

## ✅ Pre-Deployment Checklist

Everything is ready:
- ✅ Code pushed to GitHub: https://github.com/ksu0928/BUILDRADIUS
- ✅ vercel.json configured
- ✅ api/serverless.js created
- ✅ package.json has vercel-build script
- ✅ All commits dated Aug 18, 2026
- ✅ No .env in git history

---

## 📋 DEPLOYMENT STEPS (5 Minutes)

### Step 1: Go to Vercel
**Open in browser:** https://vercel.com/new

### Step 2: Sign In / Sign Up
- If you have a Vercel account: Sign in
- If not: Click "Sign Up" → Choose "Continue with GitHub"
  - This will automatically connect your GitHub account

### Step 3: Import Project
1. You'll see "Import Git Repository"
2. In the search box, type: `BUILDRADIUS`
3. You should see: `ksu0928/BUILDRADIUS`
4. Click the **"Import"** button next to it

**If you don't see the repo:**
- Click "Adjust GitHub App Permissions"
- Grant Vercel access to your repositories
- Refresh and try again

### Step 4: Configure Project

You'll see a configuration screen with these sections:

#### **Project Name** (Optional)
- Default: `buildradius` (lowercase)
- You can change it or keep the default
- This becomes part of your URL: `buildradius.vercel.app`

#### **Framework Preset**
- Should auto-detect: "Vite"
- If not, select "Vite" from dropdown

#### **Root Directory**
- Leave as: `./` (default)

#### **Build and Output Settings**
- Build Command: Should auto-fill as `npm run build`
- **IMPORTANT:** Change this to: `npm run vercel-build`
- Output Directory: `dist` (should be auto-filled)
- Install Command: `npm install` (auto-filled)

#### **Environment Variables** ⚠️ CRITICAL
Click "Add" under Environment Variables section:

1. **Name:** `HYDRA_DB_API_KEY`
2. **Value:** [Paste your HydraDB API key here]
   - Get it from: https://app.hydradb.com
   - Should look like: `hdb_xxxxxxxxxxxxxxxxxxxxx`
3. **Environments:** Check all three boxes:
   - ☑️ Production
   - ☑️ Preview
   - ☑️ Development

**Screenshot reference:** This is the most critical step. Double-check the key is correct.

### Step 5: Deploy
1. Click the big blue **"Deploy"** button
2. Vercel will now:
   - Clone your repository
   - Install dependencies (~30 seconds)
   - Run `npm run vercel-build` (~1-2 minutes)
     - This generates graph data
     - Builds the frontend
   - Deploy to CDN

**Expected build log:**
```
Running "npm run vercel-build"
> npm run fetch:data:quick && vite build

─── BlastRadius Quick Build ───
Generating representative package graph...
─── Build complete ───
  Packages: 212
  Edges:    1109

Building for production...
✓ 150 modules transformed.
dist/index.html                   2.34 kB
dist/assets/index-abc123.css      8.92 kB
dist/assets/index-def456.js     142.18 kB
✓ built in 3.2s
```

### Step 6: Wait for Deployment
- Watch the build logs (they stream live)
- Should take **2-3 minutes** total
- When done, you'll see: "🎉 Deployment ready"

---

## ✅ VERIFY DEPLOYMENT

### Step 1: Visit Your Site
Click the "Visit" button or go to the URL shown (e.g., `buildradius.vercel.app`)

### Step 2: Test Core Features

**Test 1: Search**
- Type "event-stream" in search box
- Click "Analyze" button
- Should see: Stats cards with packages/services

**Test 2: Live Simulation** ⚡
- Click the "⚡ Simulate Live Compromise" button
- Watch the timer run
- Should complete in <500ms
- Should show: "Blast Radius Resolved in Xms"

**Test 3: Maintainer Intelligence**
- Click the "👤 Intel" tab (third tab)
- Should see: Risk dashboard with stats
- Click any maintainer row
- Should open: Detail modal with risk breakdown

**Test 4: Graph View**
- Click the "○ Graph" tab
- Should render: SVG graph visualization
- Should see: Red compromised node in center

### Step 3: Check Browser Console
- Press F12 (Developer Tools)
- Go to "Console" tab
- **Should NOT see:**
  - Red errors
  - "Failed to fetch" messages
  - "API key" errors
  
**If you see errors:**
- Most common: Environment variable not set
- Fix: Go to Vercel dashboard → Settings → Environment Variables
- Add HYDRA_DB_API_KEY and redeploy

---

## 🔧 TROUBLESHOOTING

### "Missing API Key" Error
**Symptom:** Search returns empty or error message
**Fix:**
1. Go to Vercel dashboard: https://vercel.com/dashboard
2. Click your project: `buildradius`
3. Go to: Settings → Environment Variables
4. Verify HYDRA_DB_API_KEY exists
5. If missing, add it
6. Go to: Deployments → Click "..." → Redeploy

### API Routes Return 404
**Symptom:** Network tab shows `/api/search` → 404
**Fix:**
1. Check `vercel.json` is in the repo root
2. Check `api/serverless.js` exists
3. Push changes if missing
4. Redeploy

### Build Fails
**Symptom:** Deployment shows red "Failed" status
**Fix:**
1. Click the failed deployment to see logs
2. Common issues:
   - Missing dependency → Check package.json
   - Syntax error → Check recent commits
   - Timeout → Build is too slow (unlikely with 212 packages)
3. Fix the issue and push
4. Vercel auto-deploys on push

### Data Not Loading
**Symptom:** Search works but returns "No results"
**Fix:**
1. Check build logs for "Quick Build" output
2. Verify `data/graph.json` was created during build
3. If not, check `npm run vercel-build` script in package.json
4. Should be: `"vercel-build": "npm run fetch:data:quick && vite build"`

---

## 📝 AFTER SUCCESSFUL DEPLOYMENT

### Step 1: Get Your Deployment URL
Example: `https://buildradius.vercel.app`
Or: `https://buildradius-ksu0928.vercel.app` (if custom)

### Step 2: Update README.md
Replace the line in README.md:
```markdown
**Live Demo:** [Coming soon - Deploy to Vercel]
```

With:
```markdown
**Live Demo:** https://your-actual-url.vercel.app
```

### Step 3: Commit and Push
```bash
git add README.md
git commit -m "Add live deployment URL"
git push origin master
```

This will trigger a new Vercel deployment (automatic on push).

### Step 4: Test Production Again
- Visit the URL one more time
- Test all features again
- Take screenshots if needed for submission

---

## 🎯 YOU'RE DEPLOYED!

Once you see:
- ✅ URL accessible
- ✅ Search works
- ✅ Simulate button works
- ✅ Intel tab loads
- ✅ No console errors

**You're ready for the next steps:**
1. ✅ Deployment complete
2. 📹 Record demo video (15 min)
3. 📝 Submit to hackathon (5 min)

---

## 🆘 NEED HELP?

**Vercel Documentation:** https://vercel.com/docs
**HydraDB Status:** https://app.hydradb.com
**Project Issues:** https://github.com/ksu0928/BUILDRADIUS/issues

**Common URLs:**
- Vercel Dashboard: https://vercel.com/dashboard
- Project Settings: https://vercel.com/[your-username]/buildradius/settings
- Deployment Logs: https://vercel.com/[your-username]/buildradius/deployments

---

**Expected Total Time:** 5-7 minutes from start to live URL

**Good luck! 🚀**
