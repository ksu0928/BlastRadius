# Deployment Guide — BlastRadius on Vercel

## Quick Deploy to Vercel

### Prerequisites
1. GitHub account with the BUILDRADIUS repo
2. Vercel account (free tier works perfectly)
3. HydraDB API key from https://app.hydradb.com

### Step-by-Step Deployment

#### 1. Connect to Vercel
1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select your GitHub account and choose `ksu0928/BUILDRADIUS`
4. Click "Import"

#### 2. Configure Environment Variables
Before deploying, add your environment variable:

1. In the Vercel project configuration, go to "Environment Variables"
2. Add:
   - **Name:** `HYDRA_DB_API_KEY`
   - **Value:** Your HydraDB API key
   - **Environments:** Production, Preview, Development (select all)

#### 3. Deploy
1. Click "Deploy"
2. Vercel will automatically:
   - Run `npm install`
   - Run `npm run vercel-build` (generates graph data + builds frontend)
   - Deploy to a `.vercel.app` domain

#### 4. Verify Deployment
Once deployed, visit your URL (e.g., `buildradius.vercel.app`) and verify:
- ✅ Search works (try "event-stream")
- ✅ Simulate Compromise button functions
- ✅ Maintainer Intelligence tab loads
- ✅ All API calls succeed

### Expected Build Output
```
Running "npm run vercel-build"
> npm run fetch:data:quick && vite build

─── BlastRadius Quick Build ───
Generating representative package graph...
─── Build complete ───
  Packages: 212
  Edges:    1109
  Output:   data/graph.json (0.13 MB)

Building for production...
✓ 150 modules transformed.
dist/index.html                   2.34 kB
dist/assets/index-abc123.css      8.92 kB
dist/assets/index-def456.js     142.18 kB
✓ built in 3.2s
```

## Custom Domain (Optional)

### Add Custom Domain
1. Go to your Vercel project settings
2. Navigate to "Domains"
3. Add your custom domain (e.g., `blastradius.yourdomain.com`)
4. Follow Vercel's DNS configuration instructions

## Troubleshooting

### "Missing API Key" Error
- Check that `HYDRA_DB_API_KEY` is set in Vercel environment variables
- Redeploy after adding the key

### API Routes Return 404
- Verify `vercel.json` is present in the repo
- Check that `api/serverless.js` exists
- Redeploy

### Build Fails
- Check build logs in Vercel dashboard
- Verify `data/` directory is created during build
- Ensure all dependencies are in `package.json`

### Search Returns No Results
- HydraDB may need time to index after first seed
- Check Vercel function logs for errors
- Verify API key has permissions for the `blastradius` database

## Local Development vs Production

### Local Development
```bash
# Terminal 1: Backend server
npm run dev:server

# Terminal 2: Frontend dev server
npm run dev
```

Frontend: `http://localhost:5173`  
Backend: `http://localhost:3001`

### Production (Vercel)
- Frontend: Static files served from CDN
- Backend: Serverless functions at `/api/*`
- Database: HydraDB cloud (same as local)

## Performance Notes

### Cold Start Behavior
- First request after inactivity may take 2-3 seconds (serverless cold start)
- Subsequent requests are fast (<200ms)
- Consider a monitoring service to keep functions warm if needed

### Rate Limits
- HydraDB free tier: Check your plan limits
- Vercel free tier: 100GB bandwidth, unlimited requests

## Deployment Checklist

Before submitting for the hackathon, verify:
- [ ] App is deployed and accessible via public URL
- [ ] Environment variable is set (not exposed in code)
- [ ] All features work in production:
  - [ ] Search functionality
  - [ ] Live blast radius simulation
  - [ ] Maintainer intelligence view
  - [ ] Graph visualization
  - [ ] Timeline view
- [ ] No console errors in browser
- [ ] API responses are fast (<500ms)
- [ ] README includes deployment link

## Support

If deployment issues persist:
1. Check Vercel function logs: Project → Deployments → [Latest] → Function Logs
2. Check HydraDB status: https://app.hydradb.com
3. Review build logs for any missing dependencies

---

**Estimated Deploy Time:** 2-3 minutes  
**Cost:** Free on Vercel + HydraDB free tier
