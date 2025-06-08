# Monad MCP 开发指南

本教程将带您了解如何开发一个与 Monad 测试网交互的 MCP 服务器。通过这个服务器，您可以轻松查询 Monad 测试网上的 MON 代币余额。

## MCP 简介

模型上下文协议（Model Context Protocol，简称 MCP）是一套标准接口，它让 AI 模型能够与外部工具和服务进行无缝对接。

在本教程中，我们将开发一个 MCP 服务器，让 Claude Desktop 客户端能够直接查询 Monad 测试网，实时获取账户的 MON 代币余额。

## 环境准备

- Node.js（v16 或以上版本）
- 包管理工具（`npm` 或 `yarn`）
- Cursor 客户端

## 快速开始

1. 克隆项目代码

```shell
git clone https://github.com/monad-developers/monad-mcp-tutorial.git
```

2. 安装项目依赖：

```
npm install
```

## 开发 MCP 服务器

项目中的 `src/index.ts` 文件已经包含了 Monad 测试网的基本配置。

### 创建服务器实例

```ts
// 初始化 MCP 服务器
const server = new McpServer({
  name: "monad-testnet",
  version: "0.0.1",
  // 定义服务器支持的功能列表
  capabilities: ["get-mon-balance"]
});
```

### 实现余额查询功能

首先，我们来看一下 `get-mon-balance` 功能的基本框架：

```ts
server.tool(
    // 功能标识符
    "get-mon-balance",
    // 功能说明
    "查询 Monad 测试网地址的 MON 代币余额",
    // 参数定义
    {
        address: z.string().describe("需要查询的 Monad 测试网地址"),
    },
    // 功能实现
    async ({ address }) => {
        // 余额查询逻辑
    }
);
```

接下来，让我们完善余额查询的具体实现：

```ts
server.tool(
    // 功能标识符
    "get-mon-balance",
    // 功能说明
    "查询 Monad 测试网地址的 MON 代币余额",
    // 参数定义
    {
        address: z.string().describe("需要查询的 Monad 测试网地址"),
    },
    // 功能实现
    async ({ address }) => {
        try {
            // 调用接口查询余额
            const balance = await publicClient.getBalance({
                address: address as `0x${string}`,
            });

            // 返回格式化的查询结果
            return {
                content: [
                    {
                        type: "text",
                        text: `地址 ${address} 的 MON 余额为：${formatUnits(balance, 18)} MON`,
                    },
                ],
            };
        } catch (error) {
            // 错误处理
            return {
                content: [
                    {
                        type: "text",
                        text: `查询地址 ${address} 的余额失败：${
                        error instanceof Error ? error.message : String(error)
                        }`,
                    },
                ],
            };
        }
    }
);
```

### 启动服务器

```ts
async function main() {
    // 配置标准输入输出作为通信通道
    const transport = new StdioServerTransport();
    
    // 建立服务器连接
    await server.connect(transport);
    
    console.error("Monad 测试网 MCP 服务器已启动");
}
```

### 编译项目

```shell
npm run build
```

现在，您的 MCP 服务器已经准备就绪！

### 配置 Cursor

 编辑配置文件

打开 `mcp.json` 


添加服务器配置并保存

```json
{
  "mcpServers": {
    "monad": {
            "url": "http://127.0.0.1:8078/mcp"
        }
  }
  
}
```



## 相关资源

- [MCP 协议文档](https://modelcontextprotocol.io/introduction)
- [Monad 开发文档](https://docs.monad.xyz/)
- [Viem 使用指南](https://viem.sh/) 
