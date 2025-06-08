// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockERC20
 * @dev 用于测试的模拟ERC20代币合约
 */
contract MockERC20 is ERC20 {
    uint8 private _decimals;
    
    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals_
    ) ERC20(name, symbol) {
        _decimals = decimals_;
    }
    
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }
    
    /**
     * @dev 铸造代币到指定地址
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
    
    /**
     * @dev 销毁指定地址的代币
     */
    function burn(address from, uint256 amount) external {
        _burn(from, amount);
    }
    
    /**
     * @dev 批量铸造代币
     */
    function batchMint(address[] memory recipients, uint256[] memory amounts) external {
        require(recipients.length == amounts.length, "Arrays length mismatch");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            _mint(recipients[i], amounts[i]);
        }
    }
} 