import React from 'react';
import { GiCrossedSwords } from 'react-icons/gi';
import PushWallet from './PushWallet';

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

interface LandingPageProps {
  onStartGame: () => void;
  onMultiplayer: () => void;
  pushWallet: PushWalletState;
}

const LandingPageNew: React.FC<LandingPageProps> = ({ onStartGame, onMultiplayer, pushWallet }) => {
  const handlePlayClick = (e: React.MouseEvent): void => {
    e.preventDefault();
    onStartGame();
  };

  const handleMultiplayerClick = (e: React.MouseEvent): void => {
    e.preventDefault();
    onMultiplayer();
  };

  return (
    <div className="landing-page push-landing">
      {/* Floating Navigation Buttons */}
      <div className="floating-nav-buttons">
        <button onClick={handlePlayClick} className="nav-link play-btn">
          Play Now
        </button>
        <a
          href="https://x.com/Push_Ninja"
          target="_blank"
          rel="noopener noreferrer"
          className="nav-link social-link"
          aria-label="Twitter"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </a>
        <PushWallet pushWallet={pushWallet} />
      </div>

      {/* Background Video - Full Screen */}
      <video
        className="hero-bg-video"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        disablePictureInPicture
      >
        <source src="/background-video.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Video Overlay with Push Chain purple theme */}
      <div className="hero-video-overlay push-overlay"></div>

      {/* Main Content Area */}
      <main className="main-content">
        <div className="hero-section">
          <div className="hero-content">
            <div className="hero-title-section">
              <h1 className="hero-game-title">
                <span className="title-slash"></span>
                <span className="title-er"></span>
              </h1>
              <p className="hero-game-subtitle"></p>
            </div>

            <button className="hero-play-button push-play-btn" onClick={handlePlayClick}>
              <span className="play-icon">▶</span>
              PLAY NOW
            </button>
            <button className="hero-multiplayer-button push-multiplayer-btn" onClick={handleMultiplayerClick}>
              <span className="multiplayer-icon">
                <GiCrossedSwords />
              </span>
              MULTIPLAYER ARENA
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LandingPageNew;
