// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ITorchToken {
    function initialize(
        string memory name,
        string memory symbol,
        string memory desc,
        string memory logoUrl,
        string memory _tgLink,
        string memory _webLink,
        string memory _xLink,
        address gameAsOwner,
        address devAddress,
        address routerAddress
    ) external;
    
    function mint(address to, uint256 amount) external;
    function burnFrom(address account, uint256 amount) external;
    function calculateTokenAmount(uint256 ethAmount) external view returns (uint256);
    function getCurrentPrice() external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function totalSupply() external view returns (uint256);
} 