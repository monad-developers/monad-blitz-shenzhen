# 🚀 MonadPay 部署指南

## 📋 准备工作

### 1. 环境配置

1. **复制环境变量文件**：
   ```bash
   cp env.example .env
   ```

2. **配置私钥**：
   编辑 `.env` 文件，填入您的私钥（不包含 0x 前缀）：
   ```
   PRIVATE_KEY=your_private_key_here
   ```

3. **获取测试网代币**：
   - 访问 Monad 测试网水龙头
   - 为您的部署地址获取测试代币

### 2. 验证配置

确认网络配置正确：
```bash
npx hardhat console --network monad_testnet
```

## 🔧 部署流程

### 方法1: 使用NPM脚本（推荐）

```bash
# 部署到 Monad 测试网
npm run deploy:monad
```

### 方法2: 使用Hardhat命令

```bash
# 标准部署
npx hardhat run scripts/deploy-monad.js --network monad_testnet

# 或使用原始部署脚本
npx hardhat run deploy.js --network monad_testnet
```

### 方法3: 演示部署（包含功能测试）

```bash
# 部署并运行功能演示
npm run demo:testnet
```

## ✅ 验证合约

部署完成后，验证合约源代码：

```bash
# 方法1: 使用脚本
npm run verify:testnet <CONTRACT_ADDRESS> <CONSTRUCTOR_ARG>

# 方法2: 直接使用hardhat
npx hardhat verify --network monad_testnet <CONTRACT_ADDRESS> <CONSTRUCTOR_ARG>
```

### 示例验证命令：

```bash
# 验证 MonadPaymentSystem 合约
npx hardhat verify --network monad_testnet 0x123...abc "0xYourFeeRecipientAddress"

# 验证 MonadPayURLParser 合约  
npx hardhat verify --network monad_testnet 0x456...def "0xPaymentSystemAddress"
```

## 📊 部署后验证

### 1. 检查合约部署状态

```bash
# 运行基础测试
npx hardhat test --network monad_testnet

# 运行网络连接测试
npx hardhat console --network monad_testnet
```

### 2. 验证合约功能

在Hardhat控制台中：
```javascript
// 连接到已部署的合约
const paymentSystem = await ethers.getContractAt("MonadPaymentSystem", "0x合约地址");

// 检查基本信息
await paymentSystem.platformFee();
await paymentSystem.feeRecipient();
await paymentSystem.owner();
```

## 🌐 网络信息

### Monad 测试网
- **网络名称**: monad_testnet
- **RPC URL**: https://testnet-rpc.monad.xyz
- **Chain ID**: 10143 (0x279F)
- **区块浏览器**: https://testnet-explorer.monad.xyz
- **水龙头**: https://testnet.monad.xyz

### Monad 主网（准备就绪时）
- **网络名称**: monad_mainnet  
- **RPC URL**: https://rpc.monad.xyz
- **Chain ID**: 1337
- **区块浏览器**: https://explorer.monad.xyz

## 🔍 故障排除

### 常见问题

1. **余额不足**：
   ```
   Error: insufficient funds for intrinsic transaction cost
   ```
   解决：从水龙头获取更多测试代币

2. **网络连接问题**：
   ```
   Error: network monad_testnet not configured
   ```
   解决：检查 `hardhat.config.js` 中的网络配置

3. **私钥问题**：
   ```
   Error: missing private key
   ```
   解决：检查 `.env` 文件中的 `PRIVATE_KEY` 配置

4. **Gas估算失败**：
   ```
   Error: gas estimation failed
   ```
   解决：检查合约构造函数参数或增加gas限制

### 调试技巧

1. **启用详细日志**：
   ```bash
   DEBUG=* npx hardhat run scripts/deploy-monad.js --network monad_testnet
   ```

2. **检查gas价格**：
   ```bash
   npx hardhat console --network monad_testnet
   # 然后运行: await ethers.provider.getGasPrice()
   ```

3. **验证网络连接**：
   ```bash
   curl -X POST -H "Content-Type: application/json" \
   --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
   https://testnet-rpc.monad.xyz
   ```

## 📝 部署清单

- [ ] 环境变量配置完成
- [ ] 获取足够的测试代币
- [ ] 合约编译成功
- [ ] 部署到测试网成功
- [ ] 合约验证完成
- [ ] 功能测试通过
- [ ] 保存合约地址和配置
- [ ] 文档更新

## 🎯 后续步骤

1. **前端集成**：
   - 使用部署的合约地址
   - 配置Web3连接
   - 实现支付界面

2. **安全审计**：
   - 进行代码审核
   - 运行安全测试
   - 修复发现的问题

3. **主网部署**：
   - 重复测试网流程
   - 使用主网配置
   - 监控部署状态

---

## 🆘 获取帮助

如果遇到问题：
1. 检查[Monad文档](https://docs.monad.xyz)
2. 查看[Hardhat文档](https://hardhat.org/docs)
3. 参考项目的 `test/` 目录中的测试用例
4. 检查网络状态和区块浏览器 