// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title MultiplayerEscrow
 * @dev Escrow contract for Push Ninja multiplayer game stakes
 * Holds player stakes and distributes prizes to winners
 */
contract MultiplayerEscrow is Ownable, ReentrancyGuard {
    
    // Game states
    uint8 public constant STATE_WAITING = 0;
    uint8 public constant STATE_IN_PROGRESS = 1;
    uint8 public constant STATE_FINISHED = 2;
    uint8 public constant STATE_CANCELLED = 3;
    uint8 public constant STATE_FORFEITED = 4;

    // Platform fee: 2% (200 basis points)
    uint256 public platformFeeBps = 200;
    uint256 public constant MAX_FEE_BPS = 1000; // Max 10%
    
    // Accumulated platform fees
    uint256 public accumulatedFees;

    // Oracle address allowed to finish games
    address public oracle;

    struct Game {
        uint256 gameId;
        uint256 betAmount;
        address player1;
        address player2;
        uint256 player1Score;
        uint256 player2Score;
        address winner;
        uint8 state;
        uint256 createdAt;
        uint256 finishedAt;
    }

    // Mapping from gameId to Game
    mapping(uint256 => Game) public games;
    
    // Track if game exists
    mapping(uint256 => bool) public gameExists;

    // Events
    event GameCreated(uint256 indexed gameId, address indexed player1, uint256 betAmount);
    event GameJoined(uint256 indexed gameId, address indexed player2);
    event GameFinished(uint256 indexed gameId, address indexed winner, uint256 prize, string winType);
    event GameCancelled(uint256 indexed gameId, address indexed player1);
    event GameForfeited(uint256 indexed gameId, address indexed forfeitedBy, address indexed winner);
    event OracleUpdated(address indexed oldOracle, address indexed newOracle);
    event FeesWithdrawn(address indexed to, uint256 amount);

    constructor(address _oracle) Ownable(msg.sender) {
        oracle = _oracle;
    }

    modifier onlyOracle() {
        require(msg.sender == oracle || msg.sender == owner(), "Not authorized");
        _;
    }

    /**
     * @dev Create a new game and deposit stake
     * @param gameId Unique game identifier (from backend)
     */
    function createGame(uint256 gameId) external payable nonReentrant {
        require(!gameExists[gameId], "Game already exists");
        require(msg.value > 0, "Bet amount must be greater than 0");

        games[gameId] = Game({
            gameId: gameId,
            betAmount: msg.value,
            player1: msg.sender,
            player2: address(0),
            player1Score: 0,
            player2Score: 0,
            winner: address(0),
            state: STATE_WAITING,
            createdAt: block.timestamp,
            finishedAt: 0
        });
        
        gameExists[gameId] = true;

        emit GameCreated(gameId, msg.sender, msg.value);
    }

    /**
     * @dev Join an existing game by matching the stake
     * @param gameId Game to join
     */
    function joinGame(uint256 gameId) external payable nonReentrant {
        require(gameExists[gameId], "Game does not exist");
        Game storage game = games[gameId];
        
        require(game.state == STATE_WAITING, "Game not waiting for players");
        require(game.player2 == address(0), "Game already full");
        require(game.player1 != msg.sender, "Cannot join own game");
        require(msg.value == game.betAmount, "Must match bet amount");

        game.player2 = msg.sender;
        game.state = STATE_IN_PROGRESS;

        emit GameJoined(gameId, msg.sender);
    }

    /**
     * @dev Finish a game and distribute prizes (called by oracle/backend)
     * @param gameId Game to finish
     * @param winner Address of the winner
     * @param player1Score Final score of player 1
     * @param player2Score Final score of player 2
     * @param winType Type of win: "score", "elimination", "forfeit", "tie"
     */
    function finishGame(
        uint256 gameId,
        address winner,
        uint256 player1Score,
        uint256 player2Score,
        string calldata winType
    ) external onlyOracle nonReentrant {
        require(gameExists[gameId], "Game does not exist");
        Game storage game = games[gameId];
        
        require(game.state == STATE_IN_PROGRESS, "Game not in progress");
        require(
            winner == game.player1 || winner == game.player2 || winner == address(0),
            "Invalid winner"
        );

        game.player1Score = player1Score;
        game.player2Score = player2Score;
        game.winner = winner;
        game.state = STATE_FINISHED;
        game.finishedAt = block.timestamp;

        uint256 totalPool = game.betAmount * 2;

        if (winner == address(0)) {
            // Tie - refund both players
            (bool success1, ) = game.player1.call{value: game.betAmount}("");
            require(success1, "Refund to player1 failed");
            
            (bool success2, ) = game.player2.call{value: game.betAmount}("");
            require(success2, "Refund to player2 failed");
        } else {
            // Calculate fee and prize
            uint256 fee = (totalPool * platformFeeBps) / 10000;
            uint256 prize = totalPool - fee;
            
            accumulatedFees += fee;

            // Transfer prize to winner
            (bool success, ) = winner.call{value: prize}("");
            require(success, "Prize transfer failed");
        }

        emit GameFinished(gameId, winner, winner != address(0) ? (game.betAmount * 2 * (10000 - platformFeeBps)) / 10000 : 0, winType);
    }

    /**
     * @dev Cancel a game before it starts (only player1 can cancel)
     * @param gameId Game to cancel
     */
    function cancelGame(uint256 gameId) external nonReentrant {
        require(gameExists[gameId], "Game does not exist");
        Game storage game = games[gameId];
        
        require(game.state == STATE_WAITING, "Game already started");
        require(game.player1 == msg.sender, "Only creator can cancel");

        game.state = STATE_CANCELLED;
        game.finishedAt = block.timestamp;

        // Refund player1
        (bool success, ) = game.player1.call{value: game.betAmount}("");
        require(success, "Refund failed");

        emit GameCancelled(gameId, msg.sender);
    }

    /**
     * @dev Handle forfeit when a player disconnects (called by oracle)
     * @param gameId Game where forfeit occurred
     * @param forfeitedBy Address of player who forfeited
     */
    function forfeitGame(uint256 gameId, address forfeitedBy) external onlyOracle nonReentrant {
        require(gameExists[gameId], "Game does not exist");
        Game storage game = games[gameId];
        
        require(game.state == STATE_IN_PROGRESS, "Game not in progress");
        require(
            forfeitedBy == game.player1 || forfeitedBy == game.player2,
            "Invalid forfeiter"
        );

        address winner = forfeitedBy == game.player1 ? game.player2 : game.player1;
        
        game.winner = winner;
        game.state = STATE_FORFEITED;
        game.finishedAt = block.timestamp;

        uint256 totalPool = game.betAmount * 2;
        
        // Forfeit penalty: winner gets 1.5x stake, platform gets 0.5x stake
        uint256 forfeitFee = game.betAmount / 2; // 0.5x stake
        uint256 prize = totalPool - forfeitFee;
        
        accumulatedFees += forfeitFee;

        // Transfer prize to winner
        (bool success, ) = winner.call{value: prize}("");
        require(success, "Prize transfer failed");

        emit GameForfeited(gameId, forfeitedBy, winner);
    }

    // View functions

    /**
     * @dev Get game details
     */
    function getGame(uint256 gameId) external view returns (Game memory) {
        require(gameExists[gameId], "Game does not exist");
        return games[gameId];
    }

    /**
     * @dev Get escrow balance for a game
     */
    function getGameEscrowBalance(uint256 gameId) external view returns (uint256) {
        if (!gameExists[gameId]) return 0;
        Game memory game = games[gameId];
        
        if (game.state == STATE_WAITING) {
            return game.betAmount;
        } else if (game.state == STATE_IN_PROGRESS) {
            return game.betAmount * 2;
        }
        return 0;
    }

    // Admin functions

    /**
     * @dev Update oracle address
     */
    function setOracle(address _oracle) external onlyOwner {
        address oldOracle = oracle;
        oracle = _oracle;
        emit OracleUpdated(oldOracle, _oracle);
    }

    /**
     * @dev Update platform fee (max 10%)
     */
    function setPlatformFee(uint256 _feeBps) external onlyOwner {
        require(_feeBps <= MAX_FEE_BPS, "Fee too high");
        platformFeeBps = _feeBps;
    }

    /**
     * @dev Withdraw accumulated platform fees
     */
    function withdrawFees(address to) external onlyOwner nonReentrant {
        require(accumulatedFees > 0, "No fees to withdraw");
        
        uint256 amount = accumulatedFees;
        accumulatedFees = 0;
        
        (bool success, ) = to.call{value: amount}("");
        require(success, "Withdrawal failed");
        
        emit FeesWithdrawn(to, amount);
    }

    /**
     * @dev Emergency rescue for stuck funds (only owner, for edge cases)
     */
    function emergencyRescue(address to, uint256 amount) external onlyOwner nonReentrant {
        require(amount <= address(this).balance - accumulatedFees, "Cannot rescue escrowed funds");
        (bool success, ) = to.call{value: amount}("");
        require(success, "Rescue failed");
    }

    // Receive function to accept ETH
    receive() external payable {}
}
