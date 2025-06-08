# 🚀 MonadPay Vercel 部署指南

本指南将帮助您将MonadPay系统部署到Vercel上，实现全球访问。

## 📋 部署前准备

### 1. 安装Vercel CLI
```bash
npm install -g vercel
```

### 2. 登录Vercel账户
```bash
vercel login
```

## 🔧 部署步骤

### 方法一：命令行部署（推荐）

1. **在项目根目录运行部署命令**
```bash
vercel
```

2. **按照提示配置**
- 选择团队（个人账户选择默认）
- 确认项目名称：`monad-pay`
- 确认部署目录（当前目录）
- 不要覆写设置（选择 N）

3. **设置环境变量（如果需要）**
```bash
vercel env add PRIVATE_KEY
# 输入您的私钥（仅用于后端API功能）
```

### 方法二：GitHub自动部署

1. **将代码推送到GitHub**（已完成）

2. **登录Vercel控制台**
   - 访问 [vercel.com](https://vercel.com)
   - 连接GitHub账户

3. **导入项目**
   - 点击 "New Project"
   - 选择 `ryan-monad-playground` 仓库
   - 点击 "Import"

4. **配置设置**
   - Project Name: `monad-pay`
   - Framework: `Other`
   - Build Command: `npm run build`
   - Output Directory: `./` (留空)

## 🌐 部署后的URL结构

部署成功后，您的应用将可以通过以下URL访问：

```
https://monad-pay.vercel.app/          # 主页（支付页面）
https://monad-pay.vercel.app/pay       # 支付页面
https://monad-pay.vercel.app/local     # 本地版本支付页面
https://monad-pay.vercel.app/debug     # 网络调试工具
```

## 📁 静态文件结构

Vercel会自动托管以下静态文件：
- `url-payment-handler.html` → `/` 和 `/pay`
- `local-payment-handler.html` → `/local`
- `debug-network.html` → `/debug`

## 🔄 自动部署

配置完成后，每次推送到main分支都会自动触发部署：

```bash
git add .
git commit -m "更新功能"
git push origin main
# Vercel会自动检测并部署新版本
```

## 🛠️ 自定义域名（可选）

1. **在Vercel控制台中**
   - 进入项目设置
   - 点击 "Domains"
   - 添加您的自定义域名

2. **DNS配置**
   - 添加CNAME记录指向 `cname.vercel-dns.com`
   - 或添加A记录指向Vercel IP

## 📊 监控和分析

部署后可以在Vercel控制台查看：
- 📈 访问统计
- 🚀 部署历史
- 📝 构建日志
- ⚡ 性能指标

## 🔧 环境变量管理

如果需要添加环境变量：

```bash
# 开发环境
vercel env add VARIABLE_NAME development

# 生产环境
vercel env add VARIABLE_NAME production

# 预览环境
vercel env add VARIABLE_NAME preview
```

## 🐛 常见问题

### 1. 构建失败
```bash
# 检查构建日志
vercel logs [deployment-url]

# 本地测试构建
npm run build
```

### 2. 静态文件404
确保HTML文件在项目根目录，并检查 `vercel.json` 中的路由配置。

### 3. CORS错误
如果需要API功能，确保在API函数中设置正确的CORS头。

## 🎯 测试部署

部署完成后，测试以下功能：

1. **基本页面访问**
   - ✅ 主页加载
   - ✅ 支付页面功能
   - ✅ 调试工具可用

2. **URL参数处理**
   ```
   https://your-app.vercel.app/pay?to=0x123...&amount=1.0&token=MONAD&label=测试
   ```

3. **MetaMask连接**
   - ✅ 钱包连接正常
   - ✅ 网络切换功能
   - ✅ 交易发送成功

## 📞 支持

如果遇到部署问题：
- 📚 查看 [Vercel文档](https://vercel.com/docs)
- 💬 Vercel Discord社区
- 📧 GitHub Issues

---

🎉 **恭喜！您的MonadPay系统现在已经全球可访问！** 