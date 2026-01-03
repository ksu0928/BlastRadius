import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create Supabase client (only if credentials are provided)
let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn('Supabase credentials not configured. Database features will be disabled.');
}

export { supabase };

// Database types
// Win type constants for prize distribution
export const WIN_TYPE = {
  NORMAL: 'normal',      // Player won by score/elimination - 98% of pool
  FORFEIT: 'forfeit',    // Opponent forfeited/disconnected - 1.5x payout
} as const;

// Prize multipliers
export const PRIZE_CONFIG = {
  NORMAL_WIN_MULTIPLIER: 1.98,   // Winner gets 98% of total pool (both stakes)
  FORFEIT_WIN_MULTIPLIER: 1.5,   // Winner gets 1.5x their stake on forfeit
  NORMAL_PLATFORM_FEE: 0.02,     // Platform retains 2% on normal win
  FORFEIT_PLATFORM_FEE: 0.5,     // Platform retains 0.5x on forfeit
} as const;

export interface Game {
  id: string;
  game_id: number;
  bet_amount: number;
  bet_tier: number;
  player1_address: string;
  player2_address: string | null;
  player1_score: number;
  player2_score: number;
  player1_finished: boolean;
  player2_finished: boolean;
  winner_address: string | null;
  win_type: string | null;  // 'normal' or 'forfeit'
  state: number; // 0=WAITING, 1=IN_PROGRESS, 2=FINISHED, 3=CANCELLED, 4=FORFEITED
  room_type: string; // 'public' or 'private'
  room_code: string | null; // Join code for private rooms
  created_at: string;
  joined_at: string | null;
  finished_at: string | null;
  creation_tx_hash: string | null;
  join_tx_hash: string | null;
  finish_tx_hash: string | null;
}

export interface Player {
  id: string;
  address: string;
  games_played: number;
  games_won: number;
  total_wagered: number;
  total_winnings: number;
  created_at: string;
  last_active: string;
}

export interface PlayerGameStats {
  id: string;
  player_address: string;
  game_id: number;
  final_score: number;
  max_combo: number;
  tokens_slashed: number;
  tokens_missed: number;
  game_duration: number;
  created_at: string;
}

// Game state constants
export const GAME_STATE = {
  WAITING: 0,
  IN_PROGRESS: 1,
  FINISHED: 2,
  CANCELLED: 3,
  FORFEITED: 4,
} as const;

export default supabase;
