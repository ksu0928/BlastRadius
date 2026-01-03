# Push Ninja Backend (Node.js + npm)

## Setup

1. **Install dependencies**
```bash
cd backend
npm install
```

2. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

3. **Deploy Supabase schema** (if not done already)
- Go to Supabase Dashboard → SQL Editor
- Run the SQL from `../supabase/schema.sql`

4. **Start the server**
```bash
# Development mode (auto-restart)
npm run dev

# Production mode
npm start
```

## What It Does

- ✅ **Multiplayer Game Server**: WebSocket-based real-time game coordination
- ✅ **REST API**: Express server with game and player endpoints
- ✅ **Real-time**: Socket.IO + Supabase subscriptions for live updates
- ✅ **Push Chain Integration**: Works with Push Chain for staking and prizes

## API Endpoints

### Games
- `GET /api/games/available` - Get available games
- `GET /api/games/available?betTier=2` - Filter by bet tier
- `GET /api/games/player/:address` - Get player's games
- `GET /api/games/:gameId` - Get specific game
- `GET /api/games/history/all` - Get match history

### Players
- `GET /api/players/:address` - Get player stats
- `GET /api/players/leaderboard/top` - Get leaderboard

### Health
- `GET /health` - Health check

## Architecture

```
Frontend (Next.js)
    ↓
Backend (Node.js + Express)
    ├─ REST API (games, players)
    ├─ Socket.IO (real-time multiplayer)
    └─ Supabase Client
          ↓
    Supabase Database
    (PostgreSQL)
```

## Deployment

### Local
```bash
npm start
```

### Production (Railway, Heroku, Render, etc.)
```bash
# Set environment variables
# Deploy with: npm start
```

Server runs on port 5000 by default.
