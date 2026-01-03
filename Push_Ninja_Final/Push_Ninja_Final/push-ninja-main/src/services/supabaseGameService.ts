import { supabase, Game, Player, PlayerGameStats, GAME_STATE, WIN_TYPE, PRIZE_CONFIG } from './supabaseClient';

// Check if Supabase is configured
const isSupabaseConfigured = (): boolean => supabase !== null;

class SupabaseGameService {
  // ==================== GAMES ====================

  /**
   * Create a new multiplayer game
   */
  /**
   * Generate a unique room code for private games
   */
  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars like O, 0, I, 1
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Create a new multiplayer game
   */
  async createGame(data: {
    gameId: number;
    betAmount: number;
    betTier: number;
    player1Address: string;
    roomType?: 'public' | 'private';
    txHash?: string;
  }): Promise<{ success: boolean; game?: Game; roomCode?: string; error?: string }> {
    if (!isSupabaseConfigured() || !supabase) {
      return { success: false, error: 'Supabase not configured' };
    }
    try {
      const isPrivate = data.roomType === 'private';
      const roomCode = isPrivate ? this.generateRoomCode() : null;

      // Base insert data - only include columns that exist in the database
      const insertData: Record<string, unknown> = {
        game_id: data.gameId,
        bet_amount: data.betAmount,
        bet_tier: data.betTier,
        player1_address: data.player1Address.toLowerCase(),
        state: GAME_STATE.WAITING,
        creation_tx_hash: data.txHash,
      };

      // First, try inserting with room columns
      const { data: game, error } = await supabase
        .from('games')
        .insert({
          ...insertData,
          room_type: data.roomType || 'public',
          room_code: roomCode,
        })
        .select()
        .single();

      if (!error) {
        console.log(`🎮 Game created: ${data.gameId}, room_type=${data.roomType || 'public'}, code=${roomCode || 'N/A'}`);
        return { success: true, game, roomCode: roomCode || undefined };
      }

      // If error mentions room_code or room_type, retry without those columns
      if (error.message.includes('room_code') || error.message.includes('room_type')) {
        console.log('⚠️ Room columns not found, creating game without them...');
        const { data: game2, error: error2 } = await supabase
          .from('games')
          .insert(insertData)
          .select()
          .single();

        if (error2) throw error2;
        console.log(`🎮 Game created: ${data.gameId} (basic mode), code=${roomCode || 'N/A'}`);
        // Still return the room code so it can be stored locally
        return { success: true, game: game2, roomCode: roomCode || undefined };
      }

      throw error;
    } catch (error) {
      console.error('Failed to create game:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Join an existing game
   */
  async joinGame(
    gameId: number,
    player2Address: string,
    txHash?: string
  ): Promise<{ success: boolean; game?: Game; error?: string }> {
    if (!isSupabaseConfigured() || !supabase) {
      return { success: false, error: 'Supabase not configured' };
    }
    try {
      const { data: game, error } = await supabase
        .from('games')
        .update({
          player2_address: player2Address.toLowerCase(),
          state: GAME_STATE.IN_PROGRESS,
          joined_at: new Date().toISOString(),
          join_tx_hash: txHash,
        })
        .eq('game_id', gameId)
        .eq('state', GAME_STATE.WAITING)
        .select()
        .single();

      if (error) throw error;
      return { success: true, game };
    } catch (error) {
      console.error('Failed to join game:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Join a private game by room code
   */
  async joinGameByCode(
    roomCode: string,
    player2Address: string,
    txHash?: string
  ): Promise<{ success: boolean; game?: Game; error?: string }> {
    if (!isSupabaseConfigured() || !supabase) {
      return { success: false, error: 'Supabase not configured' };
    }
    try {
      // Find game by room code
      const { data: existingGame, error: findError } = await supabase
        .from('games')
        .select('*')
        .eq('room_code', roomCode.toUpperCase())
        .eq('state', GAME_STATE.WAITING)
        .single();

      if (findError || !existingGame) {
        return { success: false, error: 'Invalid room code or game not available' };
      }

      // Check if player is trying to join their own game
      if (existingGame.player1_address.toLowerCase() === player2Address.toLowerCase()) {
        return { success: false, error: 'Cannot join your own game' };
      }

      // Join the game
      const { data: game, error } = await supabase
        .from('games')
        .update({
          player2_address: player2Address.toLowerCase(),
          state: GAME_STATE.IN_PROGRESS,
          joined_at: new Date().toISOString(),
          join_tx_hash: txHash,
        })
        .eq('game_id', existingGame.game_id)
        .eq('state', GAME_STATE.WAITING)
        .select()
        .single();

      if (error) throw error;

      console.log(`🔑 Player joined via code ${roomCode}: game_id=${existingGame.game_id}`);

      return { success: true, game };
    } catch (error) {
      console.error('Failed to join game by code:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Submit player score
   */
  async submitScore(
    gameId: number,
    playerAddress: string,
    score: number,
    stats?: { maxCombo?: number; tokensSlashed?: number; tokensMissed?: number; duration?: number }
  ): Promise<{ success: boolean; game?: Game; error?: string }> {
    if (!isSupabaseConfigured() || !supabase) {
      return { success: false, error: 'Supabase not configured' };
    }
    try {
      const address = playerAddress.toLowerCase();

      // Get the game first
      const { data: game, error: fetchError } = await supabase
        .from('games')
        .select('*')
        .eq('game_id', gameId)
        .single();

      if (fetchError || !game) throw new Error('Game not found');

      // Determine which player is submitting
      const isPlayer1 = game.player1_address.toLowerCase() === address;
      const isPlayer2 = game.player2_address?.toLowerCase() === address;

      if (!isPlayer1 && !isPlayer2) {
        throw new Error('Player not in this game');
      }


      // Update the appropriate player's score
      const updateData: Record<string, unknown> = {};
      if (isPlayer1) {
        updateData.player1_score = score;
        updateData.player1_finished = true;
      } else {
        updateData.player2_score = score;
        updateData.player2_finished = true;
      }

      // Check if both players have finished
      const bothFinished = isPlayer1
        ? game.player2_finished
        : game.player1_finished;

      if (bothFinished) {
        const p1Score = isPlayer1 ? score : game.player1_score;
        const p2Score = isPlayer2 ? score : game.player2_score;

        updateData.state = GAME_STATE.FINISHED;
        updateData.finished_at = new Date().toISOString();
        updateData.winner_address = p1Score > p2Score
          ? game.player1_address
          : p2Score > p1Score
            ? game.player2_address
            : null; // Tie
      }

      const { error: updateError } = await supabase
        .from('games')
        .update(updateData)
        .eq('game_id', gameId);

      if (updateError) throw updateError;

      // Save detailed game stats
      if (stats) {
        await supabase.from('player_game_stats').insert({
          player_address: address,
          game_id: gameId,
          final_score: score,
          max_combo: stats.maxCombo || 0,
          tokens_slashed: stats.tokensSlashed || 0,
          tokens_missed: stats.tokensMissed || 0,
          game_duration: stats.duration || 0,
        });
      }

      // Update player stats if game is finished
      if (bothFinished) {
        await this.updatePlayerStatsAfterGame(gameId);
      }

      // Fetch and return the updated game
      const updatedGame = await this.getGame(gameId);
      return { success: true, game: updatedGame || undefined };
    } catch (error) {
      console.error('Failed to submit score:', error);
      return { success: false, error: (error as Error).message };
    }
  }
  /**
   * Get available games (waiting for opponent) - only public rooms, max 100 seconds old
   */
  async getAvailableGames(): Promise<Game[]> {
    if (!isSupabaseConfigured() || !supabase) {
      return [];
    }
    try {
      // Only show games created in the last 100 seconds
      const cutoffTime = new Date(Date.now() - 100 * 1000).toISOString();

      // First, try to get games with room_type = 'public'
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('state', GAME_STATE.WAITING)
        .eq('room_type', 'public')  // Only show public games
        .gt('created_at', cutoffTime)  // Only games created in last 100 seconds
        .order('created_at', { ascending: false })
        .limit(50);

      // If the query works and returns results, use them
      if (!error && data && data.length > 0) {
        return data;
      }

      // If error mentions room_type column, or we got empty results,
      // try a fallback query that excludes only private games
      if (error?.message?.includes('room_type') || (data && data.length === 0)) {
        console.log('📋 Trying fallback query for available games...');

        // Fallback: Get all waiting games and filter out private ones
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('games')
          .select('*')
          .eq('state', GAME_STATE.WAITING)
          .gt('created_at', cutoffTime)  // Only games created in last 100 seconds
          .order('created_at', { ascending: false })
          .limit(50);

        if (fallbackError) throw fallbackError;

        // Filter out private games (where room_type is explicitly 'private')
        const publicGames = (fallbackData || []).filter(
          (game: Game) => game.room_type !== 'private'
        );

        return publicGames;
      }

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch available games:', error);
      return [];
    }
  }

  /**
   * Get game by ID
   */
  async getGame(gameId: number): Promise<Game | null> {
    if (!isSupabaseConfigured() || !supabase) {
      return null;
    }
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('game_id', gameId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to fetch game:', error);
      return null;
    }
  }

  // ==================== PLAYERS ====================

  /**
   * Get or create player
   */
  async getOrCreatePlayer(address: string): Promise<Player | null> {
    if (!isSupabaseConfigured() || !supabase) {
      return null;
    }
    try {
      const normalizedAddress = address.toLowerCase();

      // Try to get existing player
      let { data: player, error } = await supabase
        .from('players')
        .select('*')
        .eq('address', normalizedAddress)
        .single();

      if (error && error.code === 'PGRST116') {
        // Player doesn't exist, create one
        const { data: newPlayer, error: createError } = await supabase
          .from('players')
          .insert({ address: normalizedAddress })
          .select()
          .single();

        if (createError) throw createError;
        player = newPlayer;
      } else if (error) {
        throw error;
      }

      return player;
    } catch (error) {
      console.error('Failed to get/create player:', error);
      return null;
    }
  }

  /**
   * Get player stats
   */
  async getPlayerStats(address: string): Promise<{
    gamesPlayed: number;
    gamesWon: number;
    winRate: number;
    totalWagered: number;
    totalWinnings: number;
  }> {
    try {
      const player = await this.getOrCreatePlayer(address);

      if (!player) {
        return {
          gamesPlayed: 0,
          gamesWon: 0,
          winRate: 0,
          totalWagered: 0,
          totalWinnings: 0,
        };
      }

      const winRate = player.games_played > 0
        ? Math.round((player.games_won / player.games_played) * 100)
        : 0;

      // Convert from wei to PUSH tokens (divide by 10^18)
      const weiToToken = (wei: number) => wei / 1e18;

      return {
        gamesPlayed: player.games_played,
        gamesWon: player.games_won,
        winRate,
        totalWagered: weiToToken(player.total_wagered),
        totalWinnings: weiToToken(player.total_winnings),
      };
    } catch (error) {
      console.error('Failed to get player stats:', error);
      return {
        gamesPlayed: 0,
        gamesWon: 0,
        winRate: 0,
        totalWagered: 0,
        totalWinnings: 0,
      };
    }
  }


  /**
   * Update player stats after a game finishes
   */
  private async updatePlayerStatsAfterGame(gameId: number, winType: string = WIN_TYPE.NORMAL): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) {
      return;
    }
    try {
      const game = await this.getGame(gameId);
      if (!game || (game.state !== GAME_STATE.FINISHED && game.state !== GAME_STATE.FORFEITED)) return;

      const betAmount = game.bet_amount;

      // Calculate prize based on win type
      // Normal win: winner gets 98% of total pool (platform retains 2%)
      // Forfeit win: winner gets 1.5x stake (platform retains 0.5x)
      const multiplier = winType === WIN_TYPE.FORFEIT
        ? PRIZE_CONFIG.FORFEIT_WIN_MULTIPLIER
        : PRIZE_CONFIG.NORMAL_WIN_MULTIPLIER;

      const winnerPrize = betAmount * multiplier;

      console.log(`💰 Prize calculation: bet=${betAmount}, type=${winType}, multiplier=${multiplier}, prize=${winnerPrize}`);

      // Update player 1
      await supabase.rpc('increment_player_stats', {
        player_addr: game.player1_address,
        games_delta: 1,
        wins_delta: game.winner_address === game.player1_address ? 1 : 0,
        wagered_delta: betAmount,
        winnings_delta: game.winner_address === game.player1_address ? winnerPrize : 0,
      });

      // Update player 2
      if (game.player2_address) {
        await supabase.rpc('increment_player_stats', {
          player_addr: game.player2_address,
          games_delta: 1,
          wins_delta: game.winner_address === game.player2_address ? 1 : 0,
          wagered_delta: betAmount,
          winnings_delta: game.winner_address === game.player2_address ? winnerPrize : 0,
        });
      }
    } catch (error) {
      console.error('Failed to update player stats:', error);
    }
  }

  /**
   * Handle player forfeit (disconnect/quit)
   * Winner receives 1.5x stake, platform retains 0.5x
   */
  async forfeitGame(
    gameId: number,
    forfeitingPlayerAddress: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured() || !supabase) {
      return { success: false, error: 'Supabase not configured' };
    }
    try {
      const game = await this.getGame(gameId);
      if (!game) {
        return { success: false, error: 'Game not found' };
      }

      if (game.state !== GAME_STATE.IN_PROGRESS) {
        return { success: false, error: 'Game is not in progress' };
      }

      const address = forfeitingPlayerAddress.toLowerCase();
      const isPlayer1 = game.player1_address.toLowerCase() === address;
      const isPlayer2 = game.player2_address?.toLowerCase() === address;

      if (!isPlayer1 && !isPlayer2) {
        return { success: false, error: 'Player not in this game' };
      }

      // The other player wins
      const winnerAddress = isPlayer1 ? game.player2_address : game.player1_address;

      const { error: updateError } = await supabase
        .from('games')
        .update({
          state: GAME_STATE.FORFEITED,
          winner_address: winnerAddress,
          win_type: WIN_TYPE.FORFEIT,
          finished_at: new Date().toISOString(),
        })
        .eq('game_id', gameId);

      if (updateError) throw updateError;

      // Update player stats with forfeit prize (1.6x)
      await this.updatePlayerStatsAfterGame(gameId, WIN_TYPE.FORFEIT);

      console.log(`🏳️ Game ${gameId} forfeited by ${address}. Winner: ${winnerAddress}`);

      return { success: true };
    } catch (error) {
      console.error('Failed to forfeit game:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  // ==================== LEADERBOARD ====================

  /**
   * Get leaderboard
   */
  async getLeaderboard(limit: number = 100): Promise<Player[]> {
    if (!isSupabaseConfigured() || !supabase) {
      return [];
    }
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .gt('games_played', 0)
        .order('total_winnings', { ascending: false })
        .order('games_won', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      return [];
    }
  }

  /**
   * Get recent matches
   */
  async getRecentMatches(limit: number = 50): Promise<Game[]> {
    if (!isSupabaseConfigured() || !supabase) {
      return [];
    }
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('state', GAME_STATE.FINISHED)
        .order('finished_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch recent matches:', error);
      return [];
    }
  }

  // ==================== REAL-TIME SUBSCRIPTIONS ====================

  /**
   * Subscribe to available games updates
   */
  subscribeToAvailableGames(callback: (games: Game[]) => void): () => void {
    if (!isSupabaseConfigured() || !supabase) {
      return () => { };
    }
    const subscription = supabase
      .channel('available-games')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'games',
          filter: `state=eq.${GAME_STATE.WAITING}`,
        },
        async () => {
          const games = await this.getAvailableGames();
          callback(games);
        }
      )
      .subscribe();

    // Return unsubscribe function
    return () => {
      subscription.unsubscribe();
    };
  }

  /**
   * Subscribe to a specific game updates
   */
  subscribeToGame(gameId: number, callback: (game: Game) => void): () => void {
    if (!isSupabaseConfigured() || !supabase) {
      return () => { };
    }
    const subscription = supabase
      .channel(`game-${gameId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'games',
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          callback(payload.new as Game);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }
}

// Export singleton instance
const supabaseGameService = new SupabaseGameService();
export default supabaseGameService;
