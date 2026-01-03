# Push Ninja

<div align="center">

**A blockchain-powered token slicing game built on Push Chain**

[![Push Chain](https://img.shields.io/badge/Push%20Chain-Devnet-blue)](https://push.org/)
[![React](https://img.shields.io/badge/React-18.2.0-blue)](https://reactjs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)

</div>

---

## About The Project

Push Ninja is an interactive blockchain gaming experience that combines fast-paced token slicing gameplay with Web3 technology. Slash flying tokens, avoid bombs, and immortalize your achievements as NFTs on the Push Chain blockchain!

### Key Features

- **Intuitive Slash Mechanics** - Slice fruits with mouse/touch gestures
- **Strategic Gameplay** - Avoid bombs and maximize combos
- **NFT Minting** - Mint your high scores as on-chain NFTs
- **Wallet Integration** - Connect with Push Wallet
- **Multiplayer Mode** - Compete against other players in real-time
- **Staking System** - Stake PUSH tokens in multiplayer matches
- **Achievement System** - Track stats, combos, and personal bests
- **Real-time Scoring** - Dynamic point system with combo multipliers
- **Responsive Design** - Play on desktop or mobile

---

## Tech Stack

### Frontend
- **Next.js 14** - React framework
- **React 18.2.0** - Modern UI library
- **Push Chain SDK** - Blockchain interaction
- **Socket.IO** - Real-time multiplayer
- **CSS3** - Advanced animations and effects

### Smart Contracts
- **Solidity** - Smart contract language
- **Hardhat** - Development environment
- **Push Chain** - Layer 2 blockchain

### Backend
- **Node.js** - Server runtime
- **Express** - REST API
- **Socket.IO** - WebSocket connections
- **Supabase** - Database and real-time subscriptions

---

## Game Mechanics

### Scoring System
- **Token Slice**: +10 points
- **Combo Multiplier**: Score × combo count
- **Bomb Penalty**: Lose a life

### Multiplayer Mode
- **Public Matches** - Join random opponents
- **Private Matches** - Create rooms with codes
- **Staking Tiers** - 4 PUSH token tiers (1, 5, 10, 25 PUSH)
- **Prize Distribution** - Winner gets 98%, 2% platform fee

### NFT Metadata
Each minted NFT stores:
- Final Score
- Maximum Combo Achieved
- Total Tokens Sliced
- Bombs Hit
- Game Duration
- Timestamp

---

## Installation

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- Git
- Push Wallet

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/push-ninja.git
   cd push-ninja
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your values.

4. **Start development server**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000)

5. **Start backend server** (for multiplayer)
   ```bash
   cd backend
   npm install
   npm run dev
   ```

---

## How to Play

1. **Connect Wallet**
   - Click "Connect Wallet" button
   - Connect with Push Wallet
   - Approve connection

2. **Start Game**
   - Choose Single Player or Multiplayer
   - Slash tokens, avoid bombs!

3. **Build Combos**
   - Slice multiple fruits rapidly
   - Higher combos = higher scores
   - Don't miss any tokens!

4. **Mint NFT**
   - After game ends, click "Mint Game NFT"
   - Approve transaction in wallet
   - Your achievement is on-chain forever!

---

## Project Structure

```
push-ninja/
├── public/              # Static assets
├── src/
│   ├── components/      # React components
│   ├── hooks/           # Custom React hooks
│   ├── services/        # Blockchain services
│   └── ...
├── pages/               # Next.js pages
├── styles/              # CSS files
├── contracts/           # Solidity smart contracts
├── backend/             # Node.js backend server
├── supabase/            # Database migrations
└── README.md
```

---

## Deployment

### Deploy to Vercel

```bash
npm install -g vercel
vercel login
vercel --prod
```

---

## Built With

| Technology | Purpose |
|------------|---------|
| [Next.js](https://nextjs.org/) | React framework |
| [Push Chain](https://push.org/) | Blockchain platform |
| [Socket.IO](https://socket.io/) | Real-time communication |
| [Supabase](https://supabase.com/) | Database |
| [Vercel](https://vercel.com/) | Hosting platform |

---

<div align="center">

**Push Ninja**

</div>
