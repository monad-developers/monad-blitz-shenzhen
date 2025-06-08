// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title MonadPaymentSystem
 * @dev MonadPay - 基于深度链接的加密支付系统
 * 支持多Token/多收件人支付、订阅、解锁功能
 * URL格式: https://pay.monad.link/send?to=0x123...&amount=10.5&token=USDC&label=咖啡
 */
contract MonadPaymentSystem is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;

    // 原生代币地址标识符
    address public constant NATIVE_TOKEN = address(0);
    
    // 平台手续费率 (基于10000，100 = 1%)
    uint256 public platformFee = 100; // 1%
    address public feeRecipient;
    
    // 订阅结构
    struct Subscription {
        address subscriber;     // 订阅者
        address recipient;      // 收款人
        address token;          // 代币地址
        uint256 amount;         // 每期金额
        uint256 interval;       // 支付间隔（秒）
        uint256 lastPayment;    // 上次支付时间
        uint256 endTime;        // 订阅结束时间
        string label;           // 订阅备注
        bool active;            // 是否激活
    }
    
    // 解锁金库结构
    struct UnlockVault {
        address owner;          // 拥有者
        address beneficiary;    // 受益人
        address token;          // 代币地址
        uint256 amount;         // 锁定金额
        uint256 unlockTime;     // 解锁时间
        string label;           // 解锁备注
        bool claimed;           // 是否已领取
    }
    
    // 批量支付结构
    struct BatchPayment {
        address recipient;
        address token;
        uint256 amount;
        string label;
    }
    
    // URL支付参数结构
    struct PaymentRequest {
        address to;             // 收款地址
        uint256 amount;         // 支付金额
        address token;          // 代币地址
        uint256 chainId;        // 链ID
        string label;           // 交易备注
    }
    
    // 状态变量
    mapping(uint256 => Subscription) public subscriptions;
    mapping(uint256 => UnlockVault) public unlockVaults;
    mapping(address => uint256[]) public userSubscriptions;
    mapping(address => uint256[]) public userVaults;
    mapping(string => address) public tokenSymbols; // 代币符号 => 地址映射
    
    uint256 public nextSubscriptionId = 1;
    uint256 public nextVaultId = 1;
    
    // 事件
    event SinglePayment(
        address indexed payer,
        address indexed recipient,
        address indexed token,
        uint256 amount,
        string label,
        uint256 chainId
    );
    
    event BatchPaymentExecuted(
        address indexed payer,
        uint256 totalRecipients,
        uint256 totalAmount
    );
    
    event SubscriptionCreated(
        uint256 indexed subscriptionId,
        address indexed subscriber,
        address indexed recipient,
        address token,
        uint256 amount,
        uint256 interval,
        string label
    );
    
    event SubscriptionPayment(
        uint256 indexed subscriptionId,
        uint256 amount,
        uint256 timestamp
    );
    
    event SubscriptionCancelled(uint256 indexed subscriptionId);
    
    event VaultCreated(
        uint256 indexed vaultId,
        address indexed owner,
        address indexed beneficiary,
        address token,
        uint256 amount,
        uint256 unlockTime,
        string label
    );
    
    event VaultClaimed(
        uint256 indexed vaultId,
        address indexed beneficiary,
        uint256 amount
    );
    
    event DeepLinkPayment(
        address indexed payer,
        address indexed recipient,
        address token,
        uint256 amount,
        string label,
        string deepLink
    );
    
    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);
    event FeeRecipientUpdated(address oldRecipient, address newRecipient);
    event TokenSymbolRegistered(string symbol, address tokenAddress);

    constructor(address _feeRecipient) {
        feeRecipient = _feeRecipient;
        
        // 注册常用代币符号
        tokenSymbols["MONAD"] = NATIVE_TOKEN;
        tokenSymbols["ETH"] = NATIVE_TOKEN;
    }

    // 修饰符
    modifier validAddress(address _addr) {
        require(_addr != address(0), "Invalid address");
        _;
    }

    modifier validAmount(uint256 _amount) {
        require(_amount > 0, "Amount must be greater than 0");
        _;
    }

    /**
     * @dev 处理深度链接支付请求
     * 对应 URL: https://pay.monad.link/send?to=0x123...&amount=10.5&token=USDC&label=咖啡
     */
    function processDeepLinkPayment(
        PaymentRequest memory request,
        string memory deepLink
    ) external payable nonReentrant whenNotPaused {
        require(request.to != address(0), "Invalid recipient address");
        require(request.amount > 0, "Amount must be greater than 0");
        require(request.chainId == 0 || request.chainId == block.chainid, "Invalid chain ID");
        
        address tokenAddress = request.token;
        if (tokenAddress == address(0)) {
            tokenAddress = NATIVE_TOKEN;
        }
        
        _executePayment(msg.sender, request.to, tokenAddress, request.amount, request.label);
        
        emit DeepLinkPayment(
            msg.sender,
            request.to,
            tokenAddress,
            request.amount,
            request.label,
            deepLink
        );
    }

    /**
     * @dev 通过代币符号处理支付 (URL中的token参数)
     */
    function payByTokenSymbol(
        address to,
        uint256 amount,
        string memory tokenSymbol,
        string memory label
    ) external payable nonReentrant whenNotPaused validAddress(to) validAmount(amount) {
        address tokenAddress = tokenSymbols[tokenSymbol];
        if (tokenAddress == address(0) && 
            keccak256(abi.encodePacked(tokenSymbol)) != keccak256(abi.encodePacked("MONAD"))) {
            revert("Unsupported token symbol");
        }
        
        _executePayment(msg.sender, to, tokenAddress, amount, label);
        
        emit SinglePayment(msg.sender, to, tokenAddress, amount, label, block.chainid);
    }

    /**
     * @dev 单笔支付
     */
    function singlePayment(
        address to,
        address token,
        uint256 amount,
        string memory label
    ) external payable nonReentrant whenNotPaused validAddress(to) validAmount(amount) {
        _executePayment(msg.sender, to, token, amount, label);
        
        emit SinglePayment(msg.sender, to, token, amount, label, block.chainid);
    }

    /**
     * @dev 内部支付执行函数
     */
    function _executePayment(
        address payer,
        address recipient,
        address token,
        uint256 amount,
        string memory /* label */
    ) internal {
        uint256 feeAmount = (amount * platformFee) / 10000;
        uint256 netAmount = amount - feeAmount;
        
        if (token == NATIVE_TOKEN) {
            require(msg.value == amount, "Incorrect native token amount");
            
            // 转账给收款人
            payable(recipient).transfer(netAmount);
            
            // 转账手续费
            if (feeAmount > 0) {
                payable(feeRecipient).transfer(feeAmount);
            }
        } else {
            IERC20(token).safeTransferFrom(payer, recipient, netAmount);
            
            // 转账手续费
            if (feeAmount > 0) {
                IERC20(token).safeTransferFrom(payer, feeRecipient, feeAmount);
            }
        }
    }

    /**
     * @dev 批量支付
     */
    function batchPayment(
        BatchPayment[] calldata payments
    ) external payable nonReentrant whenNotPaused {
        require(payments.length > 0, "No payments specified");
        require(payments.length <= 100, "Too many payments"); // 限制批量数量
        
        uint256 totalNativeAmount = 0;
        uint256 totalRecipients = payments.length;
        uint256 totalAmount = 0;
        
        for (uint256 i = 0; i < payments.length; i++) {
            BatchPayment memory payment = payments[i];
            require(payment.recipient != address(0), "Invalid recipient");
            require(payment.amount > 0, "Invalid amount");
            
            uint256 feeAmount = (payment.amount * platformFee) / 10000;
            uint256 netAmount = payment.amount - feeAmount;
            totalAmount += payment.amount;
            
            if (payment.token == NATIVE_TOKEN) {
                totalNativeAmount += payment.amount;
                payable(payment.recipient).transfer(netAmount);
                
                if (feeAmount > 0) {
                    payable(feeRecipient).transfer(feeAmount);
                }
            } else {
                IERC20(payment.token).safeTransferFrom(msg.sender, payment.recipient, netAmount);
                
                if (feeAmount > 0) {
                    IERC20(payment.token).safeTransferFrom(msg.sender, feeRecipient, feeAmount);
                }
            }
            
            emit SinglePayment(msg.sender, payment.recipient, payment.token, payment.amount, payment.label, block.chainid);
        }
        
        if (totalNativeAmount > 0) {
            require(msg.value == totalNativeAmount, "Incorrect native token amount");
        }
        
        emit BatchPaymentExecuted(msg.sender, totalRecipients, totalAmount);
    }

    /**
     * @dev 创建订阅
     */
    function createSubscription(
        address recipient,
        address token,
        uint256 amount,
        uint256 interval,
        uint256 duration,
        string memory label
    ) external validAddress(recipient) validAmount(amount) returns (uint256) {
        require(interval >= 3600, "Interval must be at least 1 hour"); // 最小间隔1小时
        require(duration > 0, "Duration must be greater than 0");
        
        uint256 subscriptionId = nextSubscriptionId++;
        uint256 endTime = block.timestamp + duration;
        
        subscriptions[subscriptionId] = Subscription({
            subscriber: msg.sender,
            recipient: recipient,
            token: token,
            amount: amount,
            interval: interval,
            lastPayment: 0,
            endTime: endTime,
            label: label,
            active: true
        });
        
        userSubscriptions[msg.sender].push(subscriptionId);
        
        emit SubscriptionCreated(
            subscriptionId,
            msg.sender,
            recipient,
            token,
            amount,
            interval,
            label
        );
        
        return subscriptionId;
    }

    /**
     * @dev 执行订阅支付
     */
    function executeSubscriptionPayment(uint256 subscriptionId) 
        external payable nonReentrant whenNotPaused {
        Subscription storage sub = subscriptions[subscriptionId];
        require(sub.active, "Subscription not active");
        require(block.timestamp <= sub.endTime, "Subscription expired");
        require(
            block.timestamp >= sub.lastPayment + sub.interval,
            "Payment interval not reached"
        );
        
        _executePayment(msg.sender, sub.recipient, sub.token, sub.amount, sub.label);
        
        sub.lastPayment = block.timestamp;
        
        emit SubscriptionPayment(subscriptionId, sub.amount, block.timestamp);
    }

    /**
     * @dev 取消订阅
     */
    function cancelSubscription(uint256 subscriptionId) external {
        Subscription storage sub = subscriptions[subscriptionId];
        require(sub.subscriber == msg.sender, "Not subscription owner");
        require(sub.active, "Subscription already inactive");
        
        sub.active = false;
        
        emit SubscriptionCancelled(subscriptionId);
    }

    /**
     * @dev 创建解锁金库
     */
    function createVault(
        address beneficiary,
        address token,
        uint256 amount,
        uint256 unlockTime,
        string memory label
    ) external payable nonReentrant validAddress(beneficiary) validAmount(amount) returns (uint256) {
        require(unlockTime > block.timestamp, "Unlock time must be in future");
        
        uint256 vaultId = nextVaultId++;
        
        if (token == NATIVE_TOKEN) {
            require(msg.value == amount, "Incorrect native token amount");
        } else {
            IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        }
        
        unlockVaults[vaultId] = UnlockVault({
            owner: msg.sender,
            beneficiary: beneficiary,
            token: token,
            amount: amount,
            unlockTime: unlockTime,
            label: label,
            claimed: false
        });
        
        userVaults[msg.sender].push(vaultId);
        
        emit VaultCreated(vaultId, msg.sender, beneficiary, token, amount, unlockTime, label);
        
        return vaultId;
    }

    /**
     * @dev 领取解锁资金
     */
    function claimVault(uint256 vaultId) external nonReentrant {
        UnlockVault storage vault = unlockVaults[vaultId];
        require(vault.beneficiary == msg.sender, "Not vault beneficiary");
        require(block.timestamp >= vault.unlockTime, "Vault still locked");
        require(!vault.claimed, "Vault already claimed");
        
        vault.claimed = true;
        
        if (vault.token == NATIVE_TOKEN) {
            payable(vault.beneficiary).transfer(vault.amount);
        } else {
            IERC20(vault.token).safeTransfer(vault.beneficiary, vault.amount);
        }
        
        emit VaultClaimed(vaultId, vault.beneficiary, vault.amount);
    }

    // 查询函数
    function getSubscription(uint256 subscriptionId) 
        external view returns (Subscription memory) {
        return subscriptions[subscriptionId];
    }
    
    function getVault(uint256 vaultId) 
        external view returns (UnlockVault memory) {
        return unlockVaults[vaultId];
    }
    
    function getUserSubscriptions(address user) 
        external view returns (uint256[] memory) {
        return userSubscriptions[user];
    }
    
    function getUserVaults(address user) 
        external view returns (uint256[] memory) {
        return userVaults[user];
    }
    
    function canExecuteSubscription(uint256 subscriptionId) 
        external view returns (bool) {
        Subscription storage sub = subscriptions[subscriptionId];
        return sub.active && 
               block.timestamp <= sub.endTime &&
               block.timestamp >= sub.lastPayment + sub.interval;
    }
    
    function canClaimVault(uint256 vaultId) 
        external view returns (bool) {
        UnlockVault storage vault = unlockVaults[vaultId];
        return !vault.claimed && block.timestamp >= vault.unlockTime;
    }

    function getTokenBySymbol(string memory symbol) 
        external view returns (address) {
        return tokenSymbols[symbol];
    }

    // 管理员函数
    function registerTokenSymbol(string memory symbol, address tokenAddress) 
        external onlyOwner {
        tokenSymbols[symbol] = tokenAddress;
        emit TokenSymbolRegistered(symbol, tokenAddress);
    }
    
    function setPlatformFee(uint256 _fee) external onlyOwner {
        require(_fee <= 1000, "Fee cannot exceed 10%"); // 最大10%
        uint256 oldFee = platformFee;
        platformFee = _fee;
        emit PlatformFeeUpdated(oldFee, _fee);
    }
    
    function setFeeRecipient(address _feeRecipient) 
        external onlyOwner validAddress(_feeRecipient) {
        address oldRecipient = feeRecipient;
        feeRecipient = _feeRecipient;
        emit FeeRecipientUpdated(oldRecipient, _feeRecipient);
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // 紧急提取函数（仅限管理员）
    function emergencyWithdraw(address token, uint256 amount) 
        external onlyOwner {
        if (token == NATIVE_TOKEN) {
            payable(owner()).transfer(amount);
        } else {
            IERC20(token).safeTransfer(owner(), amount);
        }
    }
    
    // 接收原生代币
    receive() external payable {}
} 