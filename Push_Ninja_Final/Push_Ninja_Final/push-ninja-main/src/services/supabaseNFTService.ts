import { supabase } from './supabaseClient';

// Check if Supabase is configured
const isSupabaseConfigured = (): boolean => supabase !== null;

interface NFTMintData {
  playerAddress: string;
  tokenId?: string;
  transactionHash?: string;
  score: number;
  maxCombo?: number;
  tokensSlashed?: number;
  tierName?: string;
}

interface NFTMint {
  id: string;
  player_address: string;
  token_id: string | null;
  transaction_hash: string | null;
  score: number;
  max_combo: number;
  tokens_slashed: number;
  tier_name: string | null;
  chain: string;
  created_at: string;
}

class SupabaseNFTService {
  /**
   * Save NFT mint record to Supabase
   */
  async saveMint(data: NFTMintData): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured() || !supabase) {
      console.log('Supabase not configured, skipping NFT mint save');
      return { success: true }; // Return success to not block the flow
    }
    try {
      const { error } = await supabase.from('nft_mints').insert({
        player_address: data.playerAddress.toLowerCase(),
        token_id: data.tokenId,
        transaction_hash: data.transactionHash,
        score: data.score,
        max_combo: data.maxCombo || 0,
        tokens_slashed: data.tokensSlashed || 0,
        tier_name: data.tierName,
        chain: 'push',
      });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Failed to save NFT mint:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Get player's NFT mints
   */
  async getPlayerMints(address: string): Promise<NFTMint[]> {
    if (!isSupabaseConfigured() || !supabase) {
      return [];
    }
    try {
      const { data, error } = await supabase
        .from('nft_mints')
        .select('*')
        .eq('player_address', address.toLowerCase())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get player mints:', error);
      return [];
    }
  }

  /**
   * Get total NFT count for a player
   */
  async getPlayerMintCount(address: string): Promise<number> {
    if (!isSupabaseConfigured() || !supabase) {
      return 0;
    }
    try {
      const { count, error } = await supabase
        .from('nft_mints')
        .select('*', { count: 'exact', head: true })
        .eq('player_address', address.toLowerCase());

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Failed to get mint count:', error);
      return 0;
    }
  }

  /**
   * Get recent mints across all players
   */
  async getRecentMints(limit: number = 20): Promise<NFTMint[]> {
    if (!isSupabaseConfigured() || !supabase) {
      return [];
    }
    try {
      const { data, error } = await supabase
        .from('nft_mints')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get recent mints:', error);
      return [];
    }
  }
}

const supabaseNFTService = new SupabaseNFTService();
export default supabaseNFTService;
