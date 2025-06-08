// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "../lib/openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "../lib/openzeppelin-contracts/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {ReentrancyGuard} from "../lib/openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";
import {Address} from "../lib/openzeppelin-contracts/contracts/utils/Address.sol";
import {IERC20} from "../lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {ITorchToken} from "./interfaces/ITorchToken.sol";
import "./interfaces/IUniswap.sol";

contract TorchGame is ReentrancyGuard {
    bool private initialized;
    uint256 private PRECISION = 1e18;
    uint256 private basePrice = 1e13;

    struct Round {
        uint256 id;
        uint256 startTime;
        uint256 endTime;
        uint256 burnStartTime;
        uint256 burnEndTime;
        uint256 totalETH;
        uint256 rewardPool;
        uint256 totalBurn;
        bool mintTriggered;
    }

    ITorchToken public token;
    address public routerAddress;
    IUniswapV2Router02 public router;
    address public swapPair;
    address public creator;
    uint256 public creatTime;
    address public torchFactory;
    address public foundation;
    uint256 public minCapETH;
    uint256 public roundDuration;
    uint256 public burnDuration;
    uint256 public totalRounds;
    uint256 public currentRoundId = 1;
    uint256 public totalRewardPool;
    uint256[] public rewardRanks;
    uint256 public rollOverRate;
    uint256 public totalBurn;
    uint256 public totalDeposits;
    mapping(uint256 => Round) public rounds;
    mapping(uint256 => mapping(address => uint256)) public userDeposits;
    mapping(uint256 => mapping(address => uint256)) public userBurned;
    mapping(uint256 => mapping(address => bool)) public rewardClaimed;
    mapping(uint256 => mapping(address => bool)) public refunded;
    mapping(uint256 => address[]) public roundUsers;
    mapping(uint256 => address[]) public burners;
    mapping(uint256 => uint256) public claimedRewards;
    mapping(address => uint256) public lastDepositTime;
    mapping(address => uint256) public totalUserDeposits;
    mapping(address => uint256) public totalUserBurn;
    enum RoundPhase {
        NotExist,  
        NotStarted,  
        Failure,    
        Participating,   
        WaitingForBurn,  
        Burning,         
        Claiming,        
        Ended           
    }

    constructor() CustomOwnable(msg.sender) {}
    
    function initialize(
        uint256 _minCapETH,
        uint256 _roundDuration,
        uint256 _totalRounds,
        uint256[] memory _rewardRanks,
        uint256 _rollOverRate,
        address _creator,
        address _foundation,
        address _token,
        address _routerAddress
    ) external{
        require(!initialized, "Already initialized");
        require(_rollOverRate >= 1000, "Min rollover is 10%");
        require(_foundation != address(0), "Invalid foundation");

        uint256 totalRankPercent = 0;
        for (uint i = 0; i < _rewardRanks.length; i++) {
            totalRankPercent += _rewardRanks[i];
        }
        require(totalRankPercent + _rollOverRate <= 10000, "Total rank percent plus rollover rate exceeds 100%");

        initialized = true;

        currentRoundId = 1;

        torchFactory = msg.sender;
        creatTime = block.timestamp;
        token = ITorchToken(_token);
        foundation = _foundation;
        creator = _creator;
        minCapETH = _minCapETH;
        roundDuration = _roundDuration;
        burnDuration = _roundDuration;
        totalRounds = _totalRounds;
        rewardRanks = _rewardRanks;
        rollOverRate = _rollOverRate;
        routerAddress = _routerAddress;
        router = IUniswapV2Router02(_routerAddress);
        swapPair = IUniswapV2Factory(router.factory()).getPair(
            address(token),
            router.WETH()
        );

    }


    function deposit() external payable nonReentrant {
        require(!checkGameFailure(), "Game has failed, only refunds allowed");
        
        emit Deposit(address(this), targetRoundId, msg.sender, msg.value);
    }
    event Deposit(address indexed game, uint256 indexed roundId, address indexed user, uint256 amount);



    function refund() external nonReentrant {
        require(currentRoundId == 1, "Only first round can be refunded"); 
        Round storage round = rounds[1];
        require(block.timestamp > round.endTime, "Round not ended");
        require(!round.mintTriggered, "Cap reached and game not failed");
        require(!refunded[1][msg.sender], "Already refunded");

        uint256 amount = userDeposits[1][msg.sender];
        require(amount > 0, "No deposit");

        refunded[1][msg.sender] = true;
        Address.sendValue(payable(msg.sender), amount);
    
        emit Refund(address(this), msg.sender, amount);
    }
    event Refund(address indexed game, address indexed user, uint256 amount);

    function burnToCompete(uint256 amount) external nonReentrant {
        require(!checkGameFailure(), "Game has failed, only refunds allowed");
        require(amount > 0, "Amount must be greater than 0");
        

        token.burnFrom(msg.sender, amount);
        totalBurn += amount;
        totalUserBurn[msg.sender] += amount;

        emit TokensBurned(address(this), targetRoundId, msg.sender, amount);
    }
    event TokensBurned(address indexed game, uint256 indexed roundId, address indexed user, uint256 amount);

    function claimReward(uint256 roundId) external nonReentrant {
        require(!checkGameFailure(), "Game has failed, only refunds allowed");
        

        emit ClaimReward(address(this), roundId, msg.sender, reward);
    }
    event ClaimReward(address indexed game, uint256 indexed roundId, address indexed user, uint256 amount);


    function checkGameFailure() public view returns (bool) {
        return currentRoundId == 1 && block.timestamp > rounds[1].endTime && !rounds[1].mintTriggered;
    }


    function getRewardRanks() public view returns (uint256[] memory) {
        return rewardRanks;
    }

    struct GameInfo {
        address creator;
        uint256 creatTime;
        uint256 minCapETH;
        uint256 roundDuration;
        uint256 burnDuration;
        uint256 totalRounds;
        uint256 totalRewardPool;
        uint256[] rewardRanks;
        uint256 rollOverRate;
        uint256 totalBurn;
        address tokenAddress;
        uint256 currentTime;
        uint256 currentRoundId;
    }

    function getGameInfo() public view returns (GameInfo memory) {
        return GameInfo({
            creator: creator,
            creatTime: creatTime,
            minCapETH: minCapETH,
            roundDuration: roundDuration,
            burnDuration: burnDuration,
            totalRounds: totalRounds,
            totalRewardPool: totalRewardPool,
            rewardRanks: getRewardRanks(),
            rollOverRate: rollOverRate,
            totalBurn: totalBurn,
            tokenAddress: address(token),
            currentTime: block.timestamp,
            currentRoundId: _calculateRoundId(block.timestamp)
        });
    }

    struct RewardInfo {
        uint256 rank;        // rank list (0=no rank)
        uint256 amount;      // reward amount
        bool isRanked;       // is in rank list
        bool hasBurned;      // is burn token
        uint256 burnAmount;  // burn amount
        uint256 roundDeposit; // user's deposit in this round
        bool hasClaimedReward; // whether user has claimed reward
    }


    function getRewardInfo(uint256 roundId, address user) external view returns (RewardInfo memory) {
        require(_isRoundValid(roundId), "Round not valid");
        Round storage round = rounds[roundId];
        
        RewardInfo memory info;
        if (round.id == 0) {
            return info;
        }
        
       
        return info;
    }


    receive() external payable {}

}