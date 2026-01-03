/**
 * Push Chain Service
 * Handles interactions with Push Chain for NFT minting and game data
 * Uses ethers.js for reliable contract interactions
 */

import { ethers } from 'ethers';

// Push Chain Network Configuration (Donut Devnet)
export const PUSH_CHAIN_CONFIG = {
  chainId: 42101, // Push Devnet (Donut)
  chainIdHex: '0xa475', // lowercase for comparison with MetaMask
  chainName: 'Push Devnet',
  nativeCurrency: {
    name: 'Push Token',
    symbol: 'PUSH',
    decimals: 18,
  },
  rpcUrls: ['https://evm.donut.rpc.push.org/'],
  blockExplorerUrls: ['https://donut.push.network'],
};

// Contract address - deployed to Push Chain Devnet
const GAME_NFT_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';

// Escrow contract address for multiplayer stakes (configure in .env.local after deployment)
const ESCROW_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';

// Legacy: Treasury address fallback (only used if escrow not deployed)
const STAKE_TREASURY_ADDRESS =
  process.env.NEXT_PUBLIC_STAKE_TREASURY_ADDRESS || '0x0000000000000000000000000000000000000001';

// Escrow contract ABI
const ESCROW_ABI = [
  'function createGame(uint256 gameId) payable',
  'function joinGame(uint256 gameId) payable',
  'function cancelGame(uint256 gameId)',
  'function getGame(uint256 gameId) view returns (tuple(uint256 gameId, uint256 betAmount, address player1, address player2, uint256 player1Score, uint256 player2Score, address winner, uint8 state, uint256 createdAt, uint256 finishedAt))',
  'function getGameEscrowBalance(uint256 gameId) view returns (uint256)',
  'function gameExists(uint256 gameId) view returns (bool)',
  'event GameCreated(uint256 indexed gameId, address indexed player1, uint256 betAmount)',
  'event GameJoined(uint256 indexed gameId, address indexed player2)',
];

// Minimal ABI for the functions we need
const GAME_NFT_ABI = [
  'function mintGameNFT(uint256 score, uint256 maxCombo, uint256 tokensSlashed, string tierName) returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
  'function getGameData(uint256 tokenId) view returns (uint256 score, uint256 maxCombo, uint256 tokensSlashed, string tierName, uint256 timestamp, address player)',
  'function getPlayerTokens(address player) view returns (uint256[])',
  'function totalSupply() view returns (uint256)',
  'event GameNFTMinted(uint256 indexed tokenId, address indexed player, uint256 score, uint256 maxCombo, uint256 tokensSlashed, string tierName)',
];

interface GameStats {
  score: number;
  maxCombo: number;
  tokensSlashed: number;
  tierName: string;
}

interface MintResult {
  success: boolean;
  tokenId?: string;
  transactionHash?: string;
  error?: string;
}

interface GameNFTData {
  tokenId: string;
  score: number;
  maxCombo: number;
  tokensSlashed: number;
  tierName: string;
  timestamp: number;
  player: string;
}

interface StakeResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

class PushChainService {
  private walletAddress: string | null = null;
  private isConnected: boolean = false;

  /**
   * Set the connected wallet address
   */
  setWallet(address: string | null): void {
    this.walletAddress = address;
    this.isConnected = !!address;
  }

  /**
   * Check if wallet is connected
   */
  getIsConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Get the current wallet address
   */
  getWalletAddress(): string | null {
    return this.walletAddress;
  }

  /**
   * Check if contract is deployed (not placeholder address)
   */
  isContractDeployed(): boolean {
    const deployed = GAME_NFT_CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000' &&
      GAME_NFT_CONTRACT_ADDRESS.length === 42;
    console.log('Contract deployed check:', deployed, 'Address:', GAME_NFT_CONTRACT_ADDRESS);
    return deployed;
  }

  /**
   * Get ethers provider and signer from MetaMask
   */
  private getProviderAndSigner() {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('MetaMask not available');
    }
    const provider = new ethers.BrowserProvider(window.ethereum);
    return provider;
  }

  /**
   * Check if escrow contract is deployed
   */
  isEscrowDeployed(): boolean {
    const deployed = ESCROW_CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000' &&
      ESCROW_CONTRACT_ADDRESS.length === 42;
    console.log('Escrow deployed check:', deployed, 'Address:', ESCROW_CONTRACT_ADDRESS);
    return deployed;
  }

  /**
   * Stake PUSH tokens for a multiplayer game (creating a game)
   * Uses escrow contract if deployed, otherwise falls back to treasury or simulation
   */
  async stakeTokens(amountWei: string, gameId: string): Promise<StakeResult> {
    if (!this.walletAddress) {
      return { success: false, error: 'Wallet not connected' };
    }

    if (typeof window === 'undefined' || !window.ethereum) {
      return { success: false, error: 'MetaMask not available' };
    }

    // Priority 1: Use escrow contract if deployed
    if (this.isEscrowDeployed()) {
      return this.createGameOnChain(amountWei, gameId);
    }

    // Priority 2: Use treasury address if configured
    const isTestMode = STAKE_TREASURY_ADDRESS === '0x0000000000000000000000000000000000000001' ||
      STAKE_TREASURY_ADDRESS === '0x0000000000000000000000000000000000000000';

    if (!isTestMode) {
      return this.stakeToTreasury(amountWei, gameId);
    }

    // Priority 3: Simulation mode (no contracts configured)
    console.log('⚠️ No staking contract configured - simulating stake for testing');
    console.log(`💰 Simulated stake of ${amountWei} wei for game ${gameId}`);

    await new Promise(resolve => setTimeout(resolve, 1000));

    const mockTxHash = `0x${Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('')}`;

    return {
      success: true,
      transactionHash: mockTxHash,
    };
  }

  /**
   * Create a game on the escrow contract (deposits stake)
   */
  async createGameOnChain(amountWei: string, gameId: string): Promise<StakeResult> {
    try {
      const chainId = await window.ethereum!.request({ method: 'eth_chainId' });
      const currentChainId = (chainId as string).toLowerCase();

      if (currentChainId !== PUSH_CHAIN_CONFIG.chainIdHex) {
        return { success: false, error: 'Please switch to Push Chain network' };
      }

      console.log(`💰 Creating game ${gameId} on escrow contract with ${amountWei} wei stake`);
      console.log(`📝 Escrow contract: ${ESCROW_CONTRACT_ADDRESS}`);

      const provider = this.getProviderAndSigner();
      const signer = await provider.getSigner();
      const escrow = new ethers.Contract(ESCROW_CONTRACT_ADDRESS, ESCROW_ABI, signer);

      const tx = await escrow.createGame(BigInt(gameId), { value: amountWei });
      console.log('⏳ Create game transaction sent:', tx.hash);

      const receipt = await tx.wait();
      console.log('✅ Game created on escrow:', receipt);

      return {
        success: true,
        transactionHash: tx.hash,
      };
    } catch (error) {
      return this.handleStakingError(error);
    }
  }

  /**
   * Join a game on the escrow contract (deposits matching stake)
   */
  async joinGameOnChain(amountWei: string, gameId: string): Promise<StakeResult> {
    if (!this.walletAddress) {
      return { success: false, error: 'Wallet not connected' };
    }

    if (typeof window === 'undefined' || !window.ethereum) {
      return { success: false, error: 'MetaMask not available' };
    }

    // Use escrow contract if deployed
    if (this.isEscrowDeployed()) {
      try {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        const currentChainId = (chainId as string).toLowerCase();

        if (currentChainId !== PUSH_CHAIN_CONFIG.chainIdHex) {
          return { success: false, error: 'Please switch to Push Chain network' };
        }

        console.log(`💰 Joining game ${gameId} on escrow contract with ${amountWei} wei stake`);

        const provider = this.getProviderAndSigner();
        const signer = await provider.getSigner();
        const escrow = new ethers.Contract(ESCROW_CONTRACT_ADDRESS, ESCROW_ABI, signer);

        const tx = await escrow.joinGame(BigInt(gameId), { value: amountWei });
        console.log('⏳ Join game transaction sent:', tx.hash);

        const receipt = await tx.wait();
        console.log('✅ Joined game on escrow:', receipt);

        return {
          success: true,
          transactionHash: tx.hash,
        };
      } catch (error) {
        return this.handleStakingError(error);
      }
    }

    // Fallback to regular stake for non-escrow modes
    return this.stakeTokens(amountWei, gameId);
  }

  /**
   * Legacy: Send stake to treasury address
   */
  private async stakeToTreasury(amountWei: string, gameId: string): Promise<StakeResult> {
    try {
      const chainId = await window.ethereum!.request({ method: 'eth_chainId' });
      const currentChainId = (chainId as string).toLowerCase();

      if (currentChainId !== PUSH_CHAIN_CONFIG.chainIdHex) {
        return { success: false, error: 'Please switch to Push Chain network' };
      }

      console.log(`💰 Staking ${amountWei} wei to treasury for game ${gameId}`);
      console.log(`📬 Treasury address: ${STAKE_TREASURY_ADDRESS}`);

      const provider = this.getProviderAndSigner();
      const signer = await provider.getSigner();

      // Note: Push Chain doesn't allow data in simple transfers, so we just send value
      const tx = await signer.sendTransaction({
        to: STAKE_TREASURY_ADDRESS,
        value: amountWei,
      });

      console.log('⏳ Stake transaction sent:', tx.hash);

      const receipt = await tx.wait();
      console.log('✅ Stake confirmed:', receipt);

      return {
        success: true,
        transactionHash: tx.hash,
      };
    } catch (error) {
      return this.handleStakingError(error);
    }
  }

  /**
   * Handle staking errors consistently
   */
  private handleStakingError(error: unknown): StakeResult {
    console.error('❌ Error staking tokens:', error);

    let errorMessage = 'Failed to stake tokens';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null) {
      if ('message' in error) {
        errorMessage = String((error as { message: unknown }).message);
      } else if ('reason' in error) {
        errorMessage = String((error as { reason: unknown }).reason);
      } else if ('shortMessage' in error) {
        errorMessage = String((error as { shortMessage: unknown }).shortMessage);
      } else {
        errorMessage = 'Transaction failed';
      }
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    if (errorMessage.includes('rejected') || errorMessage.includes('denied') || errorMessage.includes('user rejected')) {
      return { success: false, error: 'Transaction rejected by user' };
    }

    if (errorMessage.includes('insufficient funds')) {
      return { success: false, error: 'Insufficient PUSH tokens. Get testnet tokens from the faucet.' };
    }

    return { success: false, error: errorMessage };
  }

  /**
   * Mint a game NFT on Push Chain using ethers.js
   */
  async mintGameNFT(gameStats: GameStats): Promise<MintResult> {
    if (!this.walletAddress) {
      return { success: false, error: 'Wallet not connected' };
    }

    if (typeof window === 'undefined' || !window.ethereum) {
      return { success: false, error: 'MetaMask not available' };
    }

    try {
      // Check if we're on Push Chain
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const currentChainId = (chainId as string).toLowerCase();
      console.log('Current chain ID:', currentChainId, 'Expected:', PUSH_CHAIN_CONFIG.chainIdHex);

      if (currentChainId !== PUSH_CHAIN_CONFIG.chainIdHex) {
        return { success: false, error: `Please switch to Push Chain network. Current: ${currentChainId}, Expected: ${PUSH_CHAIN_CONFIG.chainIdHex}` };
      }

      // Check if contract is deployed
      if (!this.isContractDeployed()) {
        console.warn('Contract not deployed, using simulated minting');
        return this.simulateMint(gameStats);
      }

      console.log('🎮 Minting NFT with stats:', gameStats);
      console.log('📝 Contract address:', GAME_NFT_CONTRACT_ADDRESS);

      // Get provider and signer using ethers.js
      const provider = this.getProviderAndSigner();
      const signer = await provider.getSigner();

      // Create contract instance
      const contract = new ethers.Contract(GAME_NFT_CONTRACT_ADDRESS, GAME_NFT_ABI, signer);

      console.log('📤 Sending mint transaction...');

      // Call mintGameNFT function
      const tx = await contract.mintGameNFT(
        gameStats.score,
        gameStats.maxCombo,
        gameStats.tokensSlashed,
        gameStats.tierName
      );

      console.log('⏳ Transaction sent:', tx.hash);

      // Wait for transaction to be mined
      const receipt = await tx.wait();
      console.log('✅ Transaction confirmed:', receipt);

      // Parse tokenId from events
      let tokenId = 'unknown';
      if (receipt.logs && receipt.logs.length > 0) {
        // Find the GameNFTMinted event
        for (const log of receipt.logs) {
          try {
            const parsed = contract.interface.parseLog({
              topics: log.topics as string[],
              data: log.data,
            });
            if (parsed && parsed.name === 'GameNFTMinted') {
              tokenId = parsed.args[0].toString();
              console.log('🎉 Minted token ID:', tokenId);
              break;
            }
          } catch {
            // Not our event, continue
          }
        }
      }

      return {
        success: true,
        tokenId: tokenId,
        transactionHash: tx.hash,
      };
    } catch (error) {
      console.error('❌ Error minting NFT:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to mint NFT';

      // If user rejected, return specific error
      if (errorMessage.includes('rejected') || errorMessage.includes('denied') || errorMessage.includes('user rejected')) {
        return { success: false, error: 'Transaction rejected by user' };
      }

      // Check for insufficient funds
      if (errorMessage.includes('insufficient funds')) {
        return { success: false, error: 'Insufficient PUSH tokens for gas. Get testnet tokens from the faucet.' };
      }

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Simulate minting when contract is not deployed (for testing)
   */
  private async simulateMint(gameStats: GameStats): Promise<MintResult> {
    console.log('🎭 Simulating NFT mint with stats:', gameStats);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const mockTokenId = `${Date.now() % 10000}`;
    const mockTxHash = `0x${Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('')}`;

    return {
      success: true,
      tokenId: mockTokenId,
      transactionHash: mockTxHash,
    };
  }

  /**
   * Get the number of NFTs owned by an address
   */
  async getNFTBalance(address: string): Promise<number> {
    if (!this.isContractDeployed() || typeof window === 'undefined' || !window.ethereum) {
      return 0;
    }

    try {
      const provider = this.getProviderAndSigner();
      const contract = new ethers.Contract(GAME_NFT_CONTRACT_ADDRESS, GAME_NFT_ABI, provider);
      const balance = await contract.balanceOf(address);
      return Number(balance);
    } catch (error) {
      console.error('Error getting NFT balance:', error);
      return 0;
    }
  }

  /**
   * Get game data for a specific NFT
   */
  async getGameData(tokenId: string): Promise<GameNFTData | null> {
    if (!this.isContractDeployed() || typeof window === 'undefined' || !window.ethereum) {
      return null;
    }

    try {
      const provider = this.getProviderAndSigner();
      const contract = new ethers.Contract(GAME_NFT_CONTRACT_ADDRESS, GAME_NFT_ABI, provider);
      const data = await contract.getGameData(tokenId);
      return {
        tokenId,
        score: Number(data.score),
        maxCombo: Number(data.maxCombo),
        tokensSlashed: Number(data.tokensSlashed),
        tierName: data.tierName,
        timestamp: Number(data.timestamp),
        player: data.player,
      };
    } catch (error) {
      console.error('Error getting game data:', error);
      return null;
    }
  }

  /**
   * Get all NFTs owned by an address
   */
  async getUserNFTs(address: string): Promise<GameNFTData[]> {
    if (!this.isContractDeployed() || typeof window === 'undefined' || !window.ethereum) {
      return [];
    }

    try {
      const provider = this.getProviderAndSigner();
      const contract = new ethers.Contract(GAME_NFT_CONTRACT_ADDRESS, GAME_NFT_ABI, provider);
      const tokenIds = await contract.getPlayerTokens(address);

      const nfts: GameNFTData[] = [];
      for (const tokenId of tokenIds) {
        const data = await this.getGameData(tokenId.toString());
        if (data) {
          nfts.push(data);
        }
      }
      return nfts;
    } catch (error) {
      console.error('Error getting user NFTs:', error);
      return [];
    }
  }

  /**
   * Get the contract address
   */
  getContractAddress(): string {
    return GAME_NFT_CONTRACT_ADDRESS;
  }

  /**
   * Get the explorer URL for a transaction
   */
  getExplorerUrl(txHash: string): string {
    return `${PUSH_CHAIN_CONFIG.blockExplorerUrls[0]}/tx/${txHash}`;
  }

  /**
   * Get the explorer URL for an NFT
   */
  getNFTExplorerUrl(tokenId: string): string {
    return `${PUSH_CHAIN_CONFIG.blockExplorerUrls[0]}/token/${GAME_NFT_CONTRACT_ADDRESS}?a=${tokenId}`;
  }
}

// Export singleton instance
const pushChainService = new PushChainService();
export default pushChainService;

// Export types
export type { GameStats, MintResult, GameNFTData, StakeResult };
