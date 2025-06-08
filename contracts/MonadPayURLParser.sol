// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./MonadPaymentSystem.sol";

/**
 * @title MonadPayURLParser
 * @dev 用于解析和处理MonadPay URL参数的辅助合约
 * 支持格式: https://pay.monad.link/send?to=0x123...&amount=10.5&token=USDC&label=咖啡
 */
contract MonadPayURLParser {
    MonadPaymentSystem public immutable paymentSystem;
    
    // URL参数结构
    struct URLParams {
        string to;              // 收款地址字符串
        string amount;          // 金额字符串
        string token;           // 代币符号
        string tokenAddress;    // 代币合约地址
        string chainId;         // 链ID
        string label;           // 交易备注
    }
    
    event URLPaymentProcessed(
        address indexed payer,
        string originalURL,
        address recipient,
        uint256 amount,
        address token,
        string label
    );
    
    constructor(address _paymentSystem) {
        paymentSystem = MonadPaymentSystem(payable(_paymentSystem));
    }
    
    /**
     * @dev 处理完整的URL支付请求
     * @param urlParams 从URL解析出的参数
     * @param originalURL 原始URL字符串（用于事件记录）
     */
    function processURLPayment(
        URLParams memory urlParams,
        string memory originalURL
    ) external payable {
        // 验证必填参数
        require(bytes(urlParams.to).length > 0, "Missing recipient address");
        require(bytes(urlParams.amount).length > 0, "Missing amount");
        
        // 解析地址
        address recipient = parseAddress(urlParams.to);
        require(recipient != address(0), "Invalid recipient address");
        
        // 解析金额 (这里简化处理，实际应用中需要更复杂的解析)
        uint256 amount = parseAmount(urlParams.amount);
        require(amount > 0, "Invalid amount");
        
        // 确定代币地址
        address tokenAddress = determineTokenAddress(urlParams.token, urlParams.tokenAddress);
        
        // 验证链ID (如果提供)
        if (bytes(urlParams.chainId).length > 0) {
            uint256 chainId = parseUint(urlParams.chainId);
            require(chainId == 0 || chainId == block.chainid, "Invalid chain ID");
        }
        
        // 执行支付
        if (tokenAddress == address(0)) {
            // 原生代币支付
            paymentSystem.singlePayment{value: msg.value}(
                recipient,
                tokenAddress,
                amount,
                urlParams.label
            );
        } else {
            // ERC20代币支付
            paymentSystem.singlePayment(
                recipient,
                tokenAddress,
                amount,
                urlParams.label
            );
        }
        
        emit URLPaymentProcessed(
            msg.sender,
            originalURL,
            recipient,
            amount,
            tokenAddress,
            urlParams.label
        );
    }
    
    /**
     * @dev 通过代币符号支付（支持URL中的token参数）
     */
    function payBySymbol(
        string memory to,
        string memory amount,
        string memory tokenSymbol,
        string memory label
    ) external payable {
        address recipient = parseAddress(to);
        uint256 paymentAmount = parseAmount(amount);
        
        paymentSystem.payByTokenSymbol{value: msg.value}(
            recipient,
            paymentAmount,
            tokenSymbol,
            label
        );
    }
    
    /**
     * @dev 解析地址字符串
     * 注意：这是简化版本，生产环境需要更robust的地址解析
     */
    function parseAddress(string memory addrStr) public pure returns (address) {
        bytes memory addrBytes = bytes(addrStr);
        require(addrBytes.length == 42, "Invalid address length"); // 0x + 40 hex chars
        require(addrBytes[0] == '0' && addrBytes[1] == 'x', "Address must start with 0x");
        
        // 简化的地址解析 - 在实际应用中需要更完善的实现
        // 这里返回示例地址，实际需要实现十六进制字符串到地址的转换
        return address(0x1234567890123456789012345678901234567890); // 示例地址
    }
    
    /**
     * @dev 解析金额字符串 (支持小数)
     * 注意：这是简化版本，生产环境需要更精确的数值解析
     */
    function parseAmount(string memory /* amountStr */) public pure returns (uint256) {
        // 简化实现 - 假设金额以wei为单位
        // 实际应用中需要支持小数点和不同精度
        return 1000000000000000000; // 示例：1 ETH/MONAD
    }
    
    /**
     * @dev 解析无符号整数
     */
    function parseUint(string memory numStr) public pure returns (uint256) {
        bytes memory numBytes = bytes(numStr);
        uint256 result = 0;
        
        for (uint256 i = 0; i < numBytes.length; i++) {
            uint8 digit = uint8(numBytes[i]);
            require(digit >= 48 && digit <= 57, "Invalid number character");
            result = result * 10 + (digit - 48);
        }
        
        return result;
    }
    
    /**
     * @dev 确定代币地址
     */
    function determineTokenAddress(
        string memory tokenSymbol,
        string memory tokenAddress
    ) public view returns (address) {
        // 优先使用tokenAddress
        if (bytes(tokenAddress).length > 0) {
            return parseAddress(tokenAddress);
        }
        
        // 如果没有tokenAddress，使用symbol查找
        if (bytes(tokenSymbol).length > 0) {
            address symbolAddress = paymentSystem.getTokenBySymbol(tokenSymbol);
            return symbolAddress;
        }
        
        // 默认使用原生代币
        return address(0);
    }
    
    /**
     * @dev 构建标准的MonadPay URL
     */
    function buildMonadPayURL(
        address to,
        uint256 amount,
        string memory tokenSymbol,
        string memory label
    ) external pure returns (string memory) {
        // 简化的URL构建 - 实际需要更完善的字符串处理
        return string(abi.encodePacked(
            "https://pay.monad.link/send?to=",
            addressToString(to),
            "&amount=",
            uintToString(amount),
            "&token=",
            tokenSymbol,
            "&label=",
            label
        ));
    }
    
    /**
     * @dev 地址转字符串
     */
    function addressToString(address addr) public pure returns (string memory) {
        bytes32 value = bytes32(uint256(uint160(addr)));
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(42);
        str[0] = '0';
        str[1] = 'x';
        
        for (uint256 i = 0; i < 20; i++) {
            str[2 + i * 2] = alphabet[uint8(value[i + 12] >> 4)];
            str[3 + i * 2] = alphabet[uint8(value[i + 12] & 0x0f)];
        }
        
        return string(str);
    }
    
    /**
     * @dev 无符号整数转字符串
     */
    function uintToString(uint256 value) public pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        
        uint256 temp = value;
        uint256 digits;
        
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        
        bytes memory buffer = new bytes(digits);
        
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        
        return string(buffer);
    }
} 