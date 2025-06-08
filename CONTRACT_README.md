# Monad 支付系统智能合约

## 📋 概述

这是一个部署在Monad区块链上的综合支付系统智能合约，支持多种支付功能：

- ✅ **单笔支付** - 即时转账支付
- ✅ **批量支付** - 一次性向多个地址支付
- ✅ **订阅支付** - 定期自动支付功能
- ✅ **解锁金库** - 基于时间的资产解锁

## 🔧 主要功能

### 1. 单笔支付 (Single Payment)
```solidity
function singlePayment(
    address to,           // 收款地址
    address token,        // 代币地址 (address(0) = 原生代币)
    uint256 amount,       // 支付金额
    string memory label   // 支付备注
) external payable
```

### 2. 批量支付 (Batch Payment)
```solidity
struct BatchPayment {
    address recipient;    // 收款人
    address token;        // 代币地址
    uint256 amount;       // 金额
    string label;         // 备注
}

function batchPayment(BatchPayment[] calldata payments) external payable
```

### 3. 订阅支付 (Subscription)
```solidity
function createSubscription(
    address recipient,    // 收款人
    address token,        // 代币地址
    uint256 amount,       // 每期金额
    uint256 interval,     // 支付间隔（秒）
    uint256 duration,     // 订阅总期限（秒）
    string memory label   // 订阅备注
) external returns (uint256 subscriptionId)

function executeSubscriptionPayment(uint256 subscriptionId) external payable
```

### 4. 解锁金库 (Unlock Vault)
```solidity
function createVault(
    address beneficiary,  // 受益人
    address token,        // 代币地址
    uint256 amount,       // 锁定金额
    uint256 unlockTime,   // 解锁时间戳
    string memory label   // 解锁备注
) external payable returns (uint256 vaultId)

function claimVault(uint256 vaultId) external
```

## 📱 URL支付集成

合约支持通过URL参数直接调用，格式如下：

```
https://pay.monad.link/send?
  to=0x123...abc          # 必填，收款地址
  &amount=10.5            # 必填，支付金额
  &token=USDC             # 可选，代币符号
  &tokenAddress=0x5843... # 可选，代币合约地址
  &chainId=1              # 可选，链ID
  &label=咖啡             # 可选，交易备注
```

## 💰 手续费机制

- 默认平台手续费：**1%**
- 手续费从每笔交易中扣除
- 管理员可调整手续费率（最高10%）
- 手续费发送到指定的收款地址

## 🔐 安全特性

- ✅ **ReentrancyGuard** - 防重入攻击
- ✅ **Pausable** - 紧急暂停功能
- ✅ **Ownable** - 管理员权限控制
- ✅ **SafeERC20** - 安全的代币转账
- ✅ **输入验证** - 严格的参数校验

## 📊 事件日志

```solidity
event SinglePayment(address indexed payer, address indexed recipient, address indexed token, uint256 amount, string label);
event BatchPaymentExecuted(address indexed payer, uint256 totalRecipients, uint256 totalAmount);
event SubscriptionCreated(uint256 indexed subscriptionId, address indexed subscriber, address indexed recipient, ...);
event SubscriptionPayment(uint256 indexed subscriptionId, uint256 amount, uint256 timestamp);
event VaultCreated(uint256 indexed vaultId, address indexed owner, address indexed beneficiary, ...);
event VaultClaimed(uint256 indexed vaultId, address indexed beneficiary, uint256 amount);
```

## 🚀 部署和使用

### 1. 安装依赖
```bash
npm install
```

### 2. 编译合约
```bash
npm run compile
```

### 3. 部署合约
```bash
# 部署到测试网
npm run deploy:testnet

# 部署到主网
npm run deploy:mainnet
```

### 4. 运行示例
```bash
npm run example
```

## 📝 使用示例

### JavaScript调用示例

```javascript
const { ethers } = require("hardhat");

// 连接合约
const contract = await ethers.getContractAt("MonadPaymentSystem", contractAddress);

// 1. 单笔支付
await contract.singlePayment(
    "0x742d35Cc6634C0532925a3b8D2A3B6C8a84fF5e", // 收款地址
    ethers.constants.AddressZero,                    // 原生代币
    ethers.utils.parseEther("1.0"),                  // 1 MONAD
    "咖啡付款",                                       // 备注
    { value: ethers.utils.parseEther("1.0") }
);

// 2. 创建订阅
const subscriptionId = await contract.createSubscription(
    "0x742d35Cc6634C0532925a3b8D2A3B6C8a84fF5e", // 收款人
    ethers.constants.AddressZero,                    // 原生代币
    ethers.utils.parseEther("0.1"),                  // 每期0.1 MONAD
    7 * 24 * 3600,                                   // 7天间隔
    30 * 24 * 3600,                                  // 30天期限
    "月度订阅"                                        // 备注
);

// 3. 创建解锁金库
const unlockTime = Math.floor(Date.now() / 1000) + 3600; // 1小时后
const vaultId = await contract.createVault(
    "0x742d35Cc6634C0532925a3b8D2A3B6C8a84fF5e", // 受益人
    ethers.constants.AddressZero,                    // 原生代币
    ethers.utils.parseEther("10.0"),                 // 锁定10 MONAD
    unlockTime,                                      // 解锁时间
    "奖励解锁",                                       // 备注
    { value: ethers.utils.parseEther("10.0") }
);
```

## 🔍 查询函数

```solidity
// 查询订阅信息
function getSubscription(uint256 subscriptionId) external view returns (Subscription memory);

// 查询金库信息
function getVault(uint256 vaultId) external view returns (UnlockVault memory);

// 查询用户订阅列表
function getUserSubscriptions(address user) external view returns (uint256[] memory);

// 查询用户金库列表
function getUserVaults(address user) external view returns (uint256[] memory);

// 检查是否可以执行订阅支付
function canExecuteSubscription(uint256 subscriptionId) external view returns (bool);

// 检查是否可以领取金库
function canClaimVault(uint256 vaultId) external view returns (bool);
```

## ⚙️ 管理员功能

```solidity
// 设置平台手续费率
function setPlatformFee(uint256 _fee) external onlyOwner;

// 设置手续费接收地址
function setFeeRecipient(address _feeRecipient) external onlyOwner;

// 暂停/恢复合约
function pause() external onlyOwner;
function unpause() external onlyOwner;

// 紧急提取资金
function emergencyWithdraw(address token, uint256 amount) external onlyOwner;
```

## 🌟 特色功能

### 1. 灵活的代币支持
- 支持原生MONAD代币
- 支持任意ERC20代币
- 自动检测代币类型

### 2. 智能订阅管理
- 灵活的支付间隔设置
- 自动到期管理
- 可随时取消订阅

### 3. 安全的资产解锁
- 基于时间的解锁机制
- 受益人安全领取
- 防止重复领取

### 4. 批量操作优化
- 一次性处理多笔支付
- Gas费用优化
- 原子性操作保证

## 📋 注意事项

1. **手续费计算**：所有支付都会扣除平台手续费
2. **订阅间隔**：最小订阅间隔为1小时
3. **批量限制**：单次最多支持100笔批量支付
4. **安全检查**：所有地址和金额都会进行严格验证
5. **事件监听**：所有操作都会触发相应事件，便于前端监听

## 🔧 开发工具

- **Solidity**: ^0.8.19
- **Hardhat**: 智能合约开发环境
- **OpenZeppelin**: 安全合约库
- **Ethers.js**: 以太坊交互库

## 📞 技术支持

如需技术支持或有任何问题，请联系开发团队。

---

**⚠️ 风险提示**：智能合约涉及资金操作，请在主网部署前进行充分测试，确保安全性。 