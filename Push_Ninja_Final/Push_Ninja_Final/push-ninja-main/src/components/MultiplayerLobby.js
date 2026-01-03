import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import multiplayerService from '../services/multiplayerService';
import { GiCrossedSwords, GiTwoCoins, GiTrophyCup, GiLightningBow, GiDiamondHard, GiGamepad, GiCrossedSabres, GiTargetArrows } from 'react-icons/gi';
import { FaCrown, FaChartLine } from 'react-icons/fa';
import { IoMdRefresh } from 'react-icons/io';

// Use environment variable or fallback to localhost
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

const socket = io(SOCKET_URL, {
  autoConnect: false
});

const MultiplayerLobby = ({ walletAddress, onStartGame, onBack }) => {
  const [activeTab, setActiveTab] = useState('create'); // 'create', 'join', 'stats'
  const [selectedTier, setSelectedTier] = useState(null);
  const [selectedRoomType, setSelectedRoomType] = useState('public'); // 'public' or 'private'
  const [availableGames, setAvailableGames] = useState([]);
  const [playerStats, setPlayerStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [joinCode, setJoinCode] = useState(''); // For entering private room code
  const [createdRoomCode, setCreatedRoomCode] = useState(null); // Code shown after creating private room
  const [stakingInProgress, setStakingInProgress] = useState(false); // Track staking transaction status
  const [joiningGameId, setJoiningGameId] = useState(null); // Track which game is being joined (for staking)

  useEffect(() => {
    if (walletAddress) {
      fetchPlayerStats();
    }
    if (activeTab === 'join') {
      fetchAvailableGames();

      // Auto-refresh every 3 seconds when on join tab
      const interval = setInterval(() => {
        fetchAvailableGames();
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [walletAddress, activeTab]);

  // Force initial fetch on component mount
  useEffect(() => {
    fetchAvailableGames();
  }, []);

  // Listen for localStorage changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'push_multiplayer_games') {
        fetchAvailableGames();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // WebSocket connection for real-time updates
  useEffect(() => {
    socket.connect();

    socket.on('connect', () => {
      console.log('🔌 Connected to backend');
    });

    socket.on('game_created', (game) => {
      console.log('🎮 New game created:', game);
      fetchAvailableGames();
    });

    socket.on('game_joined', (game) => {
      console.log('🎮 Game joined:', game);

      // Check if this is YOUR game that was joined (you are player1)
      if (walletAddress && multiplayerService.compareAddresses(game.player1, walletAddress)) {
        showNotification('Opponent joined! Starting match...', 'success');
        // Don't start locally - wait for synchronized countdown from server
        // The joining player will trigger the countdown
      } else {
        fetchAvailableGames();
      }
    });

    // Listen for synchronized countdown start from server
    socket.on('countdown:start', (data) => {
      console.log('⏰ Received countdown:start signal from server', data);
      // Both players receive this at the same time and start their countdown
      if (data.gameId) {
        onStartGame(data.gameId);
      }
    });

    socket.on('games_updated', (games) => {
      console.log('🔄 Games list updated:', games);
      setAvailableGames(games);
    });

    socket.on('game_finished', (data) => {
      console.log('✅ Game finished:', data);
      fetchAvailableGames();
    });

    return () => {
      socket.off('connect');
      socket.off('game_created');
      socket.off('game_joined');
      socket.off('countdown:start');
      socket.off('games_updated');
      socket.off('game_finished');
      socket.disconnect();
    };
  }, [walletAddress, onStartGame]);

  const fetchPlayerStats = async () => {
    const stats = await multiplayerService.getPlayerStats(walletAddress);
    setPlayerStats(stats);
  };

  const fetchAvailableGames = async () => {
    const games = await multiplayerService.getAvailableGames();
    setAvailableGames(games);
  };

  const showNotification = (message, type = 'info') => {
    // Ensure message is a string, not an object
    const displayMessage = typeof message === 'string'
      ? message
      : (message?.message || message?.error || 'An error occurred');
    setNotification({ message: displayMessage, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleCreateGame = async () => {
    if (!selectedTier) {
      showNotification('Please select a bet tier', 'error');
      return;
    }

    setLoading(true);
    setStakingInProgress(true);
    setCreatedRoomCode(null);

    // Step 1: Generate game ID first (needed for stake tracking)
    const gameId = Date.now();

    // Step 2: Stake tokens BEFORE creating game
    showNotification(`Staking ${selectedTier.amount} PUSH... Please confirm in MetaMask`, 'info');
    const stakeResult = await multiplayerService.stakeForGame(selectedTier.id, gameId);

    if (!stakeResult.success) {
      showNotification(`Staking failed: ${stakeResult.error}`, 'error');
      setLoading(false);
      setStakingInProgress(false);
      return;
    }

    showNotification(`Stake confirmed! Creating game...`, 'success');

    // Step 3: Create game in database (only after successful stake)
    const result = await multiplayerService.createGame(selectedTier.id, selectedRoomType, {
      txHash: stakeResult.transactionHash
    });
    setStakingInProgress(false);

    if (result.success) {
      // Join the game room so we receive the countdown broadcast when opponent joins
      socket.emit('join:game', { gameId: result.gameId, playerAddress: walletAddress });
      // Emit that we're ready (completed staking)
      socket.emit('game:playerReady', { gameId: result.gameId, playerAddress: walletAddress });

      if (result.isPrivate && result.roomCode) {
        // Show room code for private games
        setCreatedRoomCode(result.roomCode);
        showNotification(`Private game created! Share the code: ${result.roomCode}`, 'success');
      } else {
        showNotification(`Game created! Waiting for opponent...`, 'success');
        setTimeout(async () => {
          await fetchAvailableGames();
          setActiveTab('join');
        }, 1000);
      }
      await fetchPlayerStats();
    } else {
      showNotification(`Failed to create game: ${result.error}`, 'error');
    }
    setLoading(false);
  };

  const handleJoinGame = async (gameId, betTierId) => {
    setLoading(true);
    setStakingInProgress(true);
    setJoiningGameId(gameId);

    // Step 1: Get tier info for stake amount
    const tierInfo = multiplayerService.getBetTiers().find(t => t.id === betTierId);
    if (!tierInfo) {
      showNotification('Could not determine stake amount', 'error');
      setLoading(false);
      setStakingInProgress(false);
      setJoiningGameId(null);
      return;
    }

    // Step 2: Stake tokens BEFORE joining (uses joinGame on escrow if deployed)
    showNotification(`Staking ${tierInfo.amount} PUSH... Please confirm in MetaMask`, 'info');
    const stakeResult = await multiplayerService.stakeForJoiningGame(betTierId, gameId);

    if (!stakeResult.success) {
      showNotification(`Staking failed: ${stakeResult.error}`, 'error');
      setLoading(false);
      setStakingInProgress(false);
      setJoiningGameId(null);
      return;
    }

    showNotification(`Stake confirmed! Joining game...`, 'success');

    // Step 3: Join game in database (only after successful stake)
    const result = await multiplayerService.joinGame(gameId, {
      txHash: stakeResult.transactionHash
    });
    setStakingInProgress(false);
    setJoiningGameId(null);

    if (result.success) {
      showNotification('Joined game! Starting match...', 'success');
      // Join the game room first so we receive the countdown broadcast
      socket.emit('join:game', { gameId: gameId.toString(), playerAddress: walletAddress });
      // Emit that we're ready (completed staking) - server will start countdown when both players ready
      setTimeout(() => {
        socket.emit('game:playerReady', { gameId: gameId.toString(), playerAddress: walletAddress });
      }, 500);
    } else {
      showNotification(`Failed to join game: ${result.error}`, 'error');
    }
    setLoading(false);
  };

  const handleJoinByCode = async () => {
    if (!joinCode || joinCode.length < 6) {
      showNotification('Please enter a valid 6-character room code', 'error');
      return;
    }

    setLoading(true);
    setStakingInProgress(true);

    // First, look up the game to get the bet tier
    const gameId = await multiplayerService.findGameByRoomCode(joinCode.toUpperCase());

    if (!gameId) {
      showNotification('Room code not found or game no longer available', 'error');
      setLoading(false);
      setStakingInProgress(false);
      return;
    }

    // Get game details directly by ID (since private games aren't in getAvailableGames)
    const game = await multiplayerService.getGame(gameId);

    if (!game) {
      showNotification('Game not found or no longer available', 'error');
      setLoading(false);
      setStakingInProgress(false);
      return;
    }

    // Get tier from game's bet amount
    const betTiers = multiplayerService.getBetTiers();
    const gameBetAmount = game.bet_amount?.toString() || '0';
    const tierInfo = betTiers.find(t => t.wei === gameBetAmount) || betTiers[0];

    // Step 2: Stake tokens BEFORE joining (uses joinGame on escrow if deployed)
    showNotification(`Staking ${tierInfo.amount} PUSH... Please confirm in MetaMask`, 'info');
    const stakeResult = await multiplayerService.stakeForJoiningGame(tierInfo.id, gameId);

    if (!stakeResult.success) {
      showNotification(`Staking failed: ${stakeResult.error}`, 'error');
      setLoading(false);
      setStakingInProgress(false);
      return;
    }

    showNotification(`Stake confirmed! Joining game...`, 'success');

    // Step 3: Join game
    const result = await multiplayerService.joinGameByCode(joinCode, {
      txHash: stakeResult.transactionHash
    });
    setStakingInProgress(false);

    if (result.success && result.game) {
      showNotification('Joined game! Starting match...', 'success');
      // Join the game room first so we receive the countdown broadcast
      socket.emit('join:game', { gameId: result.game.game_id.toString(), playerAddress: walletAddress });
      // Emit that we're ready (completed staking) - server will start countdown when both players ready
      setTimeout(() => {
        socket.emit('game:playerReady', { gameId: result.game.game_id.toString(), playerAddress: walletAddress });
      }, 500);
    } else {
      showNotification(`Failed to join: ${result.error}`, 'error');
    }
    setLoading(false);
  };

  const betTiers = multiplayerService.getBetTiers();

  // Debug: Log bet tiers to console
  console.log('🪙 Bet Tiers Data:', betTiers);

  return (
    <div className="multiplayer-lobby">
      {/* Animated Background */}
      <div className="lobby-bg-animation">
        <div className="floating-icon icon-1"><GiCrossedSwords /></div>
        <div className="floating-icon icon-2"><GiTwoCoins /></div>
        <div className="floating-icon icon-3"><GiTrophyCup /></div>
        <div className="floating-icon icon-4"><GiLightningBow /></div>
        <div className="floating-icon icon-5"><GiDiamondHard /></div>
        <div className="floating-icon icon-6"><GiGamepad /></div>
      </div>

      {notification && (
        <div className={`lobby-notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      {/* Staking Transaction Overlay */}
      {stakingInProgress && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.9)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          flexDirection: 'column',
          gap: '1.5rem'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid rgba(0, 217, 165, 0.3)',
            borderTopColor: '#00D9A5',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <div style={{
            textAlign: 'center',
            color: '#fff'
          }}>
            <div style={{
              fontSize: '1.8rem',
              fontWeight: 700,
              marginBottom: '0.5rem',
              color: '#00D9A5'
            }}>
              💰 Staking PUSH Tokens
            </div>
            <div style={{
              fontSize: '1rem',
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: '1rem'
            }}>
              Please confirm the transaction in MetaMask
            </div>
            <div style={{
              fontSize: '0.85rem',
              color: 'rgba(255, 255, 255, 0.5)'
            }}>
              This stake is required to enter the match
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Header */}
      <div className="lobby-header">
        <button className="lobby-back-btn" onClick={onBack}>
          <span className="back-arrow">←</span>
          <span className="back-text">BACK</span>
        </button>
        <div className="wallet-badge">
          {multiplayerService.formatAddress(walletAddress)}
        </div>
      </div>

      {/* Main Title with Slash Effect */}
      <div className="lobby-title-container">
        <h1 className="lobby-main-title">
          <span className="title-text"><GiCrossedSwords /> MULTIPLAYER ARENA</span>
          <div className="title-slash"></div>
        </h1>
        <p className="lobby-subtitle">COMPETE FOR REAL STAKES</p>
      </div>

      <div className="lobby-content-wrapper">
        {/* Tabs */}
        <div className="lobby-tabs">
          <button
            className={`lobby-tab ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            <span className="tab-icon"><GiCrossedSabres /></span>
            <span className="tab-text">Create</span>
          </button>
          <button
            className={`lobby-tab ${activeTab === 'join' ? 'active' : ''}`}
            onClick={() => setActiveTab('join')}
          >
            <span className="tab-icon"><GiTargetArrows /></span>
            <span className="tab-text">Join</span>
          </button>
          <button
            className={`lobby-tab ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            <span className="tab-icon"><GiTrophyCup /></span>
            <span className="tab-text">Stats</span>
          </button>
        </div>

        <div className="lobby-content">
          {activeTab === 'create' && (
            <div className="create-game-section">
              <h2 className="section-title">Choose Your Stake</h2>
              <p className="section-description">Winner takes all! Select your bet tier to create a new game.</p>

              <div className="bet-tiers-grid">
                {betTiers.map((tier, index) => (
                  <div
                    key={tier.id}
                    className={`bet-tier-card ${selectedTier?.id === tier.id ? 'selected' : ''}`}
                    onClick={() => setSelectedTier(tier)}
                    style={{
                      animationDelay: `${index * 0.1}s`,
                      borderColor: selectedTier?.id === tier.id ? tier.borderColor : 'rgba(255, 255, 255, 0.1)',
                      boxShadow: selectedTier?.id === tier.id ? `0 0 40px ${tier.glowColor}` : 'none'
                    }}
                  >
                    <div
                      className="tier-glow"
                      style={{
                        background: `linear-gradient(135deg, ${tier.borderColor} 0%, ${tier.color} 100%)`,
                        opacity: selectedTier?.id === tier.id ? 0.5 : 0
                      }}
                    ></div>
                    <div className="tier-content">
                      <div className="tier-icon"><GiTwoCoins /></div>
                      <div className="tier-label" style={{ color: tier.borderColor }}>{tier.label}</div>
                      <div className="tier-token-name" style={{ color: tier.color, fontSize: '14px', marginTop: '4px' }}>
                        {tier.tokenName} ({tier.token})
                      </div>
                      <div className="tier-amount">{tier.amount} {tier.token}</div>
                      <div className="tier-prize"><GiTrophyCup /> Win: {(tier.amount * 1.98).toFixed(4)} {tier.token}</div>
                      <div className="tier-description">{tier.description}</div>
                    </div>
                    <div
                      className="tier-slash"
                      style={{
                        background: `linear-gradient(90deg, transparent, ${tier.glowColor}, transparent)`
                      }}
                    ></div>
                  </div>
                ))}
              </div>

              {/* Room Type Selector */}
              <div className="room-type-selector" style={{
                display: 'flex',
                gap: '1rem',
                marginTop: '1.5rem',
                marginBottom: '1rem',
                justifyContent: 'center'
              }}>
                <button
                  className={`room-type-btn ${selectedRoomType === 'public' ? 'active' : ''}`}
                  onClick={() => setSelectedRoomType('public')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    border: selectedRoomType === 'public' ? '2px solid #00D9A5' : '2px solid rgba(255,255,255,0.2)',
                    background: selectedRoomType === 'public' ? 'rgba(0, 217, 165, 0.15)' : 'transparent',
                    color: selectedRoomType === 'public' ? '#00D9A5' : '#888',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    transition: 'all 0.3s ease'
                  }}
                >
                  🌐 Public Room
                </button>
                <button
                  className={`room-type-btn ${selectedRoomType === 'private' ? 'active' : ''}`}
                  onClick={() => setSelectedRoomType('private')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    border: selectedRoomType === 'private' ? '2px solid #F15BB5' : '2px solid rgba(255,255,255,0.2)',
                    background: selectedRoomType === 'private' ? 'rgba(241, 91, 181, 0.15)' : 'transparent',
                    color: selectedRoomType === 'private' ? '#F15BB5' : '#888',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    transition: 'all 0.3s ease'
                  }}
                >
                  🔒 Private Room
                </button>
              </div>

              {selectedRoomType === 'private' && (
                <p style={{ color: '#888', fontSize: '0.85rem', textAlign: 'center', marginBottom: '1rem' }}>
                  A unique join code will be generated for your friend to join
                </p>
              )}

              {/* Show created room code */}
              {createdRoomCode && (
                <div style={{
                  background: 'rgba(241, 91, 181, 0.1)',
                  border: '2px solid #F15BB5',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  marginBottom: '1rem',
                  textAlign: 'center'
                }}>
                  <p style={{ color: '#F15BB5', marginBottom: '0.5rem', fontWeight: 600 }}>
                    🔑 Room Code (Share with your friend):
                  </p>
                  <div style={{
                    fontSize: '2rem',
                    fontWeight: 800,
                    color: '#fff',
                    letterSpacing: '0.3em',
                    fontFamily: 'monospace',
                    background: 'rgba(0,0,0,0.3)',
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    display: 'inline-block'
                  }}>
                    {createdRoomCode}
                  </div>
                  <p style={{ color: '#888', fontSize: '0.8rem', marginTop: '0.75rem' }}>
                    Waiting for opponent to join...
                  </p>
                </div>
              )}

              <button
                className="create-game-btn"
                onClick={handleCreateGame}
                disabled={!selectedTier || loading}
                style={selectedTier ? {
                  background: `linear-gradient(135deg, ${selectedTier.borderColor} 0%, ${selectedTier.color} 100%)`,
                  boxShadow: `0 8px 32px ${selectedTier.glowColor}`
                } : {}}
              >
                {loading ? (
                  <>
                    <span className="btn-spinner"></span>
                    Creating Game...
                  </>
                ) : (
                  <>
                    {selectedRoomType === 'private' ? '🔒 Create Private Game' : '🌐 Create Public Game'} - Stake {selectedTier?.amount || '?'} PUSH
                  </>
                )}
              </button>
            </div>
          )}

          {activeTab === 'join' && (
            <div className="join-game-section">
              <h2 className="section-title">Join a Game</h2>
              <p className="section-description">Join a public game or enter a private room code!</p>

              {/* Join by Code Section */}
              <div style={{
                background: 'rgba(241, 91, 181, 0.1)',
                border: '1px solid rgba(241, 91, 181, 0.3)',
                borderRadius: '12px',
                padding: '1rem',
                marginBottom: '1.5rem'
              }}>
                <p style={{ color: '#F15BB5', marginBottom: '0.75rem', fontWeight: 600, fontSize: '0.95rem' }}>
                  🔒 Join Private Room
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Enter 6-character code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    style={{
                      flex: 1,
                      padding: '0.75rem 1rem',
                      borderRadius: '8px',
                      border: '2px solid rgba(255,255,255,0.2)',
                      background: 'rgba(0,0,0,0.3)',
                      color: '#fff',
                      fontSize: '1rem',
                      fontFamily: 'monospace',
                      letterSpacing: '0.2em',
                      textTransform: 'uppercase'
                    }}
                  />
                  <button
                    onClick={handleJoinByCode}
                    disabled={loading || joinCode.length < 6}
                    style={{
                      padding: '0.75rem 1.5rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: joinCode.length === 6 ? 'linear-gradient(135deg, #F15BB5, #9B5DE5)' : '#333',
                      color: '#fff',
                      fontWeight: 600,
                      cursor: joinCode.length === 6 ? 'pointer' : 'not-allowed',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Join
                  </button>
                </div>
              </div>

              <h3 style={{ color: '#00D9A5', marginBottom: '1rem', fontSize: '1.1rem' }}>
                🌐 Public Games
              </h3>

              <button
                className="refresh-btn"
                onClick={() => fetchAvailableGames()}
                disabled={loading}
              >
                <span className="refresh-icon"><IoMdRefresh /></span>
                Refresh Games
              </button>

              <div className="available-games">
                {availableGames.length === 0 ? (
                  <div className="no-games-state">
                    <div className="no-games-icon"><GiGamepad /></div>
                    <p className="no-games-text">No games available</p>
                    <p className="no-games-hint">Create your own game to get started!</p>
                  </div>
                ) : (
                  <div className="games-list">
                    {availableGames.map((game, index) => {
                      const betAmountWei = game.bet_amount.toString();
                      const tier = betTiers.find(t => t.wei === betAmountWei);

                      const isOwnGame = multiplayerService.compareAddresses(game.player1, walletAddress);
                      const isDisabled = loading || isOwnGame;

                      return (
                        <div
                          key={index}
                          className="game-card"
                          style={{
                            borderColor: tier?.borderColor || 'rgba(255, 255, 255, 0.1)',
                            boxShadow: tier ? `0 4px 20px ${tier.glowColor}` : 'none'
                          }}
                        >
                          <div
                            className="card-glow-effect"
                            style={{
                              background: tier ? `linear-gradient(135deg, ${tier.borderColor} 0%, ${tier.color} 100%)` : 'none'
                            }}
                          ></div>
                          <div className="game-card-content">
                            <div className="game-header">
                              <span
                                className="tier-badge"
                                style={{
                                  background: tier?.borderColor || '#FFD700',
                                  color: '#000',
                                  fontWeight: 'bold'
                                }}
                              >
                                {tier?.label || 'Unknown'}
                              </span>
                              <span className="game-status">🟢 Open</span>
                            </div>
                            <div className="game-info">
                              <div className="info-row">
                                <span className="info-icon"><GiTwoCoins /></span>
                                <span className="info-label">Stake:</span>
                                <span className="info-value" style={{ color: tier?.color || '#fff' }}>
                                  {tier?.amount || (Number(betAmountWei) / 1e18)} {tier?.token || 'PUSH'}
                                </span>
                              </div>
                              <div className="info-row prize">
                                <span className="info-icon"><GiTrophyCup /></span>
                                <span className="info-label">Prize:</span>
                                <span className="info-value gold" style={{ color: tier?.borderColor || '#FFD700' }}>
                                  {((tier?.amount || (Number(betAmountWei) / 1e18)) * 1.98).toFixed(4)} {tier?.token || 'PUSH'}
                                </span>
                              </div>
                              <div className="info-row">
                                <span className="info-icon"><GiGamepad /></span>
                                <span className="info-label">Host:</span>
                                <span className="info-value host">{multiplayerService.formatAddress(game.player1)}</span>
                              </div>
                            </div>
                          </div>
                          <button
                            className="join-game-btn"
                            onClick={() => handleJoinGame(game.game_id, tier?.id || 1)}
                            disabled={isDisabled}
                            style={tier && !isDisabled ? {
                              background: `linear-gradient(135deg, ${tier.borderColor} 0%, ${tier.color} 100%)`,
                              boxShadow: `0 4px 16px ${tier.glowColor}`
                            } : {}}
                          >
                            {isOwnGame ? (
                              <>
                                <span className="btn-icon"><GiGamepad /></span>
                                Your Game
                              </>
                            ) : (
                              <>
                                <span className="btn-icon"><GiCrossedSwords /></span>
                                Join Battle
                                <span className="btn-arrow">→</span>
                              </>
                            )}
                          </button>
                          <div className="card-slash-effect"></div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="stats-section">
              <h2 className="section-title">Your Statistics</h2>

              {playerStats ? (
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-glow"></div>
                    <div className="stat-content">
                      <div className="stat-icon"><GiGamepad /></div>
                      <div className="stat-value">{playerStats.gamesPlayed}</div>
                      <div className="stat-label">Games Played</div>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-glow"></div>
                    <div className="stat-content">
                      <div className="stat-icon"><GiTrophyCup /></div>
                      <div className="stat-value">{playerStats.gamesWon}</div>
                      <div className="stat-label">Games Won</div>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-glow"></div>
                    <div className="stat-content">
                      <div className="stat-icon"><GiTargetArrows /></div>
                      <div className="stat-value">{playerStats?.winRate || 0}%</div>
                      <div className="stat-label">Win Rate</div>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-glow"></div>
                    <div className="stat-content">
                      <div className="stat-icon"><GiTwoCoins /></div>
                      <div className="stat-value">{playerStats?.totalWagered?.toFixed(4) || '0.0000'}</div>
                      <div className="stat-label">Total Wagered (PUSH)</div>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-glow"></div>
                    <div className="stat-content">
                      <div className="stat-icon"><GiDiamondHard /></div>
                      <div className="stat-value" style={{ color: '#00D9A5' }}>
                        {playerStats?.totalWinnings?.toFixed(4) || '0.0000'}
                      </div>
                      <div className="stat-label">Total Winnings (PUSH)</div>
                    </div>
                  </div>

                  <div className="stat-card" style={{
                    borderColor: (playerStats.totalWinnings - playerStats.totalWagered) >= 0 ? '#00D9A5' : '#F15BB5'
                  }}>
                    <div className="stat-glow" style={{
                      background: (playerStats.totalWinnings - playerStats.totalWagered) >= 0
                        ? 'rgba(0, 217, 165, 0.2)'
                        : 'rgba(241, 91, 181, 0.2)'
                    }}></div>
                    <div className="stat-content">
                      <div className="stat-icon"><FaChartLine /></div>
                      <div className="stat-value" style={{
                        color: (playerStats.totalWinnings - playerStats.totalWagered) >= 0 ? '#00D9A5' : '#F15BB5',
                        fontSize: '1.8rem'
                      }}>
                        {(playerStats.totalWinnings - playerStats.totalWagered) >= 0 ? '+' : ''}
                        {(playerStats.totalWinnings - playerStats.totalWagered).toFixed(4)}
                      </div>
                      <div className="stat-label">
                        Net Profit (PUSH) {(playerStats.totalWinnings - playerStats.totalWagered) >= 0 ? '📈' : '📉'}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="loading-stats">
                  <div className="loading-spinner"></div>
                  <p>Loading stats...</p>
                </div>
              )}

              {/* How Prizes Work Section */}
              <div style={{
                marginTop: '2.5rem',
                background: 'linear-gradient(180deg, rgba(30, 30, 45, 0.95) 0%, rgba(20, 20, 35, 0.98) 100%)',
                borderRadius: '20px',
                padding: '2rem',
                border: '2px solid rgba(255, 215, 0, 0.15)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
              }}>
                <h3 style={{
                  color: '#FFD700',
                  fontSize: '1.5rem',
                  fontFamily: 'Orbitron, Impact, sans-serif',
                  marginBottom: '1.5rem',
                  textAlign: 'center',
                  letterSpacing: '2px',
                  textShadow: '0 0 20px rgba(255, 215, 0, 0.4)'
                }}>
                  💰 HOW PRIZES WORK
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '1.5rem'
                }}>
                  {/* Normal Win Card */}
                  <div style={{
                    background: 'rgba(0, 217, 165, 0.08)',
                    border: '2px solid rgba(0, 217, 165, 0.3)',
                    borderRadius: '16px',
                    padding: '1.75rem',
                    textAlign: 'center',
                    transition: 'all 0.3s ease'
                  }}>
                    <div style={{
                      fontSize: '3rem',
                      marginBottom: '0.75rem'
                    }}>🏆</div>
                    <div style={{
                      color: '#00D9A5',
                      fontWeight: 700,
                      fontSize: '1.25rem',
                      marginBottom: '0.75rem',
                      fontFamily: 'Orbitron, sans-serif',
                      letterSpacing: '1px'
                    }}>
                      Normal Win
                    </div>
                    <div style={{
                      color: 'rgba(255,255,255,0.85)',
                      fontSize: '1rem',
                      lineHeight: '1.6'
                    }}>
                      Winner receives <strong style={{ color: '#00D9A5', fontSize: '1.1rem' }}>98%</strong> of the total pool
                    </div>
                    <div style={{
                      marginTop: '0.75rem',
                      color: '#00D9A5',
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      fontFamily: 'Orbitron, sans-serif'
                    }}>
                      1.98x Stake
                    </div>
                  </div>

                  {/* Forfeit Win Card */}
                  <div style={{
                    background: 'rgba(241, 91, 181, 0.08)',
                    border: '2px solid rgba(241, 91, 181, 0.3)',
                    borderRadius: '16px',
                    padding: '1.75rem',
                    textAlign: 'center',
                    transition: 'all 0.3s ease'
                  }}>
                    <div style={{
                      fontSize: '3rem',
                      marginBottom: '0.75rem'
                    }}>🏳️</div>
                    <div style={{
                      color: '#F15BB5',
                      fontWeight: 700,
                      fontSize: '1.25rem',
                      marginBottom: '0.75rem',
                      fontFamily: 'Orbitron, sans-serif',
                      letterSpacing: '1px'
                    }}>
                      Forfeit Win
                    </div>
                    <div style={{
                      color: 'rgba(255,255,255,0.85)',
                      fontSize: '1rem',
                      lineHeight: '1.6'
                    }}>
                      Winner receives <strong style={{ color: '#F15BB5', fontSize: '1.1rem' }}>1.5x</strong> their stake
                    </div>
                    <div style={{
                      marginTop: '0.75rem',
                      color: '#F15BB5',
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      fontFamily: 'Orbitron, sans-serif'
                    }}>
                      Opponent Forfeits
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MultiplayerLobby;
