import { useState, useCallback, useRef } from 'react';
import type { GameState, UseGameStateReturn } from '@/types/index';

const getStorageItem = (key: string, defaultValue: number = 0): number => {
  if (typeof window === 'undefined') return defaultValue;
  return parseInt(localStorage.getItem(key) || '0') || defaultValue;
};

const setStorageItem = (key: string, value: number): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, value.toString());
  }
};

export const useGameState = (): UseGameStateReturn => {
  const lastPenaltyTime = useRef<number>(0);

  const [gameState, setGameState] = useState<GameState>({
    screen: 'start',
    mode: null,
    score: 0,
    lives: 3,
    heartHealth: [100, 100, 100],
    maxHealth: 100,
    bestScore: getStorageItem('fruitNinjaBestScore'),
    bestScoreClassic: getStorageItem('bestScoreClassic'),
    bestScoreArcade: getStorageItem('bestScoreArcade'),
    bestScoreZen: getStorageItem('bestScoreZen'),
    totalScore: getStorageItem('totalScore'),
    gamesPlayed: getStorageItem('gamesPlayed'),
    isGameRunning: false,
    isPaused: false,
    isMultiplayer: false,
    countdownValue: null,
    totalSlashes: 0,
    limesSlashed: 0,
    bombsHit: 0,
    gameStartTime: null,
    timeRemaining: null,
    combo: 0,
    maxCombo: 0,
    lastSlashTime: 0,
  });

  const startGame = useCallback(async (mode: 'classic' | 'arcade' | 'zen' = 'classic'): Promise<void> => {
    lastPenaltyTime.current = 0;

    let initialLives = 3;
    let initialTime: number | null = null;

    if (mode === 'arcade') {
      initialLives = 3;
      initialTime = 60;
    } else if (mode === 'zen') {
      initialLives = 999;
      initialTime = 90;
    }

    setGameState((prev) => ({
      ...prev,
      screen: 'game',
      mode: mode,
      score: 0,
      lives: initialLives,
      heartHealth: [100, 100, 100],
      isGameRunning: true,
      isPaused: false,
      totalSlashes: 0,
      citreaSlashed: 0,
      bombsHit: 0,
      gameStartTime: Date.now(),
      timeRemaining: initialTime,
      combo: 0,
      maxCombo: 0,
      lastSlashTime: 0,
    }));
  }, []);

  // Start multiplayer game with synchronized countdown
  const startMultiplayerCountdown = useCallback((callback?: () => void): void => {
    lastPenaltyTime.current = 0;

    // First, show the game screen with countdown
    setGameState((prev) => ({
      ...prev,
      screen: 'game',
      mode: 'classic',
      score: 0,
      lives: 3,
      heartHealth: [100, 100, 100],
      isGameRunning: false, // Not running yet - wait for countdown
      isPaused: false,
      isMultiplayer: true,
      countdownValue: 3, // Start at 3
      totalSlashes: 0,
      citreaSlashed: 0,
      bombsHit: 0,
      gameStartTime: null,
      timeRemaining: null,
      combo: 0,
      maxCombo: 0,
      lastSlashTime: 0,
    }));

    // Run the 3-2-1 countdown
    let count = 3;
    const countdownInterval = setInterval(() => {
      count--;
      if (count > 0) {
        setGameState((prev) => ({
          ...prev,
          countdownValue: count,
        }));
      } else if (count === 0) {
        // Show "GO!"
        setGameState((prev) => ({
          ...prev,
          countdownValue: 0,
        }));
      } else {
        // Countdown finished - start the game!
        clearInterval(countdownInterval);
        setGameState((prev) => ({
          ...prev,
          countdownValue: null,
          isGameRunning: true,
          gameStartTime: Date.now(),
        }));
        if (callback) callback();
      }
    }, 1000);
  }, []);

  const endGame = useCallback(async (): Promise<void> => {
    setGameState((prev) => {
      const updatedState = { ...prev };

      if (prev.mode === 'classic') {
        const newBest = Math.max(prev.score, prev.bestScoreClassic);
        if (newBest > prev.bestScoreClassic) {
          setStorageItem('bestScoreClassic', newBest);
          updatedState.bestScoreClassic = newBest;
        }
      } else if (prev.mode === 'arcade') {
        const newBest = Math.max(prev.score, prev.bestScoreArcade);
        if (newBest > prev.bestScoreArcade) {
          setStorageItem('bestScoreArcade', newBest);
          updatedState.bestScoreArcade = newBest;
        }
      } else if (prev.mode === 'zen') {
        const newBest = Math.max(prev.score, prev.bestScoreZen);
        if (newBest > prev.bestScoreZen) {
          setStorageItem('bestScoreZen', newBest);
          updatedState.bestScoreZen = newBest;
        }
      }

      const newBestScore = prev.score > prev.bestScore ? prev.score : prev.bestScore;
      if (newBestScore > prev.bestScore) {
        setStorageItem('fruitNinjaBestScore', newBestScore);
        updatedState.bestScore = newBestScore;
      }

      const newTotalScore = prev.totalScore + prev.score;
      const newGamesPlayed = prev.gamesPlayed + 1;
      setStorageItem('totalScore', newTotalScore);
      setStorageItem('gamesPlayed', newGamesPlayed);
      updatedState.totalScore = newTotalScore;
      updatedState.gamesPlayed = newGamesPlayed;

      return {
        ...updatedState,
        screen: 'results' as const,
        isGameRunning: false,
        isPaused: false,
        bestScore: newBestScore,
      };
    });
  }, []);

  const showStartScreen = useCallback((): void => {
    setGameState((prev) => ({
      ...prev,
      screen: 'start',
    }));
  }, []);

  const updateScore = useCallback(
    (points: number, onComboPopup?: (combo: number, bonus: number) => void): void => {
      setGameState((prev) => {
        const now = Date.now();
        const timeSinceLastSlash = now - prev.lastSlashTime;

        const newCombo = timeSinceLastSlash < 2000 ? prev.combo + 1 : 1;
        const comboMultiplier = Math.min(Math.floor(newCombo / 3) + 1, 5);
        const bonusPoints = points * (comboMultiplier - 1);

        if (comboMultiplier > 1 && bonusPoints > 0 && onComboPopup) {
          onComboPopup(newCombo, bonusPoints);
        }

        return {
          ...prev,
          score: prev.score + points + bonusPoints,
          citreaSlashed: (prev.citreaSlashed || 0) + 1,
          totalSlashes: prev.totalSlashes + 1,
          combo: newCombo,
          maxCombo: Math.max(prev.maxCombo, newCombo),
          lastSlashTime: now,
        };
      });
    },
    []
  );

  const loseLife = useCallback((): void => {
    setGameState((prev) => {
      if (prev.lives <= 0) return prev;

      const newLives = prev.lives - 1;
      const newHeartHealth = [...prev.heartHealth];

      for (let i = newHeartHealth.length - 1; i >= 0; i--) {
        if (newHeartHealth[i] > 0) {
          newHeartHealth[i] = 0;
          break;
        }
      }

      const newState = {
        ...prev,
        lives: newLives,
        heartHealth: newHeartHealth,
        bombsHit: prev.bombsHit + 1,
        totalSlashes: prev.totalSlashes + 1,
        combo: 0,
      };

      if (newLives <= 0) {
        setTimeout(async () => {
          await endGame();
        }, 1000);
      }

      return newState;
    });
  }, [endGame]);

  const loseLiveFromMissedToken = useCallback((): void => {
    const timestamp = Date.now();

    if (timestamp - lastPenaltyTime.current < 1000) {
      return;
    }

    lastPenaltyTime.current = timestamp;

    setGameState((prev) => {
      if (prev.lives <= 0) {
        return prev;
      }

      const newLives = prev.lives - 1;
      const newHeartHealth = [...prev.heartHealth];

      for (let i = newHeartHealth.length - 1; i >= 0; i--) {
        if (newHeartHealth[i] > 0) {
          newHeartHealth[i] = 0;
          break;
        }
      }

      const newState = {
        ...prev,
        lives: newLives,
        heartHealth: newHeartHealth,
        combo: 0,
      };

      if (newLives <= 0) {
        setTimeout(async () => {
          await endGame();
        }, 1000);
      }

      return newState;
    });
  }, [endGame]);

  const togglePause = useCallback((): void => {
    setGameState((prev) => {
      // Multiplayer games cannot be paused
      if (prev.isMultiplayer) {
        console.log('⚠️ Pause is disabled in multiplayer mode');
        return prev;
      }
      return {
        ...prev,
        isPaused: !prev.isPaused,
      };
    });
  }, []);

  const createParticles = useCallback(
    (x: number, y: number, color: string, count: number): void => {
      console.log('Creating particles:', { x, y, color, count });
    },
    []
  );

  const createScreenFlash = useCallback((): void => {
    if (typeof document === 'undefined') return;

    const flash = document.createElement('div');
    flash.className = 'screen-flash';
    document.body.appendChild(flash);

    setTimeout(() => {
      if (document.body.contains(flash)) {
        document.body.removeChild(flash);
      }
    }, 300);
  }, []);

  const decrementTimer = useCallback((): void => {
    setGameState((prev) => {
      if (prev.timeRemaining === null || prev.timeRemaining <= 0) {
        return prev;
      }

      const newTime = prev.timeRemaining - 1;

      if (newTime <= 0) {
        setTimeout(() => {
          endGame();
        }, 100);
        return {
          ...prev,
          timeRemaining: 0,
        };
      }

      return {
        ...prev,
        timeRemaining: newTime,
      };
    });
  }, [endGame]);

  return {
    gameState,
    startGame,
    startMultiplayerCountdown,
    endGame,
    showStartScreen,
    updateScore,
    loseLife,
    loseLiveFromMissedToken,
    togglePause,
    createParticles,
    createScreenFlash,
    decrementTimer,
  };
};
