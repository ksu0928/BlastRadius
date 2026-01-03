import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import gamesRouter from './routes/games.js';
import playersRouter from './routes/players.js';
import { supabase } from './config/supabase.js';


dotenv.config();

const app = express();

// Parse multiple origins from environment variable
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map(s => s.trim());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make io accessible globally for routes
global.io = io;

// Routes
app.use('/api/games', gamesRouter);
app.use('/api/players', playersRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'Push Ninja Backend',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      games: '/api/games',
      players: '/api/players',
      health: '/health'
    }
  });
});

// Socket.IO for real-time updates
// Track active players in games for disconnect handling
const activeGamePlayers = new Map(); // gameId -> { player1SocketId, player2SocketId }
const disconnectTimers = new Map(); // socketId -> { gameId, timer, playerAddress }
const roomCodeMap = new Map(); // roomCode -> { gameId, createdAt, creatorAddress }
const playerReadyMap = new Map(); // gameId -> Set of ready player addresses (for staking confirmation)
const DISCONNECT_GRACE_PERIOD_MS = 5000; // 5 seconds
const ROOM_CODE_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

// Clean up expired room codes periodically
setInterval(() => {
  const now = Date.now();
  for (const [code, data] of roomCodeMap.entries()) {
    if (now - data.createdAt > ROOM_CODE_EXPIRY_MS) {
      roomCodeMap.delete(code);
      console.log(`🗑️ Expired room code: ${code}`);
    }
  }
}, 60000); // Check every minute

// Clean up stale games (waiting for > 100 seconds without anyone joining)
const STALE_GAME_TIMEOUT_MS = 100 * 1000; // 100 seconds
setInterval(async () => {
  try {
    const cutoffTime = new Date(Date.now() - STALE_GAME_TIMEOUT_MS).toISOString();

    // Cancel all games in WAITING state that are older than the cutoff
    const { data: staleGames, error: findError } = await supabase
      .from('games')
      .select('game_id, created_at')
      .eq('state', 0) // WAITING state
      .lt('created_at', cutoffTime);

    if (findError) {
      console.error('Error finding stale games:', findError);
      return;
    }

    if (staleGames && staleGames.length > 0) {
      const gameIds = staleGames.map(g => g.game_id);

      const { error: updateError } = await supabase
        .from('games')
        .update({
          state: 3, // CANCELLED
          finished_at: new Date().toISOString()
        })
        .in('game_id', gameIds);

      if (updateError) {
        console.error('Error cancelling stale games:', updateError);
      } else {
        console.log(`🧹 Auto-cancelled ${staleGames.length} stale games: ${gameIds.join(', ')}`);

        // Notify all clients to refresh their game list
        io.emit('games_updated', []);
      }
    }
  } catch (error) {
    console.error('Error in stale game cleanup:', error);
  }
}, 30000); // Check every 30 seconds

io.on('connection', (socket) => {
  console.log('👤 Client connected:', socket.id);

  socket.on('subscribe:games', (betTier) => {
    const room = betTier ? `games:${betTier}` : 'games:all';
    socket.join(room);
    console.log(`📺 Client ${socket.id} subscribed to ${room}`);
  });

  socket.on('subscribe:player', (address) => {
    socket.join(`player:${address}`);
    console.log(`📺 Client ${socket.id} subscribed to player ${address}`);
  });

  // Subscribe to specific game for real-time updates
  socket.on('join:game', ({ gameId, playerAddress }) => {
    socket.join(`game:${gameId}`);
    socket.gameId = gameId;
    socket.playerAddress = playerAddress;

    // Track this player in the game
    if (!activeGamePlayers.has(gameId)) {
      activeGamePlayers.set(gameId, {});
    }
    const gamePlayers = activeGamePlayers.get(gameId);
    gamePlayers[playerAddress.toLowerCase()] = socket.id;

    console.log(`🎮 Player ${playerAddress.slice(0, 8)}... joined game ${gameId}`);

    // Notify opponent that player joined/reconnected
    socket.to(`game:${gameId}`).emit('opponent:connected', { playerAddress });

    // Clear any existing disconnect timer for this player
    const timerKey = `${gameId}:${playerAddress.toLowerCase()}`;
    if (disconnectTimers.has(timerKey)) {
      clearTimeout(disconnectTimers.get(timerKey).timer);
      disconnectTimers.delete(timerKey);
      console.log(`⏱️ Cleared disconnect timer for ${playerAddress.slice(0, 8)}... - reconnected!`);
      socket.to(`game:${gameId}`).emit('opponent:reconnected', { playerAddress });
    }
  });

  // Handle player ready event (after staking is confirmed)
  socket.on('game:playerReady', async ({ gameId, playerAddress }) => {
    // Normalize gameId to string for consistent map key
    const gameIdStr = gameId.toString();
    console.log(`✅ Player ${playerAddress.slice(0, 8)}... is ready in game ${gameIdStr}`);

    // Track this player as ready
    if (!playerReadyMap.has(gameIdStr)) {
      playerReadyMap.set(gameIdStr, new Set());
    }
    const readyPlayers = playerReadyMap.get(gameIdStr);
    readyPlayers.add(playerAddress.toLowerCase());

    console.log(`📋 Ready players for game ${gameIdStr}:`, Array.from(readyPlayers));

    // Check if both players are now ready
    try {
      const { data: game, error } = await supabase
        .from('games')
        .select('player1_address, player2_address, state')
        .eq('game_id', parseInt(gameIdStr))
        .single();

      if (error) {
        console.error(`❌ Failed to fetch game ${gameIdStr}:`, error);
        return;
      }

      console.log(`📊 Game ${gameIdStr} state: ${game?.state}, P1: ${game?.player1_address?.slice(0, 8)}, P2: ${game?.player2_address?.slice(0, 8) || 'none'}`);

      if (game && game.state === 1 && game.player1_address && game.player2_address) {
        const player1Ready = readyPlayers.has(game.player1_address.toLowerCase());
        const player2Ready = readyPlayers.has(game.player2_address.toLowerCase());

        console.log(`🎮 Game ${gameIdStr} readiness: P1=${player1Ready}, P2=${player2Ready}`);

        if (player1Ready && player2Ready) {
          console.log(`⏰ Both players ready! Starting countdown for game ${gameIdStr}`);
          io.to(`game:${gameIdStr}`).emit('countdown:start', { gameId: gameIdStr, startTime: Date.now() + 500 });

          // Clean up the ready map for this game
          playerReadyMap.delete(gameIdStr);
        }
      } else if (game && game.state === 0) {
        console.log(`⏳ Game ${gameIdStr} still waiting for second player to join (state=0)`);
      }
    } catch (error) {
      console.error('Error checking player readiness:', error);
    }
  });


  // Handle start countdown sync (fallback for legacy behavior)
  socket.on('game:startCountdown', ({ gameId }) => {
    console.log(`⏰ Starting countdown for game ${gameId} (legacy trigger)`);
    io.to(`game:${gameId}`).emit('countdown:start', { gameId, startTime: Date.now() + 500 });
  });

  // Handle score updates
  socket.on('game:scoreUpdate', ({ gameId, playerAddress, score }) => {
    socket.to(`game:${gameId}`).emit('opponent:scoreUpdate', { playerAddress, score });
  });

  // Handle lives updates - broadcast when player loses a life
  socket.on('game:livesUpdate', ({ gameId, playerAddress, lives }) => {
    console.log(`❤️ Lives update: ${playerAddress.slice(0, 8)}... has ${lives} lives in game ${gameId}`);
    socket.to(`game:${gameId}`).emit('opponent:livesUpdate', { playerAddress, lives });
  });

  // Handle player elimination (lost all 3 lives) - ends game immediately for both players
  socket.on('game:playerEliminated', async ({ gameId, playerAddress, finalScore }) => {
    console.log(`💀 Player ${playerAddress.slice(0, 8)}... eliminated in game ${gameId} with score ${finalScore}`);

    // Broadcast to all players in the game that someone was eliminated
    io.to(`game:${gameId}`).emit('game:playerEliminated', {
      eliminatedPlayer: playerAddress,
      finalScore
    });

    // Update game state in database with scores
    try {
      const { data: game } = await supabase
        .from('games')
        .select('*')
        .eq('game_id', gameId)
        .single();

      if (game && game.state === 1) { // IN_PROGRESS
        const isPlayer1Eliminated = game.player1_address.toLowerCase() === playerAddress.toLowerCase();
        const winnerAddress = isPlayer1Eliminated ? game.player2_address : game.player1_address;

        // Build update object with the eliminated player's score
        const updateData = {
          state: 2, // FINISHED
          winner_address: winnerAddress,
          win_type: 'elimination',
          finished_at: new Date().toISOString(),
        };

        // Record the eliminated player's score
        if (isPlayer1Eliminated) {
          updateData.player1_score = finalScore;
          updateData.player1_finished = true;
        } else {
          updateData.player2_score = finalScore;
          updateData.player2_finished = true;
        }

        await supabase
          .from('games')
          .update(updateData)
          .eq('game_id', gameId);

        console.log(`🏆 Game ${gameId} finished - Winner: ${winnerAddress.slice(0, 8)}... (opponent eliminated with score ${finalScore})`);

        // Request the winner to submit their final score for stats tracking
        io.to(`game:${gameId}`).emit('game:requestFinalScore', {
          gameId,
          winnerAddress
        });
      }
    } catch (error) {
      console.error('Failed to update game after elimination:', error);
    }
  });

  // Handle winner's final score submission after elimination
  socket.on('game:submitWinnerScore', async ({ gameId, playerAddress, finalScore }) => {
    console.log(`🏆 Winner ${playerAddress.slice(0, 8)}... submitting final score ${finalScore} for game ${gameId}`);

    try {
      const { data: game } = await supabase
        .from('games')
        .select('*')
        .eq('game_id', gameId)
        .single();

      if (game) {
        const isPlayer1 = game.player1_address.toLowerCase() === playerAddress.toLowerCase();

        // Update the winner's score
        const updateData = {};
        if (isPlayer1) {
          updateData.player1_score = finalScore;
          updateData.player1_finished = true;
        } else {
          updateData.player2_score = finalScore;
          updateData.player2_finished = true;
        }

        await supabase
          .from('games')
          .update(updateData)
          .eq('game_id', gameId);

        console.log(`💰 Recorded winner's score: ${finalScore} for game ${gameId}`);
      }
    } catch (error) {
      console.error('Failed to record winner score:', error);
    }
  });

  // Register a room code for private games (so other browsers can look it up)
  socket.on('roomCode:register', ({ roomCode, gameId, creatorAddress }) => {
    const normalizedCode = roomCode.toUpperCase();
    roomCodeMap.set(normalizedCode, {
      gameId,
      createdAt: Date.now(),
      creatorAddress: creatorAddress.toLowerCase()
    });
    console.log(`🔑 Registered room code: ${normalizedCode} -> game ${gameId}`);

    // Broadcast to all clients that a new room code is available
    io.emit('roomCode:registered', { roomCode: normalizedCode, gameId });
  });

  // Look up a room code to get the game ID
  socket.on('roomCode:lookup', ({ roomCode }, callback) => {
    const normalizedCode = roomCode.toUpperCase();
    const data = roomCodeMap.get(normalizedCode);

    if (data) {
      console.log(`🔍 Room code lookup: ${normalizedCode} -> game ${data.gameId}`);
      callback({ success: true, gameId: data.gameId });
    } else {
      console.log(`❌ Room code not found: ${normalizedCode}`);
      callback({ success: false, error: 'Room code not found' });
    }
  });

  // Delete room code when game starts or is cancelled
  socket.on('roomCode:delete', ({ roomCode }) => {
    const normalizedCode = roomCode.toUpperCase();
    if (roomCodeMap.has(normalizedCode)) {
      roomCodeMap.delete(normalizedCode);
      console.log(`🗑️ Deleted room code: ${normalizedCode}`);
    }
  });

  // Handle game joined event - broadcast to all clients so creator gets notified
  socket.on('game:joined', (gameData) => {
    console.log(`🎮 Broadcasting game_joined event for game ${gameData.game_id}`);
    io.emit('game_joined', gameData);
  });

  socket.on('disconnect', () => {
    console.log('👋 Client disconnected:', socket.id);

    // Check if this socket was in an active game
    const gameId = socket.gameId;
    const playerAddress = socket.playerAddress;

    if (gameId && playerAddress) {
      console.log(`⚠️ Player ${playerAddress.slice(0, 8)}... disconnected from game ${gameId}`);

      // Start grace period timer
      const timerKey = `${gameId}:${playerAddress.toLowerCase()}`;
      const timer = setTimeout(async () => {
        console.log(`⏱️ Grace period expired for ${playerAddress.slice(0, 8)}... in game ${gameId}`);

        // Auto-forfeit the game
        try {
          const { supabase } = await import('./config/supabase.js');

          // Get game status
          const { data: game } = await supabase
            .from('games')
            .select('*')
            .eq('game_id', gameId)
            .single();

          if (game && game.state === 1) { // IN_PROGRESS
            const winnerAddress = game.player1_address.toLowerCase() === playerAddress.toLowerCase()
              ? game.player2_address
              : game.player1_address;

            // Update game to forfeited
            await supabase
              .from('games')
              .update({
                state: 4, // FORFEITED
                winner_address: winnerAddress,
                win_type: 'forfeit',
                finished_at: new Date().toISOString(),
              })
              .eq('game_id', gameId);

            // Notify remaining player
            io.to(`game:${gameId}`).emit('game:forfeited', {
              forfeitedBy: playerAddress,
              winner: winnerAddress,
              reason: 'disconnect_timeout'
            });

            console.log(`🏳️ Game ${gameId} forfeited due to disconnect. Winner: ${winnerAddress}`);
          }
        } catch (error) {
          console.error('Failed to process forfeit:', error);
        }

        disconnectTimers.delete(timerKey);
      }, DISCONNECT_GRACE_PERIOD_MS);

      disconnectTimers.set(timerKey, { gameId, timer, playerAddress });

      // Notify opponent about disconnect  
      socket.to(`game:${gameId}`).emit('opponent:disconnected', {
        playerAddress,
        gracePeriodMs: DISCONNECT_GRACE_PERIOD_MS
      });
    }
  });
});

// Subscribe to Supabase real-time changes
const gamesChannel = supabase
  .channel('games-changes')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'games' },
    (payload) => {
      console.log('📡 Game update:', payload.eventType, payload.new?.game_id);

      // Broadcast to all clients in the appropriate rooms
      io.to('games:all').emit('game:update', payload);

      if (payload.new?.bet_tier) {
        io.to(`games:${payload.new.bet_tier}`).emit('game:update', payload);
      }
    }
  )
  .subscribe();

const playersChannel = supabase
  .channel('players-changes')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'players' },
    (payload) => {
      console.log('📡 Player update:', payload.new?.address);

      if (payload.new?.address) {
        io.to(`player:${payload.new.address}`).emit('player:update', payload);
      }
    }
  )
  .subscribe();

// Start server
httpServer.listen(PORT, () => {
  console.log('');
  console.log('🚀 Push Ninja Backend Server');
  console.log('================================');
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌐 API: http://localhost:${PORT}`);
  console.log(`🔌 WebSocket: http://localhost:${PORT}`);
  console.log(`🎯 Frontend: ${process.env.FRONTEND_URL}`);
  console.log(`🔗 Contract: ${process.env.CONTRACT_ADDRESS}`);
  console.log('================================');
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully...');
  httpServer.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
