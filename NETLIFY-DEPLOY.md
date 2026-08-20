# Deploy to Netlify

## Quick Deploy via Netlify Dashboard (Recommended)

1. Go to https://app.netlify.com/start
2. Click "Import from Git"
3. Choose "GitHub" and select the repository: `ksu0928/BlastRadius`
4. Configure build settings:
   - **Build command:** `npm run fetch:data:quick && npm run build`
   - **Publish directory:** `dist`
   - **Functions directory:** `netlify/functions`
5. Add environment variable:
   - **Key:** `HYDRA_DB_API_KEY`
   - **Value:** Your HydraDB API key
6. Click "Deploy site"

## Deploy via CLI

If you prefer using the command line:

```powershell
# Create and deploy a new site
netlify deploy --prod

# When prompted:
# - Choose "Create & configure a new project"
# - Site name: blastradius (or your preferred name)
# - Follow the prompts

# The build will run automatically using netlify.toml configuration
```

## Environment Variables

Make sure to set this in Netlify dashboard:

- **HYDRA_DB_API_KEY** = Your API key from https://app.hydradb.com

## API Endpoints

After deployment, your API will be available at:

- `https://your-site.netlify.app/api/search`
- `https://your-site.netlify.app/api/suggestions`
- `https://your-site.netlify.app/api/simulate-compromise`
- `https://your-site.netlify.app/api/maintainer-analysis`
- `https://your-site.netlify.app/api/health`

## Troubleshooting

If functions aren't working:

1. Check Netlify function logs in dashboard
2. Verify `HYDRA_DB_API_KEY` is set
3. Check that `netlify.toml` is in repository root
4. Ensure all dependencies are in `package.json`
