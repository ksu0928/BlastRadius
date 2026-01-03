// Push Chain Multiplayer Service with Supabase
import supabaseGameService from './supabaseGameService';
import { io } from 'socket.io-client';

// Use environment variable or fallback to localhost
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

// Room code storage key for localStorage workaround
const ROOM_CODES_STORAGE_KEY = 'push_ninja_room_codes';

// Socket connection for room code operations
let socket = null;
const getSocket = () => {
  if (!socket && typeof window !== 'undefined') {
    socket = io(SOCKET_URL, { autoConnect: true });
    socket.on('connect', () => {
      console.log('🔌 MultiplayerService socket connected');
    });
  }
  return socket;
};

class MultiplayerGameService {
  constructor() {
    // Push Chain bet tiers using PUSH tokens (smaller amounts for testnet)
    this.BET_TIERS = [
      {
        id: 1,
        amount: 0.001,
        label: "Casual",
        wei: "1000000000000000",
        description: "Perfect for beginners",
        token: "PUSH",
        tokenName: "Push Token",
        color: "#9B5DE5",
        borderColor: "#00D9A5",
        glowColor: "rgba(0, 217, 165, 0.3)"
      },
      {
        id: 2,
        amount: 0.005,
        label: "Standard",
        wei: "5000000000000000",
        description: "Most popular choice",
        token: "PUSH",
        tokenName: "Push Token",
        color: "#9B5DE5",
        borderColor: "#FFD700",
        glowColor: "rgba(255, 215, 0, 0.3)"
      },
      {
        id: 3,
        amount: 0.01,
        label: "Competitive",
        wei: "10000000000000000",
        description: "For serious players",
        token: "PUSH",
        tokenName: "Push Token",
        color: "#9B5DE5",
        borderColor: "#F15BB5",
        glowColor: "rgba(241, 91, 181, 0.3)"
      },
      {
        id: 4,
        amount: 0.05,
        label: "High Stakes",
        wei: "50000000000000000",
        description: "Big risk, big reward",
        token: "PUSH",
        tokenName: "Push Token",
        color: "#9B5DE5",
        borderColor: "#9D4EDD",
        glowColor: "rgba(157, 78, 221, 0.3)"
      },
    ];

    // In-memory room code map (for current session)
    this.roomCodeMap = new Map();
    this.loadRoomCodes();
  }

  // Generate a unique room code
  generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // Save room codes to localStorage
  saveRoomCodes() {
    if (typeof window !== 'undefined') {
      const data = Object.fromEntries(this.roomCodeMap);
      localStorage.setItem(ROOM_CODES_STORAGE_KEY, JSON.stringify(data));
    }
  }

  // Load room codes from localStorage
  loadRoomCodes() {
    if (typeof window !== 'undefined') {
      try {
        const data = localStorage.getItem(ROOM_CODES_STORAGE_KEY);
        if (data) {
          const parsed = JSON.parse(data);
          this.roomCodeMap = new Map(Object.entries(parsed));
        }
      } catch (e) {
        console.error('Failed to load room codes:', e);
      }
    }
  }

  // Store room code mapping (localStorage + WebSocket broadcast)
  async storeRoomCode(roomCode, gameId, creatorAddress) {
    const normalizedCode = roomCode.toUpperCase();
    this.roomCodeMap.set(normalizedCode, gameId.toString());
    this.saveRoomCodes();
    console.log(`🔑 Stored room code ${normalizedCode} -> game ${gameId} locally`);

    // Also register via WebSocket for cross-browser access
    const sock = getSocket();
    if (sock) {
      // Wait for socket to connect if not already connected
      if (!sock.connected) {
        console.log('🔌 Waiting for socket connection to register room code...');
        await new Promise((resolve) => {
          const timeout = setTimeout(() => {
            console.log('⏰ Socket connection timeout for room code registration');
            resolve();
          }, 3000);
          sock.once('connect', () => {
            clearTimeout(timeout);
            console.log('🔌 Socket connected, registering room code');
            resolve();
          });
        });
      }

      if (sock.connected) {
        sock.emit('roomCode:register', {
          roomCode: normalizedCode,
          gameId: gameId.toString(),
          creatorAddress: creatorAddress || ''
        });
        console.log(`📤 Registered room code ${normalizedCode} with server`);
      } else {
        console.log('❌ Socket not connected, room code only stored locally');
      }
    }
  }

  // Find game by room code (localStorage + WebSocket lookup)
  async findGameByRoomCode(roomCode) {
    const normalizedCode = roomCode.toUpperCase();

    // First, check local storage
    const localGameId = this.roomCodeMap.get(normalizedCode);
    if (localGameId) {
      console.log(`🔑 Found game ${localGameId} in local storage`);
      return localGameId;
    }

    // Then, try WebSocket lookup
    const sock = getSocket();
    if (sock) {
      // Wait for socket to connect if not already connected
      if (!sock.connected) {
        console.log('🔌 Waiting for socket connection...');
        await new Promise((resolve) => {
          const timeout = setTimeout(() => {
            console.log('⏰ Socket connection timeout');
            resolve();
          }, 3000);
          sock.once('connect', () => {
            clearTimeout(timeout);
            console.log('🔌 Socket connected for lookup');
            resolve();
          });
        });
      }

      if (sock.connected) {
        console.log(`🔍 Looking up room code via WebSocket: ${normalizedCode}`);
        return new Promise((resolve) => {
          let resolved = false;

          sock.emit('roomCode:lookup', { roomCode: normalizedCode }, (response) => {
            if (resolved) return;
            resolved = true;

            if (response && response.success) {
              console.log(`✅ Found game ${response.gameId} via WebSocket`);
              // Cache locally for future use
              this.roomCodeMap.set(normalizedCode, response.gameId.toString());
              this.saveRoomCodes();
              resolve(response.gameId.toString());
            } else {
              console.log(`❌ Room code not found in server: ${normalizedCode}`);
              resolve(null);
            }
          });

          // Timeout after 3 seconds
          setTimeout(() => {
            if (!resolved) {
              resolved = true;
              console.log('⏰ Room code lookup timeout');
              resolve(null);
            }
          }, 3000);
        });
      } else {
        console.log('❌ Socket not connected, cannot lookup room code');
      }
    }

    return null;
  }

  async getWalletAddress() {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('MetaMask not installed');
    }
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    if (!accounts || accounts.length === 0) {
      throw new Error('Wallet not connected');
    }
    return accounts[0];
  }

  // Stake tokens for creating a multiplayer game
  async stakeForGame(betTierId, gameId) {
    try {
      const walletAddress = await this.getWalletAddress();
      const tierInfo = this.BET_TIERS.find(t => t.id === betTierId);

      if (!tierInfo) {
        throw new Error('Invalid bet tier');
      }

      console.log(`💰 Initiating stake of ${tierInfo.amount} PUSH for creating game ${gameId}`);

      // Import pushChainService dynamically to avoid circular dependencies
      const pushChainService = (await import('./pushChainService')).default;
      pushChainService.setWallet(walletAddress);

      // Call the staking function (uses createGame on escrow if deployed)
      const result = await pushChainService.stakeTokens(tierInfo.wei, gameId.toString());

      if (!result.success) {
        return { success: false, error: result.error };
      }

      console.log(`✅ Stake successful! TX: ${result.transactionHash}`);
      return {
        success: true,
        transactionHash: result.transactionHash,
        amount: tierInfo.amount,
        token: tierInfo.token
      };
    } catch (error) {
      console.error('Failed to stake for game:', error);
      return { success: false, error: error.message };
    }
  }

  // Stake tokens for joining an existing multiplayer game
  async stakeForJoiningGame(betTierId, gameId) {
    try {
      const walletAddress = await this.getWalletAddress();
      const tierInfo = this.BET_TIERS.find(t => t.id === betTierId);

      if (!tierInfo) {
        throw new Error('Invalid bet tier');
      }

      console.log(`💰 Initiating stake of ${tierInfo.amount} PUSH for joining game ${gameId}`);

      // Import pushChainService dynamically to avoid circular dependencies
      const pushChainService = (await import('./pushChainService')).default;
      pushChainService.setWallet(walletAddress);

      // Call joinGameOnChain (uses joinGame on escrow if deployed, otherwise fallback)
      const result = await pushChainService.joinGameOnChain(tierInfo.wei, gameId.toString());

      if (!result.success) {
        return { success: false, error: result.error };
      }

      console.log(`✅ Join stake successful! TX: ${result.transactionHash}`);
      return {
        success: true,
        transactionHash: result.transactionHash,
        amount: tierInfo.amount,
        token: tierInfo.token
      };
    } catch (error) {
      console.error('Failed to stake for joining game:', error);
      return { success: false, error: error.message };
    }
  }

  async createGame(betTierId, roomType = 'public', data = {}) {
    try {
      const walletAddress = await this.getWalletAddress();
      const tierInfo = this.BET_TIERS.find(t => t.id === betTierId);

      if (!tierInfo) {
        throw new Error('Invalid bet tier');
      }

      const gameId = Date.now();
      const isPrivate = roomType === 'private';

      // Generate room code for private games
      let roomCode = null;
      if (isPrivate) {
        roomCode = this.generateRoomCode();
      }

      // Save to Supabase
      const result = await supabaseGameService.createGame({
        gameId,
        betAmount: parseInt(tierInfo.wei),
        betTier: betTierId,
        player1Address: walletAddress,
        roomType: roomType,
        txHash: data.txHash, // Pass the transaction hash
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to create game');
      }

      // Use room code from database if available, otherwise use locally generated one
      const finalRoomCode = result.roomCode || roomCode;

      // Store room code mapping locally + WebSocket (works as fallback if DB doesn't have room columns)
      if (isPrivate && finalRoomCode) {
        await this.storeRoomCode(finalRoomCode, gameId, walletAddress);
      }

      console.log(`🎮 Game created: ${gameId}, private=${isPrivate}, code=${finalRoomCode || 'N/A'}`);

      return {
        success: true,
        gameId: gameId.toString(),
        roomCode: finalRoomCode,
        isPrivate: isPrivate
      };
    } catch (error) {
      console.error('Failed to create game:', error);
      return { success: false, error: error.message };
    }
  }

  async joinGame(gameId, data = {}) {
    try {
      const walletAddress = await this.getWalletAddress();

      // Join via Supabase
      const result = await supabaseGameService.joinGame(
        parseInt(gameId),
        walletAddress,
        data.txHash // Pass the transaction hash
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to join game');
      }

      // Broadcast game_joined event via WebSocket so the creator gets notified
      const sock = getSocket();
      if (sock && result.game) {
        // Wait for socket to connect if not already connected
        if (!sock.connected) {
          console.log('🔌 Waiting for socket connection to broadcast game_joined...');
          await new Promise((resolve) => {
            const timeout = setTimeout(() => {
              console.log('⏰ Socket connection timeout for game_joined broadcast');
              resolve();
            }, 3000);
            sock.once('connect', () => {
              clearTimeout(timeout);
              console.log('🔌 Socket connected, broadcasting game_joined');
              resolve();
            });
          });
        }

        if (sock.connected) {
          sock.emit('game:joined', {
            game_id: result.game.game_id,
            player1: result.game.player1_address,
            player2: walletAddress,
            state: 1
          });
          console.log(`📤 Broadcast game_joined for game ${gameId}`);
        } else {
          console.log('❌ Socket not connected, game_joined not broadcast');
        }
      }

      return { success: true, game: result.game };
    } catch (error) {
      console.error('Failed to join game:', error);
      return { success: false, error: error.message };
    }
  }

  async joinGameByCode(roomCode, data = {}) {
    try {
      const walletAddress = await this.getWalletAddress();
      const normalizedCode = roomCode.toUpperCase();

      // First, try to find game ID from local storage or WebSocket (workaround for missing DB columns)
      const localGameId = await this.findGameByRoomCode(normalizedCode);

      if (localGameId) {
        console.log(`🔑 Found game ${localGameId} from local room code storage`);

        // Join the game directly by ID
        const result = await supabaseGameService.joinGame(
          parseInt(localGameId),
          walletAddress,
          data.txHash // Pass the transaction hash
        );

        if (!result.success) {
          throw new Error(result.error || 'Failed to join game');
        }

        // Broadcast game_joined event via WebSocket so the creator gets notified
        const sock = getSocket();
        if (sock && result.game) {
          // Wait for socket to connect if not already connected
          if (!sock.connected) {
            console.log('🔌 Waiting for socket connection to broadcast game_joined...');
            await new Promise((resolve) => {
              const timeout = setTimeout(() => {
                console.log('⏰ Socket connection timeout for game_joined broadcast');
                resolve();
              }, 3000);
              sock.once('connect', () => {
                clearTimeout(timeout);
                console.log('🔌 Socket connected, broadcasting game_joined');
                resolve();
              });
            });
          }

          if (sock.connected) {
            sock.emit('game:joined', {
              game_id: result.game.game_id,
              player1: result.game.player1_address,
              player2: walletAddress,
              state: 1
            });
            console.log(`📤 Broadcast game_joined for game ${localGameId}`);
          } else {
            console.log('❌ Socket not connected, game_joined not broadcast');
          }
        }

        return { success: true, game: result.game };
      }

      // Fall back to database lookup (if room columns exist)
      const result = await supabaseGameService.joinGameByCode(
        normalizedCode,
        walletAddress,
        data.txHash // Pass the transaction hash
      );

      if (!result.success) {
        throw new Error(result.error || 'Invalid room code or game not available');
      }

      return { success: true, game: result.game };
    } catch (error) {
      console.error('Failed to join game by code:', error);
      return { success: false, error: error.message };
    }
  }

  async forfeitGame(gameId) {
    try {
      const walletAddress = await this.getWalletAddress();

      // Forfeit via Supabase
      const result = await supabaseGameService.forfeitGame(
        parseInt(gameId),
        walletAddress
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to forfeit game');
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to forfeit game:', error);
      return { success: false, error: error.message };
    }
  }

  async submitScore(gameId, finalScore, stats = {}) {
    try {
      const walletAddress = await this.getWalletAddress();

      // Submit to Supabase
      const result = await supabaseGameService.submitScore(
        parseInt(gameId),
        walletAddress,
        finalScore,
        stats
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to submit score');
      }

      // Return the game data so the frontend can determine winner
      return { success: true, game: result.game };
    } catch (error) {
      console.error('Failed to submit score:', error);
      return { success: false, error: error.message };
    }
  }


  async getAvailableGames() {
    try {
      // Get from Supabase
      const games = await supabaseGameService.getAvailableGames();

      return games.map(g => ({
        game_id: g.game_id,
        bet_amount: g.bet_amount.toString(),
        player1: g.player1_address,
        player2: g.player2_address || '0x0',
        state: g.state,
        created_at: g.created_at
      }));
    } catch (error) {
      console.error('Failed to fetch available games:', error);
      return [];
    }
  }

  async getPlayerStats(address) {
    try {
      return await supabaseGameService.getPlayerStats(address);
    } catch (error) {
      console.error('Failed to get player stats:', error);
      return this.getDefaultStats();
    }
  }

  getDefaultStats() {
    return {
      gamesPlayed: 0,
      gamesWon: 0,
      winRate: 0,
      totalWagered: 0,
      totalWinnings: 0
    };
  }

  async getLeaderboard() {
    try {
      return await supabaseGameService.getLeaderboard();
    } catch (error) {
      console.error('Failed to get leaderboard:', error);
      return [];
    }
  }

  async getRecentMatches() {
    try {
      return await supabaseGameService.getRecentMatches();
    } catch (error) {
      console.error('Failed to get recent matches:', error);
      return [];
    }
  }

  async getGame(gameId) {
    try {
      return await supabaseGameService.getGame(parseInt(gameId));
    } catch (error) {
      console.error('Failed to get game:', error);
      return null;
    }
  }

  // Subscribe to real-time game updates
  subscribeToAvailableGames(callback) {
    return supabaseGameService.subscribeToAvailableGames((games) => {
      callback(games.map(g => ({
        game_id: g.game_id,
        bet_amount: g.bet_amount.toString(),
        player1: g.player1_address,
        player2: g.player2_address || '0x0',
        state: g.state,
        created_at: g.created_at
      })));
    });
  }

  subscribeToGame(gameId, callback) {
    return supabaseGameService.subscribeToGame(parseInt(gameId), callback);
  }

  getBetTiers() {
    return this.BET_TIERS;
  }

  formatAddress(address) {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  normalizeAddress(address) {
    if (!address) return '';
    return address.toLowerCase().startsWith('0x') ? address.toLowerCase() : `0x${address.toLowerCase()}`;
  }

  compareAddresses(addr1, addr2) {
    return this.normalizeAddress(addr1) === this.normalizeAddress(addr2);
  }
}

export default new MultiplayerGameService();
