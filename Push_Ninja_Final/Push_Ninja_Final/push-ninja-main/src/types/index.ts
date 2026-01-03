// Game State Types
export interface GameState {
  screen: 'start' | 'game' | 'results';
  mode: 'classic' | 'arcade' | 'zen' | 'multiplayer' | null;
  score: number;
  lives: number;
  heartHealth: number[];
  maxHealth: number;
  bestScore: number;
  bestScoreClassic: number;
  bestScoreArcade: number;
  bestScoreZen: number;
  totalScore: number;
  gamesPlayed: number;
  isGameRunning: boolean;
  isPaused: boolean;
  isMultiplayer: boolean;  // Flag to identify multiplayer games
  countdownValue: number | null; // 3, 2, 1 countdown value
  totalSlashes: number;
  limesSlashed: number;
  citreaSlashed?: number;
  bombsHit: number;
  gameStartTime: number | null;
  timeRemaining: number | null;
  combo: number;
  maxCombo: number;
  lastSlashTime: number;
}

// Particle Types
export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  decay: number;
  size: number;
  emoji: string;
  isToken: boolean;
}

// Push Chain Wallet Types
export interface PushWalletState {
  isConnected: boolean;
  walletAddress: string | null;
  isConnecting: boolean;
  error: string | null;
  isMinting: boolean;
  chainId: string | null;
  isCorrectNetwork: boolean;
  connectWallet: () => Promise<{ success: boolean; address?: string; error?: string }>;
  disconnectWallet: () => void;
  switchToPushChain: () => Promise<boolean>;
  startGameSession: () => void;
  mintGameNFT: (gameStats: { score: number; slashes: number; combo: number; mode: string }) => Promise<MintResult>;
  nfts: PushNFT[];
  mintedNFT: MintResult | null;
}

export interface MintResult {
  success: boolean;
  tokenId?: string;
  transactionHash?: string;
  error?: string;
}

export interface PushNFT {
  tokenId: string;
  score: number;
  maxCombo: number;
  tokensSliced: number;
  totalSlashes: number;
  timestamp: number;
}

export interface GameStats {
  totalGames: number;
  highScore: number;
  totalScore: number;
}

// Notification Types
export interface PointPopup {
  id: number;
  x: number;
  y: number;
  points: number;
  color: string;
}

export interface CutNotification {
  id: number;
  x: number;
  y: number;
  type: string;
}

export interface HitNotification {
  id: number;
  x: number;
  y: number;
  type: string;
}

export interface MissedTokenNotification {
  id: number;
  x: number;
  y: number;
}

// Tier System Types
export interface Tier {
  name: string;
  minScore: number;
  color: string;
  icon: string;
  canMint: boolean;
}

export interface PlayerStats {
  tier: Tier;
  progress: number;
  gamesPlayed: number;
  totalScore: number;
  bestScore: number;
}

// Mode Selection Types
export interface GameMode {
  id: 'classic' | 'arcade' | 'zen';
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

export interface BestScores {
  classic: number;
  arcade: number;
  zen: number;
}

// Multiplayer Types
export interface MultiplayerGame {
  id: string;
  players: Player[];
  status: 'waiting' | 'playing' | 'finished';
  createdAt: number;
}

export interface Player {
  id: string;
  address: string;
  score: number;
  isReady: boolean;
}

// Component Props Types
export interface StartScreenProps {
  bestScore: number;
  onStartGame: () => void;
}

export interface GameScreenProps {
  gameState: GameState;
  onEndGame: () => void;
  onUpdateScore: (points: number, onComboPopup?: (combo: number, bonus: number) => void) => void;
  onLoseLife: () => void;
  onLoseLiveFromMissedToken: () => void;
  onTogglePause: () => void;
  onCreateParticles: (x: number, y: number, color: string, count: number) => void;
  onCreateScreenFlash: () => void;
  onDecrementTimer: () => void;
  updateParticles: () => void;
  onBackToHome: () => void;
  pushWallet: PushWalletState;
  multiplayerGameId: string | null;
}

export interface ResultsScreenProps {
  gameState: GameState;
  onStartGame: (mode?: string) => void;
  onShowStartScreen: () => void;
  pushWallet: PushWalletState;
  multiplayerGameId: string | null;
  onBackToMultiplayer: () => void;
}

export interface LandingPageProps {
  onStartGame: () => void;
  onMultiplayer: () => void;
  pushWallet: PushWalletState;
}

export interface ModeSelectionProps {
  onSelectMode: (mode: 'classic' | 'arcade' | 'zen') => void;
  onBack: () => void;
  bestScores: BestScores;
}

export interface MultiplayerLobbyProps {
  walletAddress: string | null;
  onStartGame: (gameId: string) => void;
  onBack: () => void;
}

export interface ParticleContainerProps {
  particles: Particle[];
}

export interface TierDisplayProps {
  totalScore: number;
  gamesPlayed: number;
  bestScore: number;
  compact?: boolean;
}

export interface PushWalletProps {
  pushWallet: PushWalletState;
}

export interface AchievementModalProps {
  isOpen: boolean;
  onClose: () => void;
  unlockedAchievements?: Achievement[];
  onMint?: () => void;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  icon: string;
  unlockedAt?: number;
}

// Hook Return Types
export interface UseGameStateReturn {
  gameState: GameState;
  startGame: (mode?: 'classic' | 'arcade' | 'zen') => Promise<void>;
  startMultiplayerCountdown: (callback?: () => void) => void;
  endGame: () => Promise<void>;
  showStartScreen: () => void;
  updateScore: (points: number, onComboPopup?: (combo: number, bonus: number) => void) => void;
  loseLife: () => void;
  loseLiveFromMissedToken: () => void;
  togglePause: () => void;
  createParticles: (x: number, y: number, color: string, count: number) => void;
  createScreenFlash: () => void;
  decrementTimer: () => void;
}
