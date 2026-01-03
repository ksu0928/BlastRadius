import { useState, useEffect, useCallback } from 'react';
import supabaseNFTService from '../services/supabaseNFTService';

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
      isMetaMask?: boolean;
    };
  }
}

// Push Chain Network Configuration (Donut Devnet)
const PUSH_CHAIN_CONFIG = {
  chainId: '0xa475', // 42101 in hex - Push Devnet (Donut) - lowercase for MetaMask
  chainName: 'Push Devnet',
  nativeCurrency: {
    name: 'Push Token',
    symbol: 'PUSH',
    decimals: 18,
  },
  rpcUrls: ['https://evm.donut.rpc.push.org/'],
  blockExplorerUrls: ['https://donut.push.network'],
};

interface GameStats {
  score: number;
  slashes: number;
  combo: number;
  mode: string;
}

interface MintResult {
  success: boolean;
  error?: string;
  tokenId?: string;
  transactionHash?: string;
}

interface NFT {
  tokenId: string;
  score: number;
  maxCombo: number;
  tokensSliced: number;
  totalSlashes: number;
  timestamp: number;
}

interface UsePushWalletReturn {
  walletAddress: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  isMinting: boolean;
  mintedNFT: MintResult | null;
  nfts: NFT[];
  chainId: string | null;
  isCorrectNetwork: boolean;
  connectWallet: () => Promise<{ success: boolean; address?: string; error?: string }>;
  disconnectWallet: () => void;
  switchToPushChain: () => Promise<boolean>;
  startGameSession: () => void;
  mintGameNFT: (gameStats: GameStats) => Promise<MintResult>;
}

export const usePushWallet = (): UsePushWalletReturn => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isMinting, setIsMinting] = useState<boolean>(false);
  const [mintedNFT, setMintedNFT] = useState<MintResult | null>(null);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [chainId, setChainId] = useState<string | null>(null);

  const isCorrectNetwork = chainId === PUSH_CHAIN_CONFIG.chainId;

  // Check if wallet is already connected on mount
  useEffect(() => {
    const checkConnection = async (): Promise<void> => {
      if (typeof window === 'undefined' || !window.ethereum) return;

      try {
        const accounts = (await window.ethereum.request({
          method: 'eth_accounts',
        })) as string[];

        if (accounts && accounts.length > 0) {
          setWalletAddress(accounts[0]);

          const currentChainId = (await window.ethereum.request({
            method: 'eth_chainId',
          })) as string;
          setChainId(currentChainId);
        }
      } catch {
        console.log('Wallet not auto-connected');
      }
    };

    checkConnection();

    // Listen for account changes
    const handleAccountsChanged = (accounts: unknown): void => {
      const accountsArray = accounts as string[];
      if (accountsArray.length === 0) {
        setWalletAddress(null);
      } else {
        setWalletAddress(accountsArray[0]);
      }
    };

    // Listen for chain changes
    const handleChainChanged = (newChainId: unknown): void => {
      setChainId(newChainId as string);
    };

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  const switchToPushChain = useCallback(async (): Promise<boolean> => {
    if (!window.ethereum) return false;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: PUSH_CHAIN_CONFIG.chainId }],
      });
      return true;
    } catch (switchError: unknown) {
      const error = switchError as { code: number };
      // Chain not added, add it
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [PUSH_CHAIN_CONFIG],
          });
          return true;
        } catch {
          setError('Failed to add Push Chain network');
          return false;
        }
      }
      setError('Failed to switch to Push Chain network');
      return false;
    }
  }, []);

  const connectWallet = useCallback(async (): Promise<{
    success: boolean;
    address?: string;
    error?: string;
  }> => {
    if (typeof window === 'undefined' || !window.ethereum) {
      const errorMsg = 'Please install MetaMask to connect your wallet';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Request account access
      const accounts = (await window.ethereum.request({
        method: 'eth_requestAccounts',
      })) as string[];

      if (accounts && accounts.length > 0) {
        setWalletAddress(accounts[0]);

        // Get current chain
        const currentChainId = (await window.ethereum.request({
          method: 'eth_chainId',
        })) as string;
        setChainId(currentChainId);

        // Switch to Push Chain if not already on it
        if (currentChainId !== PUSH_CHAIN_CONFIG.chainId) {
          await switchToPushChain();
        }

        return { success: true, address: accounts[0] };
      }

      return { success: false, error: 'No accounts found' };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to connect wallet';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsConnecting(false);
    }
  }, [switchToPushChain]);

  const disconnectWallet = useCallback((): void => {
    setWalletAddress(null);
    setError(null);
    setMintedNFT(null);
    setNfts([]);
  }, []);

  const startGameSession = useCallback((): void => {
    console.log('Game session started for Push Chain wallet:', walletAddress);
  }, [walletAddress]);

  const mintGameNFT = useCallback(
    async (gameStats: GameStats): Promise<MintResult> => {
      if (!walletAddress) {
        setError('Please connect your wallet first');
        return { success: false, error: 'Wallet not connected' };
      }

      if (!isCorrectNetwork) {
        const switched = await switchToPushChain();
        if (!switched) {
          return { success: false, error: 'Please switch to Push Chain network' };
        }
      }

      setIsMinting(true);
      setError(null);

      try {
        console.log('🎮 Minting NFT on Push Chain with stats:', gameStats);

        // Import and use pushChainService for real contract interaction
        const pushChainService = (await import('../services/pushChainService')).default;
        pushChainService.setWallet(walletAddress);

        // Call the real contract minting function
        const result = await pushChainService.mintGameNFT({
          score: gameStats.score,
          maxCombo: gameStats.combo,
          tokensSlashed: gameStats.slashes,
          tierName: gameStats.mode || 'Classic',
        });

        if (!result.success) {
          setError(result.error || 'Minting failed');
          return result;
        }

        console.log('✅ NFT minted successfully:', result);
        setMintedNFT(result);

        // Add to NFTs list
        const newNFT: NFT = {
          tokenId: result.tokenId!,
          score: gameStats.score,
          maxCombo: gameStats.combo,
          tokensSliced: gameStats.slashes,
          totalSlashes: gameStats.slashes,
          timestamp: Date.now() / 1000,
        };
        setNfts((prev) => [...prev, newNFT]);

        // Save to Supabase for tracking
        await supabaseNFTService.saveMint({
          playerAddress: walletAddress,
          tokenId: result.tokenId,
          transactionHash: result.transactionHash,
          score: gameStats.score,
          maxCombo: gameStats.combo,
          tokensSlashed: gameStats.slashes,
          tierName: gameStats.mode || 'Classic',
        });

        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to mint NFT';
        console.error('❌ NFT minting error:', err);
        setError(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setIsMinting(false);
      }
    },
    [walletAddress, isCorrectNetwork, switchToPushChain]
  );

  return {
    walletAddress,
    isConnected: !!walletAddress,
    isConnecting,
    error,
    isMinting,
    mintedNFT,
    nfts,
    chainId,
    isCorrectNetwork,
    connectWallet,
    disconnectWallet,
    switchToPushChain,
    startGameSession,
    mintGameNFT,
  };
};
