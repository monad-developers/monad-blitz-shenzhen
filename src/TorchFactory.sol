// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import {Clones} from "../lib/openzeppelin-contracts/contracts/proxy/Clones.sol";
import {ITorchGame} from "./interfaces/ITorchGame.sol";
import {IERC20} from "../lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {ITorchToken} from "./interfaces/ITorchToken.sol";
contract TorchFactory {
    using Clones for address;
    address public gameImplementation;
    address public tokenImplementation;
    address public routerAddress;

    uint256 private nonce;
    GameInfo[] public allGames;

    struct GameParams {
        string name;
        string symbol;
        string desc;
        string logoUrl;
        string tgLink;
        string webLink;
        string xLink;
        uint256 minCapETH;
        uint256 roundDuration;
        uint256 totalRounds;
        uint256[] rewardRanks;
        uint256 rollOverRate;
    }

    struct GameInfo {
        address gameAddress;
        uint256 timestamp;
    }

    struct FavoriteInfo {
        address gameAddress;
        uint256 timestamp;
    }

    
    mapping(uint256 => address) public timestampToGame;
    
    mapping(address => GameInfo[]) public gamesByCreator;
    mapping(address => mapping(uint256 => address)) public creatorTimestampToGame;
    mapping(address => uint256[]) public creatorTimestamps;
    mapping(address => bool) public gameContracts;
    mapping(address => address) public gameToToken;
    
    event GameCloneCreated(
        address indexed gameAddress,
        address indexed tokenAddress,
        address indexed creator,
        string name,
        string symbol,
        string desc,
        string logoUrl,
        uint256 timestamp,
        bytes initData
    );

    constructor(
        address _gameImplementation,
        address _tokenImplementation,
        address _routerAddress
    ) CustomOwnable(msg.sender) {
        require(_gameImplementation != address(0), "Invalid game implementation");
        require(_tokenImplementation != address(0), "Invalid token implementation");
        
        gameImplementation = _gameImplementation;
        tokenImplementation = _tokenImplementation;
        routerAddress = _routerAddress;
    }

    function createGame(
        string memory name,
        string memory symbol,
        string memory desc,
        string memory logoUrl,
        string memory tgLink,
        string memory webLink,
        string memory xLink,
        uint256 minCapETH,
        uint256 roundDuration,
        uint256 totalRounds,
        uint256[] memory rewardRanks,
        uint256 rollOverRate
    ) external  {
        require(minCapETH >= 1e16, "Min cap must be at least 0.01");
        require(roundDuration >= 6 minutes, "Round duration must be at least 6 minutes");
        require(totalRounds > 0, "Total rounds must be greater than 0");
        require(rewardRanks.length > 0, "Reward ranks must not be empty");
        require(rollOverRate >= 1000, "Rollover rate must be at least 10%");



        bytes32 salt = keccak256(abi.encodePacked(nonce++));
        
        address gameAddress = Clones.cloneDeterministic(address(gameImplementation), salt);
        ITorchGame game = ITorchGame(gameAddress);
        
        salt = keccak256(abi.encodePacked(nonce++));
        address tokenAddress = Clones.cloneDeterministic(address(tokenImplementation), salt);
        
        ITorchToken(tokenAddress).initialize(
            name,
            symbol,
            desc,
            logoUrl,
            tgLink,
            webLink,
            xLink,
            gameAddress,
            routerAddress
        );
        
        game.initialize(
            minCapETH,
            roundDuration,
            totalRounds,
            rewardRanks,
            rollOverRate,
            msg.sender,
            tokenAddress,
            routerAddress
        );
        
        gameContracts[gameAddress] = true;
        gameToToken[gameAddress] = tokenAddress;
        uint256 timestamp = block.timestamp;
        allGames.push(GameInfo({
            gameAddress: gameAddress,
            timestamp: timestamp
        }));
        timestampToGame[timestamp] = gameAddress;
        
        gamesByCreator[msg.sender].push(GameInfo({
            gameAddress: gameAddress,
            timestamp: timestamp
        }));
        creatorTimestampToGame[msg.sender][timestamp] = gameAddress;
        creatorTimestamps[msg.sender].push(timestamp);

        GameParams memory params = GameParams({
            name: name,
            symbol: symbol,
            desc: desc,
            logoUrl: logoUrl,
            tgLink: tgLink,
            webLink: webLink,
            xLink: xLink,
            minCapETH: minCapETH,
            roundDuration: roundDuration,
            totalRounds: totalRounds,
            rewardRanks: rewardRanks,
            rollOverRate: rollOverRate
        });

        emit GameCloneCreated(
            gameAddress,
            tokenAddress,
            msg.sender,
            name,
            symbol,
            desc,
            logoUrl,
            block.timestamp,
            abi.encode(params)
        );
        
    }

    function getAllGames() external view returns (address[] memory) {
        address[] memory games = new address[](allGames.length);
        for(uint i = 0; i < allGames.length; i++) {
            games[i] = allGames[allGames.length - 1 - i].gameAddress;
        }
        return games;
    }


    function addFavorite(address gameAddress) external {
        require(gameContracts[gameAddress], "Invalid game address");
        require(!userFavorites[msg.sender][gameAddress], "Game already in favorites");
        
        uint256 timestamp = block.timestamp;
        userFavorites[msg.sender][gameAddress] = true;
        userFavoriteGames[msg.sender].push(GameInfo({
            gameAddress: gameAddress,
            timestamp: timestamp
        }));
        
        emit FavoriteAdded(msg.sender, gameAddress);
    }
    event FavoriteAdded(address indexed user, address indexed gameAddress);

    function removeFavorite(address gameAddress) external {
        require(userFavorites[msg.sender][gameAddress], "Game not in favorites");
        
        userFavorites[msg.sender][gameAddress] = false;
        
        GameInfo[] storage favorites = userFavoriteGames[msg.sender];
        for (uint i = 0; i < favorites.length; i++) {
            if (favorites[i].gameAddress == gameAddress) {
                favorites[i] = favorites[favorites.length - 1];
                favorites.pop();
                break;
            }
        }
        
        emit FavoriteRemoved(msg.sender, gameAddress);
    }
    event FavoriteRemoved(address indexed user, address indexed gameAddress);
    
    function getFavoriteGames(address user) external view returns (address[] memory) {
        GameInfo[] storage favorites = userFavoriteGames[user];
        address[] memory games = new address[](favorites.length);
        for(uint i = 0; i < favorites.length; i++) {
            games[i] = favorites[favorites.length - 1 - i].gameAddress;
        }
        return games;
    }


    function isGameFavorited(address user, address gameAddress) external view returns (bool) {
        return userFavorites[user][gameAddress];
    }
 

}
