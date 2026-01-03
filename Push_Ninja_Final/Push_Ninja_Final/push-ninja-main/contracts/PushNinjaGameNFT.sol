// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

/**
 * @title PushNinjaGameNFT
 * @dev NFT contract for Push Ninja game achievements on Push Chain
 */
contract PushNinjaGameNFT is ERC721, ERC721URIStorage, Ownable {
    using Strings for uint256;

    uint256 private _tokenIdCounter;

    // Game data structure
    struct GameData {
        uint256 score;
        uint256 maxCombo;
        uint256 tokensSlashed;
        string tierName;
        uint256 timestamp;
        address player;
    }

    // Mapping from token ID to game data
    mapping(uint256 => GameData) public gameData;

    // Mapping from player address to their token IDs
    mapping(address => uint256[]) public playerTokens;

    // Events
    event GameNFTMinted(
        uint256 indexed tokenId,
        address indexed player,
        uint256 score,
        uint256 maxCombo,
        uint256 tokensSlashed,
        string tierName
    );

    constructor() ERC721("Push Ninja Game NFT", "PNINJA") Ownable(msg.sender) {}

    /**
     * @dev Mint a new game NFT
     */
    function mintGameNFT(
        uint256 score,
        uint256 maxCombo,
        uint256 tokensSlashed,
        string memory tierName
    ) public returns (uint256) {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        _safeMint(msg.sender, tokenId);

        // Store game data
        gameData[tokenId] = GameData({
            score: score,
            maxCombo: maxCombo,
            tokensSlashed: tokensSlashed,
            tierName: tierName,
            timestamp: block.timestamp,
            player: msg.sender
        });

        // Track player's tokens
        playerTokens[msg.sender].push(tokenId);

        // Generate and set token URI
        string memory uri = generateTokenURI(tokenId);
        _setTokenURI(tokenId, uri);

        emit GameNFTMinted(tokenId, msg.sender, score, maxCombo, tokensSlashed, tierName);

        return tokenId;
    }

    /**
     * @dev Generate on-chain metadata for the NFT
     */
    function generateTokenURI(uint256 tokenId) internal view returns (string memory) {
        GameData memory data = gameData[tokenId];
        
        string memory svg = generateSVG(data);
        
        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name": "Push Ninja #', tokenId.toString(), '",',
                        '"description": "Push Ninja Game Achievement NFT on Push Chain",',
                        '"image": "data:image/svg+xml;base64,', Base64.encode(bytes(svg)), '",',
                        '"attributes": [',
                            '{"trait_type": "Score", "value": ', data.score.toString(), '},',
                            '{"trait_type": "Max Combo", "value": ', data.maxCombo.toString(), '},',
                            '{"trait_type": "Tokens Slashed", "value": ', data.tokensSlashed.toString(), '},',
                            '{"trait_type": "Tier", "value": "', data.tierName, '"},',
                            '{"trait_type": "Timestamp", "value": ', data.timestamp.toString(), '}',
                        ']}'
                    )
                )
            )
        );

        return string(abi.encodePacked("data:application/json;base64,", json));
    }

    /**
     * @dev Generate SVG image for the NFT
     */
    function generateSVG(GameData memory data) internal pure returns (string memory) {
        return string(
            abi.encodePacked(
                '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">',
                '<defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">',
                '<stop offset="0%" style="stop-color:#0D0D0D"/><stop offset="100%" style="stop-color:#1a0a1a"/>',
                '</linearGradient><linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">',
                '<stop offset="0%" style="stop-color:#9B5DE5"/><stop offset="100%" style="stop-color:#F15BB5"/>',
                '</linearGradient></defs>',
                '<rect width="400" height="400" fill="url(#bg)"/>',
                '<rect x="20" y="20" width="360" height="360" rx="20" fill="none" stroke="url(#accent)" stroke-width="2"/>',
                '<text x="200" y="60" text-anchor="middle" fill="#00D9A5" font-family="Arial Black" font-size="24">PUSH NINJA</text>',
                '<text x="200" y="140" text-anchor="middle" fill="#FFD700" font-family="Arial" font-size="16">', data.tierName, '</text>',
                '<text x="200" y="200" text-anchor="middle" fill="#00D9A5" font-family="Arial Black" font-size="48">', data.score.toString(), '</text>',
                '<text x="200" y="230" text-anchor="middle" fill="#888" font-family="Arial" font-size="14">SCORE</text>',
                '<text x="120" y="300" text-anchor="middle" fill="#fff" font-family="Arial" font-size="20">', data.maxCombo.toString(), '</text>',
                '<text x="120" y="320" text-anchor="middle" fill="#888" font-family="Arial" font-size="10">COMBO</text>',
                '<text x="280" y="300" text-anchor="middle" fill="#fff" font-family="Arial" font-size="20">', data.tokensSlashed.toString(), '</text>',
                '<text x="280" y="320" text-anchor="middle" fill="#888" font-family="Arial" font-size="10">SLASHED</text>',
                '<text x="200" y="380" text-anchor="middle" fill="#9B5DE5" font-family="Arial" font-size="12">Push Chain</text>',
                '</svg>'
            )
        );
    }

    /**
     * @dev Get game data for a token
     */
    function getGameData(uint256 tokenId) public view returns (
        uint256 score,
        uint256 maxCombo,
        uint256 tokensSlashed,
        string memory tierName,
        uint256 timestamp,
        address player
    ) {
        GameData memory data = gameData[tokenId];
        return (data.score, data.maxCombo, data.tokensSlashed, data.tierName, data.timestamp, data.player);
    }

    /**
     * @dev Get all token IDs owned by a player
     */
    function getPlayerTokens(address player) public view returns (uint256[] memory) {
        return playerTokens[player];
    }

    /**
     * @dev Get total number of NFTs minted
     */
    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter;
    }

    // Required overrides
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
