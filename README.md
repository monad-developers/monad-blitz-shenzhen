
“让每一个 AI Agent 都拥有支付意志与道德自省能力，在人机共生系统中成为可信经济体。”
---

## 📘 `README.md`

````markdown
# Monad Agent Pay 🪙

> Web3-native NFT 支付与 Intent 履约交互前端，构建于 Monad 网络，支持 React + Wagmi 钱包交互与合约调用。

## ✨ 特性

- 基于 Monad `.monad.ts` 合约标准接口
- NFT 支付模块（ERC-721 / ERC-1155 支持）
- Wagmi 钱包连接
- 全自动部署（Vercel + GitHub Actions）
- 适配 Monad Intent 标准结构（签名履约）

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/your-org/monad-agent-pay.git
cd monad-agent-pay
````

### 2. 安装依赖

```bash
pnpm install
```

或

```bash
npm install
```

### 3. 环境变量配置

创建 `.env.local` 文件，填入以下配置项：

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourContractAddressHere
NEXT_PUBLIC_CHAIN_ID=8453
NEXT_PUBLIC_NFT_CONTRACT=0xNFTCollectionAddress
```

### 4. 启动开发服务器

```bash
pnpm dev
```

访问：`http://localhost:3000`

---

## 📄 目录结构

```
monad-agent-pay/
├── lib/                      # 合约交互逻辑
│   ├── .monad.ts             # Monad Intent 合约交互逻辑
│   └── nftPay.ts             # NFT 支付函数
├── pages/
│   └── index.tsx             # 主页面
├── scripts/
│   └── test.ts               # 测试脚本
├── .vercel/                  # Vercel 项目设置
├── .github/workflows/        # GitHub Actions 自动部署
│   └── deploy.yml
├── vercel.json               # Rewrite 配置
├── package.json
├── README.md
└── tsconfig.json
```

---

## 🔐 合约 ABI 示例（部分）

位于 `lib/abi/monadABI.ts` 中：

```ts
export const monadAbi = [
  {
    "inputs": [
      { "internalType": "address", "name": "agent", "type": "address" },
      { "internalType": "string", "name": "intent", "type": "string" }
    ],
    "name": "fulfillIntent",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllIntents",
    "outputs": [{ "internalType": "string[]", "name": "", "type": "string[]" }],
    "stateMutability": "view",
    "type": "function"
  }
]
```

---

## 🧪 测试方式

执行以下脚本进行链上交互模拟：

```bash
pnpm tsx scripts/test.ts
```

你也可以将 `.monad.ts` 与 `nftPay.ts` 的调用逻辑复制到 Hardhat/Foundry 测试用例中。

---

## 🧾 Vercel 自动部署配置

`vercel.json`：

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }],
  "framework": "nextjs"
}
```

`.github/workflows/deploy.yml`：

```yaml
name: Deploy to Vercel

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          scope: your-vercel-team
```

---

## 📫 联系我们

* Web: [https://clippy.life](https://clippy.life)
* Twitter: [@life++clippy](https://x.com/lifeclippy)

---

> 项目由 [Monad](https://monad.xyz) 社区支持构建，致力于打造下一代意图驱动的 Web3 基础设施。

```

---

