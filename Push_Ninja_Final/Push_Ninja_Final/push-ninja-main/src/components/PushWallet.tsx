import React, { useState } from 'react';
import { PushUniversalAccountButton } from '@pushchain/ui-kit';
import { GiGamepad, GiTrophyCup, GiTargetArrows, GiCrossedSwords } from 'react-icons/gi';
import { FaExternalLinkAlt, FaTimes } from 'react-icons/fa';

interface PushWalletState {
  walletAddress: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  isMinting: boolean;
  mintedNFT: { tokenId?: string } | null;
  nfts: Array<{
    tokenId: string;
    score: number;
    maxCombo: number;
    tokensSliced: number;
    totalSlashes: number;
    timestamp: number;
  }>;
  isCorrectNetwork: boolean;
  connectWallet: () => Promise<{ success: boolean; address?: string; error?: string }>;
  disconnectWallet: () => void;
  switchToPushChain: () => Promise<boolean>;
}

interface PushWalletProps {
  pushWallet: PushWalletState;
}

const PushWallet: React.FC<PushWalletProps> = ({ pushWallet }) => {
  const [showNFTs, setShowNFTs] = useState(false);

  const formatTimestamp = (timestamp: number): string => {
    if (!timestamp) return 'Just now';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (!pushWallet) {
    return null;
  }

  const nfts = pushWallet.nfts || [];

  return (
    <div className="push-wallet" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      {/* Push Chain UI Kit Account Button */}
      <PushUniversalAccountButton />

      {/* NFT Gallery Button (only when connected) */}
      {pushWallet.isConnected && nfts.length > 0 && (
        <button
          className="nft-toggle-btn"
          onClick={() => setShowNFTs(!showNFTs)}
          title="View your NFTs"
          style={{
            background: 'rgba(139, 92, 246, 0.2)',
            border: '1px solid rgba(139, 92, 246, 0.4)',
            borderRadius: '8px',
            padding: '0.5rem 0.75rem',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}
        >
          <GiGamepad />
          <span className="nft-count">{nfts.length}</span>
        </button>
      )}

      {/* NFT Gallery Dropdown */}
      {showNFTs && (
        <div className="nft-gallery-dropdown">
          <div className="nft-gallery-header">
            <div className="nft-header-title">
              <GiGamepad className="nft-header-icon" />
              <h3>Your Game NFTs</h3>
            </div>
            <button
              className="close-gallery-btn"
              onClick={() => setShowNFTs(false)}
            >
              <FaTimes />
            </button>
          </div>

          <div className="nft-gallery-content">
            {nfts.length === 0 ? (
              <div className="no-nfts">
                <div className="no-nfts-icon-wrapper">
                  <GiGamepad className="no-nfts-icon" />
                </div>
                <p className="no-nfts-title">No NFTs Yet</p>
                <p className="no-nfts-hint">Play a game and mint your first NFT on Push Chain!</p>
              </div>
            ) : (
              <div className="nft-grid">
                {nfts.map((nft) => (
                  <div key={nft.tokenId} className="nft-card">
                    <div className="nft-card-header">
                      <div className="nft-badge push-badge">
                        <GiGamepad />
                        <span>#{nft.tokenId}</span>
                      </div>
                      <span className="nft-timestamp">{formatTimestamp(nft.timestamp)}</span>
                    </div>

                    <div className="nft-stats-grid">
                      <div className="nft-stat">
                        <div className="stat-icon-wrapper">
                          <GiTrophyCup />
                        </div>
                        <div className="stat-content">
                          <span className="stat-label">Score</span>
                          <span className="stat-value">{nft.score}</span>
                        </div>
                      </div>
                      <div className="nft-stat">
                        <div className="stat-icon-wrapper">
                          <GiCrossedSwords />
                        </div>
                        <div className="stat-content">
                          <span className="stat-label">Max Combo</span>
                          <span className="stat-value">{nft.maxCombo}x</span>
                        </div>
                      </div>
                      <div className="nft-stat">
                        <div className="stat-icon-wrapper">
                          <GiTargetArrows />
                        </div>
                        <div className="stat-content">
                          <span className="stat-label">Tokens</span>
                          <span className="stat-value">{nft.tokensSliced}</span>
                        </div>
                      </div>
                      <div className="nft-stat">
                        <div className="stat-icon-wrapper">
                          <GiCrossedSwords />
                        </div>
                        <div className="stat-content">
                          <span className="stat-label">Slashes</span>
                          <span className="stat-value">{nft.totalSlashes}</span>
                        </div>
                      </div>
                    </div>

                    <div className="nft-card-footer">
                      <a
                        href={`https://explorer.push.org/token/${nft.tokenId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="view-nft-btn"
                      >
                        <span>View on Push Explorer</span>
                        <FaExternalLinkAlt />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {pushWallet.error && (
        <div className="wallet-error">
          {pushWallet.error}
        </div>
      )}
    </div>
  );
};

export default PushWallet;
