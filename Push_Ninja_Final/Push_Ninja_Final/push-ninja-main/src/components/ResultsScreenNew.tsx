import React, { useState, useEffect } from 'react';
import multiplayerService from '../services/multiplayerService';
import { canMintNFTAtTier, getTierByScore } from '../utils/tierSystem';

interface GameState {
  score: number;
  bestScore: number;
  totalScore: number;
  gamesPlayed: number;
  citreaSlashed?: number;
  maxCombo?: number;
  bombsHit?: number;
  gameStartTime?: number | null;
  gameEndTime?: number | null;
}

interface PushWallet {
  isConnected: boolean;
  walletAddress: string | null;
  mintGameNFT: (stats: {
    score: number;
    slashes: number;
    combo: number;
    mode: string;
  }) => Promise<{ success: boolean; transactionHash?: string; tokenId?: string; error?: string }>;
}

interface ResultsScreenProps {
  gameState: GameState;
  onStartGame: () => void;
  onShowStartScreen: () => void;
  pushWallet: PushWallet;
  multiplayerGameId?: string | null;
  onBackToMultiplayer?: () => void;
}

type MintingStatus = null | 'minting' | 'success' | 'error';

const ResultsScreenNew: React.FC<ResultsScreenProps> = ({
  gameState,
  onStartGame,
  onShowStartScreen,
  pushWallet,
  multiplayerGameId,
  onBackToMultiplayer,
}) => {
  const [mintingStatus, setMintingStatus] = useState<MintingStatus>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [multiplayerSubmitted, setMultiplayerSubmitted] = useState<boolean>(false);
  const [multiplayerResult, setMultiplayerResult] = useState<'won' | 'lost' | 'pending' | null>(null);

  const nftEligibility = canMintNFTAtTier(gameState.totalScore, gameState.gamesPlayed);
  const currentTier = getTierByScore(gameState.totalScore);
  const nextTier = getNextTier(currentTier);
  const progressToNext = calculateProgress(gameState.totalScore, currentTier, nextTier);
  const pointsNeeded = nextTier ? nextTier.minScore - gameState.totalScore : 0;

  useEffect(() => {
    const submitMultiplayerScore = async (): Promise<void> => {
      if (multiplayerGameId && pushWallet.isConnected && !multiplayerSubmitted) {
        setMultiplayerSubmitted(true);
        setMultiplayerResult('pending');

        const result = await multiplayerService.submitScore(multiplayerGameId, gameState.score) as {
          success: boolean;
          game?: { winner_address?: string; state?: number }
        };

        const playerAddress = pushWallet.walletAddress?.toLowerCase();

        // Check if we won or lost based on the result
        if (result && result.game) {
          const winnerAddress = result.game.winner_address?.toLowerCase();

          if (winnerAddress === playerAddress) {
            setMultiplayerResult('won');
            return;
          } else if (winnerAddress) {
            setMultiplayerResult('lost');
            return;
          } else if (result.game.state === 2 || result.game.state === 4) {
            // Game is finished but no winner (tie)
            setMultiplayerResult(null);
            return;
          }
        }

        // Game not finished yet (we submitted first), poll for result
        const pollForResult = async () => {
          for (let i = 0; i < 15; i++) {
            await new Promise(r => setTimeout(r, 1000)); // Wait 1 second
            try {
              const game = await multiplayerService.getGame(multiplayerGameId) as {
                winner_address?: string;
                state?: number;
              } | null;

              if (game && game.winner_address) {
                const winner = game.winner_address.toLowerCase();
                if (winner === playerAddress) {
                  setMultiplayerResult('won');
                } else {
                  setMultiplayerResult('lost');
                }
                return;
              } else if (game && (game.state === 2 || game.state === 4)) {
                // Game finished without a decisive winner
                setMultiplayerResult(null);
                return;
              }
            } catch (e) {
              console.log('Polling for result...', i + 1);
            }
          }
          // After 15 seconds, give up polling
          console.log('Timeout waiting for opponent result');
        };
        pollForResult();
      }
    };
    submitMultiplayerScore();
  }, [multiplayerGameId, gameState.score, pushWallet.isConnected, pushWallet.walletAddress, multiplayerSubmitted]);

  const [mintError, setMintError] = useState<string | null>(null);

  const handleMintNFT = async (): Promise<void> => {
    setMintingStatus('minting');
    setMintError(null);
    try {
      const result = await pushWallet.mintGameNFT({
        score: gameState.score,
        slashes: gameState.citreaSlashed || 0,
        combo: gameState.maxCombo || 0,
        mode: currentTier.name,
      });
      if (result.success) {
        if (result.transactionHash) {
          setTransactionHash(result.transactionHash);
        }
        setMintingStatus('success');
      } else {
        setMintError(result.error || 'Minting failed');
        setMintingStatus('error');
        setTimeout(() => setMintingStatus(null), 5000);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setMintError(errorMsg);
      setMintingStatus('error');
      setTimeout(() => setMintingStatus(null), 5000);
    }
  };

  return (
    <div className="results-screen-new">
      {/* Background gradient */}
      <div className="results-bg"></div>

      {/* Multiplayer Result Fullscreen Overlay */}
      {multiplayerGameId && multiplayerResult && multiplayerResult !== 'pending' && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: multiplayerResult === 'won'
            ? 'radial-gradient(circle at center, rgba(0, 255, 136, 0.15) 0%, rgba(0, 0, 0, 0.95) 70%)'
            : 'radial-gradient(circle at center, rgba(255, 0, 68, 0.15) 0%, rgba(0, 0, 0, 0.95) 70%)',
          zIndex: 0,
          pointerEvents: 'none'
        }} />
      )}

      {/* Main container */}
      <div className="results-main-container" style={{ position: 'relative', zIndex: 1 }}>
        {/* Game Over Title - Show Win/Loss for Multiplayer */}
        {multiplayerGameId && multiplayerResult ? (
          <div style={{
            textAlign: 'center',
            marginBottom: '2rem',
            animation: 'resultPulse 2s ease-in-out infinite'
          }}>
            <h1 style={{
              fontSize: 'clamp(3rem, 12vw, 6rem)',
              fontWeight: 900,
              fontFamily: 'Orbitron, sans-serif',
              color: multiplayerResult === 'won' ? '#00FF88' : '#FF0044',
              textShadow: multiplayerResult === 'won'
                ? '0 0 20px #00FF88, 0 0 40px #00FF88, 0 0 60px #00FF88, 0 0 80px rgba(0, 255, 136, 0.5)'
                : '0 0 20px #FF0044, 0 0 40px #FF0044, 0 0 60px #FF0044, 0 0 80px rgba(255, 0, 68, 0.5)',
              letterSpacing: '0.1em',
              margin: 0,
              WebkitTextStroke: multiplayerResult === 'won' ? '2px #00CC66' : '2px #CC0033'
            }}>
              {multiplayerResult === 'won' ? 'YOU WON!' : 'YOU LOST'}
            </h1>
          </div>
        ) : multiplayerResult === 'pending' ? (
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 className="game-over-title-new" style={{ color: '#FFD700' }}>
              ⏳ Waiting for opponent...
            </h1>
          </div>
        ) : (
          <h1 className="game-over-title-new">GAME OVER</h1>
        )}

        {/* Score Card */}
        <div className="score-card-container">
          <div className="score-card-outer">
            <div className="score-card-inner">
              <span className="score-label-new">SCORE</span>
              <span className="score-value-new">{gameState.score}</span>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="stats-row-new">
          <div className="stat-card-new">
            <span className="stat-value-new">{gameState.citreaSlashed || 0}</span>
            <span className="stat-label-new">TOKENS SLASHED</span>
          </div>
          <div className="stat-card-new">
            <span className="stat-value-new">{gameState.maxCombo || 0}</span>
            <span className="stat-label-new">MAX COMBO</span>
          </div>
          <div className="stat-card-new">
            <span className="stat-value-new">{gameState.bestScore || 0}</span>
            <span className="stat-label-new">BEST SCORE</span>
          </div>
        </div>

        {/* Tier Progress Card */}
        <div className="tier-card-new">
          <div className="tier-header">
            <div className="tier-icon-container">
              <span className="tier-icon-large">{currentTier.icon}</span>
            </div>
            <div className="tier-info">
              <h2 className="tier-name-new" style={{ color: currentTier.color }}>
                {currentTier.name}
              </h2>
              <p className="tier-rank">Beginner 🏆</p>
              <p className="tier-stats">
                Total Score: {gameState.totalScore} • Games: {gameState.gamesPlayed} • Best: {gameState.bestScore}
              </p>
            </div>
          </div>

          {nextTier && (
            <>
              <div className="progress-header">
                <span className="progress-label">Progress to {nextTier.name}</span>
                <span className="points-needed" style={{ color: currentTier.color }}>
                  {pointsNeeded} points needed
                </span>
              </div>
              <div className="progress-bar-container">
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${progressToNext}%`,
                    background: `linear-gradient(90deg, ${currentTier.color}, #00D9A5)`
                  }}
                >
                  <span className="progress-percent">{Math.round(progressToNext)}%</span>
                </div>
              </div>
              <div className="next-tier-preview">
                <span className="next-tier-icon">{nextTier.icon}</span>
                <span className="next-tier-name">{nextTier.name}</span>
              </div>
            </>
          )}
        </div>

        {/* NFT Minting Section - Only for single player games */}
        {pushWallet.isConnected && !multiplayerGameId && (
          <div className="nft-mint-section">
            {mintingStatus === null && (
              <button className="btn-mint-nft" onClick={handleMintNFT}>
                <span className="btn-icon"></span> Mint Game NFT
              </button>
            )}
            {mintingStatus === 'minting' && (
              <div className="minting-status">
                <span className="spinner"></span> Minting your NFT...
              </div>
            )}
            {mintingStatus === 'success' && (
              <div className="mint-success">
                <span>NFT Minted Successfully!</span>
                {transactionHash && (
                  <a
                    href={`https://donut.push.network/tx/${transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tx-link"
                  >
                    View on Explorer →
                  </a>
                )}
              </div>
            )}
            {mintingStatus === 'error' && (
              <div className="mint-error">
                <span>{mintError || 'Minting failed. Try again.'}</span>
              </div>
            )}
          </div>
        )}

        {/* Multiplayer Transaction Links */}
        {multiplayerGameId && (
          <div className="multiplayer-tx-section" style={{
            marginTop: '1.5rem',
            padding: '1.5rem',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(10px)'
          }}>
            <h3 style={{
              color: '#00D9A5',
              fontSize: '1rem',
              marginBottom: '1.2rem',
              fontFamily: 'Orbitron, sans-serif',
              letterSpacing: '0.15em',
              textShadow: '0 0 10px rgba(0, 255, 136, 0.3)'
            }}>
              ARENA TRANSACTIONS
            </h3>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              alignItems: 'center'
            }}>
              <p style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.6)', margin: 0 }}>
                View on-chain proof of stakes on Push Explorer:
              </p>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                  onClick={async () => {
                    const game = await multiplayerService.getGame(multiplayerGameId);
                    if (game && game.creation_tx_hash) {
                      window.open(`https://donut.push.network/tx/${game.creation_tx_hash}`, '_blank');
                    } else {
                      alert('Staking transaction (Creator) not found in records');
                    }
                  }}
                  style={{
                    padding: '0.6rem 1.2rem',
                    background: 'rgba(155, 93, 229, 0.15)',
                    border: '1px solid #9B5DE5',
                    borderRadius: '8px',
                    color: '#9B5DE5',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'rgba(155, 93, 229, 0.3)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(155, 93, 229, 0.3)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(155, 93, 229, 0.15)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  Creation TX →
                </button>
                <button
                  onClick={async () => {
                    const game = await multiplayerService.getGame(multiplayerGameId);
                    if (game && game.join_tx_hash) {
                      window.open(`https://donut.push.network/tx/${game.join_tx_hash}`, '_blank');
                    } else {
                      alert('Staking transaction (Joiner) not found in records');
                    }
                  }}
                  style={{
                    padding: '0.6rem 1.2rem',
                    background: 'rgba(241, 91, 181, 0.15)',
                    border: '1px solid #F15BB5',
                    borderRadius: '8px',
                    color: '#F15BB5',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'rgba(241, 91, 181, 0.3)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(241, 91, 181, 0.3)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(241, 91, 181, 0.15)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  Join TX →
                </button>
              </div>
            </div>
          </div>
        )}

        {!pushWallet.isConnected && (
          <div className="connect-prompt">
            <p>Connect wallet to mint game NFTs!</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="action-buttons-new">
          {multiplayerGameId ? (
            <>
              <button className="btn-replay-new" onClick={onBackToMultiplayer}>
                <span className="btn-icon">⚔️</span> Back to Arena
              </button>
              <button className="btn-home-new" onClick={onShowStartScreen}>
                Home
              </button>
            </>
          ) : (
            <>
              <button className="btn-replay-new" onClick={onStartGame}>
                <span className="btn-icon">🔄</span> Replay
              </button>
              <button className="btn-home-new" onClick={onShowStartScreen}>
                Home
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper functions
function getNextTier(currentTier: { name: string; minScore: number }) {
  const tiers = [
    { name: 'Wooden Blade', minScore: 0, icon: '🪵', color: '#8B4513' },
    { name: 'Bronze Blade', minScore: 500, icon: '🥉', color: '#CD7F32' },
    { name: 'Silver Blade', minScore: 2000, icon: '🥈', color: '#C0C0C0' },
    { name: 'Gold Blade', minScore: 5000, icon: '🥇', color: '#FFD700' },
    { name: 'Diamond Blade', minScore: 10000, icon: '💎', color: '#00D9A5' },
    { name: 'Master Blade', minScore: 25000, icon: '⚔️', color: '#9B5DE5' },
    { name: 'Legend Blade', minScore: 50000, icon: '👑', color: '#F15BB5' },
  ];

  const currentIndex = tiers.findIndex(t => t.name === currentTier.name);
  return currentIndex < tiers.length - 1 ? tiers[currentIndex + 1] : null;
}

function calculateProgress(totalScore: number, currentTier: { minScore: number }, nextTier: { minScore: number } | null) {
  if (!nextTier) return 100;
  const range = nextTier.minScore - currentTier.minScore;
  const progress = totalScore - currentTier.minScore;
  return Math.min(100, Math.max(0, (progress / range) * 100));
}

export default ResultsScreenNew;
