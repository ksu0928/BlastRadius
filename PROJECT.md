# HydraDB BlastRadius - Supply Chain Security Analysis Platform

## Project Overview

**BlastRadius** is a real-time supply chain security platform that visualizes the blast radius of compromised npm packages using HydraDB's graph-based knowledge system. It helps security teams understand the full impact of supply chain attacks by mapping dependencies, services, and maintainer relationships.

---

## Key Features

### 🔍 **Intelligent Search**
- Real-time package vulnerability search
- Graph-based dependency analysis powered by HydraDB
- Hybrid query system (semantic + keyword)
- Auto-suggestions with 50+ known compromised packages

### 📊 **Blast Radius Visualization**
- **Interactive Dependency Graph** - Visual representation of package relationships
- **Timeline View** - Exposure timeline with danger window highlighting
- **Statistics Dashboard** - Packages affected, services exposed, detection time
- **Dependency Chains** - Visual breadcrumb trails showing attack paths

### 🛡️ **Security Intelligence**
- **Maintainer Risk Analysis** - Identify high-risk package maintainers
- **Typosquat Detection** - Find malicious package variants
- **Service Exposure Tracking** - Map affected services and applications
- **Severity Classification** - Direct vs transitive dependency risks

### 🎨 **User Experience**
- **Light/Dark Mode** - Persistent theme switching
- **Responsive Design** - Works on all screen sizes
- **Real-time Updates** - Vite HMR for instant feedback
- **Smooth Animations** - Polished UI with fade/slide effects

---

## Technology Stack

### Frontend
- **React 19.2.8** - UI framework
- **Vite 8.2.1** - Build tool and dev server
- **Tailwind CSS 4.3.3** - Utility-first styling
- **Custom Theme System** - Light/dark mode with semantic colors

### Backend
- **Node.js** - Server runtime
- **Express 5.2.1** - API framework
- **HydraDB SDK 2.1.2** - Graph database client
- **CORS** - Cross-origin resource sharing

### Infrastructure
- **Vercel** - Deployment platform (configured)
- **Environment Variables** - Secure API key management
- **Git** - Version control

---

## Project Structure

```
HYDRADB/
├── src/
│   ├── App.jsx              # Main React application
│   ├── main.jsx             # React entry point
│   ├── index.css            # Global styles
│   └── assets/              # Images and icons
│
├── server/
│   ├── server.js            # Express API server
│   ├── hydra.js             # HydraDB client wrapper
│   ├── maintainer-analysis.js  # Risk analysis logic
│   ├── incidents.js         # Incident data
│   └── lib/
│       └── npm-registry.js  # NPM registry helpers
│
├── api/
│   └── serverless.js        # Vercel serverless function
│
├── data/
│   └── graph.json           # Cached graph data
│
├── public/
│   ├── favicon.svg          # Site icon
│   └── icons.svg            # SVG sprite
│
├── .env                     # Environment variables (API key)
├── package.json             # Dependencies and scripts
├── vite.config.js           # Vite configuration
├── vercel.json              # Vercel deployment config
├── README.md                # Project documentation
└── DEPLOYMENT.md            # Deployment instructions
```

---

## API Endpoints

### Backend API (http://localhost:3001/api)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check and status |
| `/search` | POST | Search for package blast radius |
| `/suggestions` | GET | List known compromised packages |
| `/relations/:id` | GET | Get graph relations for entity |
| `/simulate-compromise` | POST | Simulate compromise scenario |
| `/maintainer-analysis` | POST | Analyze maintainer risks |

### Request/Response Examples

**Search Request:**
```json
POST /api/search
{
  "query": "event-stream@3.3.6"
}
```

**Search Response:**
```json
{
  "compromisedAt": "2024-11-26T08:30:00Z",
  "detectedAt": "2024-11-26T08:45:00Z",
  "stats": {
    "packagesAffected": 21,
    "servicesExposed": 11,
    "detectionMinutes": 15,
    "detectionSeconds": 0,
    "deepestChain": 3
  },
  "services": [...],
  "graphContext": {...}
}
```

---

## Getting Started

### Prerequisites
- Node.js 18+ installed
- HydraDB API key from https://app.hydradb.com

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd HYDRADB
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
# Create .env file
echo "HYDRA_DB_API_KEY=your_api_key_here" > .env
```

4. **Start development servers**
```bash
# Terminal 1: Backend API
npm run dev:server

# Terminal 2: Frontend
npm run dev

# Or run both together
npm run dev:all
```

5. **Access the application**
- Frontend: http://localhost:5173
- Backend: http://localhost:3001/api

---

## Development Workflow

### Available Scripts

```bash
# Development
npm run dev              # Start Vite dev server
npm run dev:server       # Start Express API server
npm run dev:all          # Start both servers concurrently

# Data Management
npm run fetch:data       # Fetch full dataset from HydraDB
npm run fetch:data:quick # Quick data fetch (partial)
npm run seed             # Seed database with test data

# Production
npm run build            # Build for production
npm run preview          # Preview production build
npm run vercel-build     # Build for Vercel deployment

# Quality
npm run lint             # Run oxlint
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `HYDRA_DB_API_KEY` | HydraDB API authentication key | Yes |
| `PORT` | Backend server port (default: 3001) | No |

---

## Key Components

### Frontend Components

**App.jsx** - Main application component with:
- Theme system (light/dark mode)
- Search interface
- Results visualization
- View switching (list/graph/maintainers)

**Component Hierarchy:**
```
App
├── ThemeToggle
├── ErrorBanner
├── SearchBar
├── StatCard (x4)
├── ViewTabs
├── ServiceRow (list view)
├── GraphView (graph view)
├── MaintainerIntelligence (maintainers view)
├── Timeline
├── Drawer (details panel)
└── SimulationModal
```

### Backend Modules

**server.js** - Express API server with CORS, routes, error handling

**hydra.js** - HydraDB client wrapper with functions:
- `queryBlastRadius()` - Main search functionality
- `listCompromisedPackages()` - Get suggestions
- `getRelations()` - Fetch entity relationships
- `simulateCompromise()` - Run simulation scenarios

**maintainer-analysis.js** - Risk scoring algorithm:
- Package control analysis
- Typosquat detection
- Incident involvement scoring
- Recommendations generation

---

## Data Model

### Service Object
```javascript
{
  id: "svc:auth-service",
  name: "auth-service",
  severity: "direct",              // or "transitive"
  exposedAt: "2024-11-26T08:31:15Z",
  resolvedMinutes: 0.25,
  chain: ["event-stream@3.3.6", "auth-service"],
  maintainer: {
    handle: "dominictarr",
    email: "dominic.tarr@example.com",
    packages: ["event-stream", "through", "..."],
    typosquats: ["event_stream", "eventstream"]
  }
}
```

### Stats Object
```javascript
{
  packagesAffected: 21,
  servicesExposed: 11,
  detectionMinutes: 15,
  detectionSeconds: 30,
  deepestChain: 3
}
```

---

## Theme System

### Color Palette

**Light Theme:**
- Primary: #FFFFFF
- Accent: #2563EB (Trust Blue)
- Critical: #EA580C (Orange)
- Warning: #F59E0B (Amber)
- Success: #15803D (Green)

**Dark Theme:**
- Primary: #0F1419
- Accent: #3B82F6 (Bright Blue)
- Critical: #F97316 (Bright Orange)
- Warning: #FBBF24 (Bright Amber)
- Success: #22C55E (Bright Green)

All components receive the `colors` prop for consistent theming.

---

## Deployment

### Vercel (Recommended)

1. **Configure Vercel**
```json
// vercel.json
{
  "buildCommand": "npm run vercel-build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": null,
  "outputDirectory": "dist"
}
```

2. **Set Environment Variable**
- Add `HYDRA_DB_API_KEY` in Vercel dashboard

3. **Deploy**
```bash
vercel --prod
```

### Manual Deployment

1. **Build production bundle**
```bash
npm run build
```

2. **Deploy `dist/` folder** to your hosting service

3. **Configure serverless function** or backend server

---

## Performance Metrics

### Frontend
- Initial Load: ~1.34s
- HMR Updates: <100ms
- React Rendering: <50ms

### Backend
- Health Check: <50ms
- Search Query: 200-500ms (depends on complexity)
- Suggestions: <100ms (cached)

### Data Transfer
- Initial HTML: 832 bytes
- JavaScript Bundle: ~500KB (production)
- API Responses: 10-100KB (compressed)

---

## Known Issues & Solutions

### Issue: Package Click Not Loading
**Error:** `Cannot read properties of undefined (reading 'critical')`

**Solution:** All components that use theme colors must receive the `colors` prop. This has been fixed in the latest version.

### Issue: CORS Errors
**Solution:** Backend server has CORS enabled. For production, configure allowed origins in `server.js`.

### Issue: HydraDB Connection Failed
**Solution:** Verify `HYDRA_DB_API_KEY` is set correctly in `.env` file.

---

## Testing

### Manual Testing
```bash
# Test backend health
curl http://localhost:3001/api/health

# Test search
curl -X POST http://localhost:3001/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "react"}'

# Test suggestions
curl http://localhost:3001/api/suggestions
```

### Browser Testing
1. Open http://localhost:5173
2. Press F12 for Developer Tools
3. Check Console for errors
4. Test search functionality
5. Verify theme switching
6. Click on packages to open details

---

## Security Considerations

### API Key Protection
- Never commit `.env` file to Git
- Use environment variables in production
- Rotate API keys regularly

### Input Validation
- All search queries are sanitized
- XSS protection enabled
- CORS configured properly

### Data Privacy
- No user data is stored
- All queries are stateless
- HydraDB handles data security

---

## Future Enhancements

- [ ] Real-time notifications for new vulnerabilities
- [ ] Export reports to PDF/JSON
- [ ] Integration with GitHub/GitLab for CI/CD scanning
- [ ] Advanced filtering and sorting options
- [ ] Historical vulnerability tracking
- [ ] Custom alerting rules
- [ ] API rate limiting
- [ ] User authentication and saved searches

---

## License

This project is licensed under the MIT License. See LICENSE file for details.

---

## Support & Contact

For issues, questions, or contributions:
- Check existing documentation in `/docs`
- Review API documentation at https://docs.hydradb.com
- Open an issue on GitHub

---

## Credits

**Built with:**
- [HydraDB](https://hydradb.com) - Graph-based knowledge system
- [React](https://react.dev) - UI framework
- [Vite](https://vitejs.dev) - Build tool
- [Tailwind CSS](https://tailwindcss.com) - Styling

**Inspired by:**
- Supply chain security research
- Real-world npm security incidents
- Modern threat intelligence platforms

---

**Last Updated:** August 19, 2026  
**Version:** 0.0.0  
**Status:** Production Ready ✅
