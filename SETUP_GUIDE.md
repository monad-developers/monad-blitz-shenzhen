# 🔑 MonadPay 测试网部署设置指南

## 📋 第一步：创建钱包和获取私钥

### 1. 安装 MetaMask
- 访问 https://metamask.io/
- 下载并安装浏览器插件
- 创建新钱包（保存好助记词！）

### 2. 添加 Monad 测试网络
在 MetaMask 中：
- 点击网络下拉菜单
- 选择"添加网络" → "手动添加网络"
- 填入以下信息：
  ```
  网络名称：Monad Testnet
  RPC URL：https://testnet-rpc.monad.xyz
  链ID：10143
  货币符号：MON
  区块浏览器：https://testnet-explorer.monad.xyz
  ```

### 3. 获取测试代币
- 访问水龙头：https://testnet.monad.xyz
- 连接您的 MetaMask 钱包
- 请求测试代币（等待几分钟）

### 4. 导出私钥
在 MetaMask 中：
- 点击右上角的账户图标
- 选择"账户详情"
- 点击"导出私钥"
- 输入您的 MetaMask 密码
- **复制私钥（去掉开头的 0x）**

## 🔧 第二步：配置项目

### 1. 创建 .env 文件
在项目根目录创建 `.env` 文件：

**Windows 用户：**
```cmd
copy env.example .env
```

**Mac/Linux 用户：**
```bash
cp env.example .env
```

### 2. 编辑 .env 文件
用文本编辑器（记事本、VS Code等）打开 `.env` 文件，填入：

```env
# 重要：私钥不要包含 0x 前缀！
PRIVATE_KEY=您的私钥（去掉0x前缀）

# 其他配置（可选）
MONAD_API_KEY=
REPORT_GAS=false
```

**示例：**
```env
PRIVATE_KEY=1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```

### 3. 验证配置
运行配置检查：
```bash
npx hardhat run check-config.js --network monad_testnet
```

如果看到 "✅ 配置正常，可以进行部署!"，说明配置成功！

## 🚀 第三步：测试和部署

### 1. 运行本地测试
```bash
npx hardhat test
```

### 2. 部署到测试网
```bash
npm run deploy:monad
```

### 3. 验证合约（可选）
```bash
npm run verify:testnet <合约地址> <构造函数参数>
```

## ❓ 常见问题

### Q: 私钥格式错误
**错误信息：** `invalid private key`
**解决方案：** 确保私钥不包含 `0x` 前缀，应该是64位十六进制字符串

### Q: 余额不足
**错误信息：** `insufficient funds`
**解决方案：** 访问水龙头获取更多测试代币

### Q: 网络连接失败
**错误信息：** `network error`
**解决方案：** 检查网络配置，确认 RPC URL 和链ID 正确

### Q: 合约部署失败
**错误信息：** `deployment failed`
**解决方案：** 
1. 确认有足够的测试代币
2. 检查私钥配置
3. 重试部署

## 🔒 安全提醒

- ⚠️ **永远不要泄露您的私钥！**
- ⚠️ **不要将 .env 文件提交到 Git！**
- ⚠️ **这只是测试网，不要存放真实资产！**

## 📞 获取帮助

如果遇到问题：
1. 检查所有配置步骤
2. 确认测试代币余额
3. 查看错误信息并对应解决方案
4. 在项目中运行 `npx hardhat run check-config.js --network monad_testnet` 诊断问题 