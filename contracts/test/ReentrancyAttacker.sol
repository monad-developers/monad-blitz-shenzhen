// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../MonadPaymentSystem.sol";

/**
 * @title ReentrancyAttacker
 * @dev 用于测试重入攻击保护的恶意合约
 */
contract ReentrancyAttacker {
    MonadPaymentSystem public immutable paymentSystem;
    address public target;
    uint256 public attackCount;
    bool public attacking;
    
    constructor(address _paymentSystem) {
        paymentSystem = MonadPaymentSystem(payable(_paymentSystem));
    }
    
    /**
     * @dev 发起重入攻击
     */
    function attack(address _target) external payable {
        target = _target;
        attacking = true;
        attackCount = 0;
        
        // 尝试调用支付函数，这应该触发receive函数
        paymentSystem.singlePayment{value: msg.value}(
            address(this), // 将自己设为收款人
            address(0),    // 原生代币
            msg.value,
            "reentrancy attack"
        );
    }
    
    /**
     * @dev 接收ETH时尝试重入攻击
     */
    receive() external payable {
        if (attacking && attackCount < 3) {
            attackCount++;
            // 尝试再次调用支付函数（重入攻击）
            paymentSystem.singlePayment{value: address(this).balance / 2}(
                target,
                address(0),
                address(this).balance / 2,
                "reentrancy attempt"
            );
        }
    }
    
    /**
     * @dev 停止攻击
     */
    function stopAttack() external {
        attacking = false;
    }
    
    /**
     * @dev 提取合约中的ETH
     */
    function withdraw() external {
        payable(msg.sender).transfer(address(this).balance);
    }
} 