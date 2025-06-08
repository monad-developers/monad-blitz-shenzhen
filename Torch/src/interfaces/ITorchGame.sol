// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ITorchGame {
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

    function initialize(
        uint256 _minCapETH,
        uint256 _roundDuration,
        uint256 _totalRounds,
        uint256[] memory _rewardRanks,
        uint256 _rollOverRate,
        address _creator,
        address _token,
        address _routerAddress
    ) external;
    
    function deposit() external payable;
    function burnToCompete(uint256 amount) external;
    function claimReward(uint256 roundId) external;
    function refund() external;
    
    function getTokenInfo() external view returns (
        string memory name,
        string memory symbol,
        string memory description,
        string memory logoUrl,
        address tokenAddress
    );
    

    function getGameInfo() external view returns (GameInfo memory);
} 