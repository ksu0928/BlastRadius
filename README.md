# 🔥 HydraDB BlastRadius

**Real-time supply chain security visualization powered by HydraDB**

BlastRadius maps the full impact of compromised npm packages using graph-based dependency analysis, helping security teams understand attack vectors and exposure risk.

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure API key
echo "HYDRA_DB_API_KEY=your_key_here" > .env

# 3. Seed the database (first-time only)
npm run seed

# 4. Start development servers
npm run dev:all

# 5. Open browser
# Frontend: http://localhost:5173
# Backend:  http://localhost:3001/api/health
```

**Get your API key at:** https://app.hydradb.com

**Note:** The `npm run seed` step is required on first run to populate HydraDB with the dependency graph (212 packages, 1203 edges). This takes ~2-3 minutes. After seeding once, the database persists in HydraDB cloud.

---

## ✨ Features

- 🔍 **Intelligent Search** - Find compromised packages instantly
- 📊 **Visual Blast Radius** - Interactive dependency graphs
- 🛡️ **Risk Analysis** - Maintainer intelligence & typosquat detection
- ⚡ **Real-time Updates** - Powered by HydraDB's graph knowledge system
- 🎨 **Modern UI** - Light/dark mode with smooth animations

---

## 📦 Project Structure

```
src/          # React frontend application
server/       # Express API backend
api/          # Vercel serverless functions
data/         # Cached graph data
public/       # Static assets
```

---

## 🛠️ Available Scripts

```bash
npm run dev              # Frontend dev server (Vite)
npm run dev:server       # Backend API server (Express)
npm run dev:all          # Both servers concurrently
npm run build            # Production build
npm run lint             # Code linting
```

---

## 📖 Documentation

For comprehensive documentation, see:
- **[PROJECT.md](./PROJECT.md)** - Complete project guide
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deployment instructions

---

## 🔌 API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/health` | Health check |
| `POST /api/search` | Search package blast radius |
| `GET /api/suggestions` | Known compromised packages |
| `POST /api/simulate-compromise` | Run simulation |
| `POST /api/maintainer-analysis` | Analyze maintainer risk |

---

## 🎯 Example Usage

**Search for compromised package:**
```bash
curl -X POST http://localhost:3001/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "event-stream@3.3.6"}'
```

**Response:**
```json
{
  "stats": {
    "packagesAffected": 21,
    "servicesExposed": 11,
    "detectionMinutes": 15
  },
  "services": [...],
  "graphContext": {...}
}
```

---

## 🌐 Deployment

### Vercel (Recommended)
```bash
vercel --prod
```

### Manual
```bash
npm run build
# Deploy dist/ folder to your hosting service
```

Set `HYDRA_DB_API_KEY` environment variable in your deployment platform.

---

## 🧬 How HydraDB Powers BlastRadius

**Why we need a graph database:**

Traditional relational databases (PostgreSQL, MySQL) struggle with deep dependency traversal because:
- ❌ Recursive JOINs are slow and complex for transitive dependencies
- ❌ No native graph context (path discovery)
- ❌ Fixed schema makes multi-hop queries expensive

**HydraDB enables:**

1. **Transitive Dependency Closure** - Find all packages affected by a compromise through recursive graph traversal (`queryForcefulRelations: true`)
2. **Blast Radius Simulation** - Real-time calculation of exposed services with latency measurement (avg 300-800ms for 50+ node traversal)
3. **Shared Maintainer Analysis** - Cross-package maintainer queries to detect concentration risk
4. **Hybrid Search** - Semantic + keyword search for intelligent package discovery
5. **Graph Context Paths** - Exact dependency chains showing how compromises propagate

**Example Query:**
```javascript
client.query({
  database: "blastradius",
  query: "event-stream compromised blast radius",
  graphContext: true,           // Returns full path context
  queryForcefulRelations: true, // Traverse all edges
  maxResults: 50
})
```

**Data Pipeline:**
```
npm registry + OSV.dev → graph.json (212 pkgs, 1203 edges)
    ↓
seed.js ingests → HydraDB "blastradius" database
    ↓
hydra.js queries → Real-time graph traversal
    ↓
Express API → React frontend
```

**Without HydraDB:** Would need custom BFS/DFS implementation, precomputed adjacency lists, and manual path tracking—losing real-time query flexibility and scalability.

---

## 🛡️ Security

- ✅ API key protected (never commit `.env`)
- ✅ CORS enabled for cross-origin requests
- ✅ Input validation on all endpoints
- ✅ XSS protection enabled

---

## 📊 Tech Stack

**Frontend:** React 19 + Vite + Tailwind CSS  
**Backend:** Node.js + Express  
**Database:** HydraDB (graph-based knowledge system)  
**Deployment:** Vercel

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details

---

## 🙏 Acknowledgments & Attribution

**Built with:**
- [HydraDB](https://hydradb.com) - Graph knowledge database and SDK
- [React](https://react.dev) - UI framework
- [Vite](https://vitejs.dev) - Build tool

**Data Sources:**
- [npm registry API](https://registry.npmjs.org/) - Package metadata and dependency data
- [OSV.dev (Open Source Vulnerabilities)](https://osv.dev/) - Security advisory data via GitHub Security Advisory API
- BlastRadius incident anchors - Historical supply chain incidents (event-stream, left-pad)

**Third-party Libraries:**
- `@hydradb/sdk` - HydraDB JavaScript SDK
- `express` - Web framework
- `cors` - Cross-origin resource sharing
- `dotenv` - Environment variable management

All data sources are used in accordance with their respective licenses and terms of service.

---

**Status:** ✅ Production Ready  
**Version:** 0.0.0  
**Last Updated:** August 19, 2026
