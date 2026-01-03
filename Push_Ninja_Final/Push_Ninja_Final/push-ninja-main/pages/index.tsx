import React, { useState, useCallback } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import type { Particle } from '@/types/index';

// Dynamic imports to avoid SSR issues with browser-only code
const StartScreen = dynamic(() => import('@/components/StartScreen'), { ssr: false });
const GameScreen = dynamic(() => import('@/components/GameScreen'), { ssr: false });
const ResultsScreenNew = dynamic(() => import('@/components/ResultsScreenNew'), { ssr: false });
const ParticleContainer = dynamic(() => import('@/components/ParticleContainer'), { ssr: false });
const LandingPageNew = dynamic(() => import('@/components/LandingPageNew'), { ssr: false });
const ModeSelection = dynamic(() => import('@/components/ModeSelection'), { ssr: false });
const MultiplayerLobby = dynamic(() => import('@/components/MultiplayerLobby'), { ssr: false });

// Import hooks with dynamic to handle SSR
import { useGameState } from '@/hooks/useGameState';
import { useTaskbarControls } from '@/hooks/useTaskbarControls';
import { usePushWallet } from '@/hooks/usePushWallet';

export default function Home(): React.ReactElement {
  const {
    gameState,
    startGame,
    startMultiplayerCountdown,
    endGame,
    showStartScreen,
    updateScore,
    loseLife,
    loseLiveFromMissedToken,
    togglePause,
    createScreenFlash,
    decrementTimer,
  } = useGameState();

  const pushWallet = usePushWallet();
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showLanding, setShowLanding] = useState<boolean>(true);
  const [showMultiplayer, setShowMultiplayer] = useState<boolean>(false);
  const [showModeSelection, setShowModeSelection] = useState<boolean>(false);
  const [multiplayerGameId, setMultiplayerGameId] = useState<string | null>(null);

  useTaskbarControls(gameState, togglePause);

  const handleCreateParticles = useCallback(
    (x: number, y: number, color: string, count: number): void => {
      const newParticles: Particle[] = [];
      const tokenEmojis = ['⭐', '✨', '💰'];
      const tokenCount = Math.min(count, 8);

      for (let i = 0; i < tokenCount; i++) {
        const angle = (Math.PI * 2 * i) / tokenCount;
        const velocity = 2 + Math.random() * 3;
        const particle: Particle = {
          id: Math.random(),
          x: x,
          y: y,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity - 1,
          color: color,
          life: 1.0,
          decay: 0.02 + Math.random() * 0.01,
          size: 16 + Math.random() * 8,
          emoji: tokenEmojis[Math.floor(Math.random() * tokenEmojis.length)],
          isToken: true,
        };
        newParticles.push(particle);
      }
      setParticles((prev) => [...prev, ...newParticles]);
    },
    []
  );

  const updateParticles = useCallback((): void => {
    setParticles((prev) =>
      prev
        .map((particle) => ({
          ...particle,
          x: particle.x + particle.vx,
          y: particle.y + particle.vy,
          life: particle.life - particle.decay,
          vy: particle.vy + 0.15,
          vx: particle.vx * 0.98,
        }))
        .filter((particle) => particle.life > 0)
    );
  }, []);

  const renderScreen = (): React.ReactNode => {
    switch (gameState.screen) {
      case 'start':
        return <StartScreen bestScore={gameState.bestScore} onStartGame={startGame} />;
      case 'game':
        return (
          <GameScreen
            gameState={gameState}
            onEndGame={endGame}
            onUpdateScore={updateScore}
            onLoseLife={loseLife}
            onLoseLiveFromMissedToken={loseLiveFromMissedToken}
            onTogglePause={togglePause}
            onCreateParticles={handleCreateParticles}
            onCreateScreenFlash={createScreenFlash}
            onDecrementTimer={decrementTimer}
            updateParticles={updateParticles}
            onBackToHome={handleBackToLanding}
            pushWallet={pushWallet}
            multiplayerGameId={multiplayerGameId}
          />
        );
      case 'results':
        return (
          <ResultsScreenNew
            gameState={gameState}
            onStartGame={startGame}
            onShowStartScreen={handleBackToLanding}
            pushWallet={pushWallet}
            multiplayerGameId={multiplayerGameId}
            onBackToMultiplayer={handleBackToMultiplayerLobby}
          />
        );
      default:
        return null;
    }
  };

  const handleStartFromLanding = useCallback((): void => {
    setShowLanding(false);
    setShowModeSelection(true);
  }, []);

  const handleModeSelect = (mode: 'classic' | 'arcade' | 'zen'): void => {
    setShowModeSelection(false);
    startGame(mode);
    if (pushWallet.isConnected) {
      pushWallet.startGameSession();
    }
  };

  const handleBackToLanding = (): void => {
    showStartScreen();
    setShowLanding(true);
    setShowMultiplayer(false);
    setShowModeSelection(false);
    setMultiplayerGameId(null);
  };

  const handleShowMultiplayer = (): void => {
    if (!pushWallet.isConnected) {
      alert('Please connect your wallet to play multiplayer games!');
      return;
    }
    setShowLanding(false);
    setShowMultiplayer(true);
  };

  const handleStartMultiplayerGame = useCallback((gameId: string): void => {
    setMultiplayerGameId(gameId);
    setShowMultiplayer(false);
    // Use synchronized countdown for multiplayer games
    startMultiplayerCountdown();
  }, [startMultiplayerCountdown]);

  const handleBackToMultiplayerLobby = (): void => {
    showStartScreen();
    setShowMultiplayer(true);
  };

  if (showMultiplayer) {
    return (
      <>
        <Head>
          <title>Push Ninja - Multiplayer</title>
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
          />
        </Head>
        <div className="App">
          <div className="beta-tag">
            <span className="beta-text">BETA v0.1</span>
          </div>
          <MultiplayerLobby
            walletAddress={pushWallet.walletAddress}
            onStartGame={handleStartMultiplayerGame}
            onBack={handleBackToLanding}
          />
        </div>
      </>
    );
  }

  if (showModeSelection) {
    return (
      <>
        <Head>
          <title>Push Ninja - Select Mode</title>
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
          />
        </Head>
        <div className="App">
          <div className="beta-tag">
            <span className="beta-text">BETA v0.1</span>
          </div>
          <ModeSelection
            onSelectMode={handleModeSelect}
            onBack={handleBackToLanding}
            bestScores={{
              classic: gameState.bestScoreClassic,
              arcade: gameState.bestScoreArcade,
              zen: gameState.bestScoreZen,
            }}
          />
        </div>
      </>
    );
  }

  if (showLanding) {
    return (
      <>
        <Head>
          <title>Push Ninja - Play & Mint NFTs on Push Chain</title>
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
          />
        </Head>
        <div className="App">
          <div className="beta-tag">
            <span className="beta-text">BETA v0.1</span>
          </div>
          <LandingPageNew
            onStartGame={handleStartFromLanding}
            onMultiplayer={handleShowMultiplayer}
            pushWallet={pushWallet}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Push Ninja - Play & Mint NFTs on Push Chain</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />
      </Head>
      <div className="App">
        {renderScreen()}
        <ParticleContainer particles={particles} />
      </div>
    </>
  );
}
