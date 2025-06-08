# SignalCast 部署指南

## 项目概述
SignalCast 是为 Monad 黑客松构建的去中心化链上跟单交易产品。用户可以选择 AI 宠物来追踪 Farcaster 关注者的投资活动并进行跟单交易。

## 技术栈
- Next.js 14
- TailwindCSS
- TypeScript
- Farcaster Mini App SDK

## 本地开发

1. 安装依赖:
```bash
npm install
```

2. 启动开发服务器:
```bash
npm run dev
```

3. 访问 http://localhost:3000

## 部署到 Vercel

### 1. 连接 GitHub 仓库
1. 在 Vercel Dashboard 创建新项目
2. 连接你的 GitHub 仓库
3. 选择 Next.js 框架预设

### 2. 配置域名
项目默认使用 Vercel 提供的域名: `signalcast.vercel.app`

如需自定义域名:
1. 在 Vercel Dashboard 进入项目设置
2. 点击 "Domains" 标签
3. 添加自定义域名
4. 配置相应的 DNS 记录

### 3. 环境变量
在 Vercel Dashboard 的 Environment Variables 中设置:

```env
NEXT_PUBLIC_BASE_URL=https://signalcast.vercel.app
NEXT_PUBLIC_MINIAPP_MODE=true
```

## Farcaster Mini App 配置

### 1. 账户验证 (⚠️ 必需步骤)
为了验证应用所有权并获得开发者奖励，需要完成账户验证：

1. 访问 Warpcast 的 Mini App Manifest Tool
2. 输入域名: `signalcast.vercel.app`  
3. 连接你的 Farcaster 账户
4. 生成签名的 accountAssociation 对象
5. 将生成的 accountAssociation 添加到 `.well-known/farcaster.json` 文件中

示例格式:
```json
{
  "accountAssociation": {
    "header": "...",
    "payload": "...", 
    "signature": "..."
  },
  "frame": {
    // ... 现有配置
  }
}
```

### 2. 缺失的资源文件
部署前需要创建以下图片资源：

#### 必需文件:
- `/public/screenshot1.png` - 应用截图1 (1284 x 2778px)
- `/public/screenshot2.png` - 应用截图2 (1284 x 2778px)  
- `/public/screenshot3.png` - 应用截图3 (1284 x 2778px)
- `/public/og-image.png` - Open Graph 图片 (1200 x 630px)
- `/public/icon.png` - 应用图标 (512x512px PNG)
- `/public/icon-192.png` - 小图标 (192x192px PNG)

#### 建议的截图内容:
1. screenshot1.png: 主页面 - AI 宠物选择界面
2. screenshot2.png: 设置页面 - 宠物对话和配置界面  
3. screenshot3.png: 仪表板页面 - 时间线和排行榜

### 3. 配置文件状态
- ✅ `.well-known/farcaster.json` - 已配置 (需要添加 accountAssociation)
- ✅ `public/manifest.json` - PWA manifest 已配置
- ✅ `vercel.json` - 部署配置已完成
- ✅ `next.config.js` - CORS 和框架嵌入已配置

## 验证部署

### 验证端点
- Mini App 配置：`https://signalcast.vercel.app/miniapp.json`
- API 状态：`https://signalcast.vercel.app/api/miniapp`
- Farcaster Manifest：`https://signalcast.vercel.app/.well-known/farcaster.json`
- PWA Manifest：`https://signalcast.vercel.app/manifest.json`

### 验证步骤
1. 访问 `https://signalcast.vercel.app/.well-known/farcaster.json` 确认 manifest 可访问
2. 在 Warpcast 中测试 Mini App 功能
3. 检查所有页面路由正常工作: `/`, `/setup`, `/dashboard`

### 使用验证工具
```bash
# 手动验证 Mini App 配置
curl https://signalcast.vercel.app/miniapp.json

# 验证 Farcaster manifest
curl https://signalcast.vercel.app/.well-known/farcaster.json
```

## 链配置

项目配置为使用 Monad 区块链:
- Chain ID: 41144 (eip155:41144)
- 需要 Ethereum 钱包提供者支持

## 检查清单

- [ ] `miniapp.json` 配置正确
- [ ] 域名 `signalcast.vercel.app` 正常访问
- [ ] CORS 头部设置正确
- [ ] 移动端体验优化
- [ ] 图标文件存在且规格正确
- [ ] Manifest 文件完整
- [ ] Frame metadata 正确设置
- [ ] 账户验证已完成

## 故障排除

### 常见问题:
1. **域名不工作**: 检查 Vercel 部署状态和域名配置
2. **Mini App 不加载**: 验证 `.well-known/farcaster.json` 格式和可访问性
3. **图片不显示**: 确保所有图片资源存在并使用正确的尺寸
4. **CORS 错误**: 确保 `next.config.js` 中的 headers 配置正确
5. **Mini App 无法嵌入**: 确保 `X-Frame-Options` 设置为 `ALLOWALL`

### 开发者工具:
- Vercel Dashboard: 部署状态和日志
- Warpcast Manifest Tool: 账户验证
- Browser DevTools: 调试和网络问题

## 参考文档
- Farcaster Mini App 文档：https://miniapps.farcaster.xyz/docs
- Vercel 部署文档：https://vercel.com/docs 