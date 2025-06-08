import express from "express";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js"
import { createPublicClient, formatUnits, http } from "viem";
import { monadTestnet } from "viem/chains";
import { z } from "zod";



const app = express();
app.use(express.json());

// Create a public client to interact with the Monad testnet
const publicClient = createPublicClient({
    chain: monadTestnet,
    transport: http(),
});

// Map to store transports by session ID
const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

// Handle POST requests for client-to-server communication
app.post('/mcp', async (req, res) => {
  // Check for existing session ID
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  let transport: StreamableHTTPServerTransport;

  if (sessionId && transports[sessionId]) {
    // Reuse existing transport
    transport = transports[sessionId];
  } else if (!sessionId && isInitializeRequest(req.body)) {
    // New initialization request
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (sessionId) => {
        // Store the transport by session ID
        transports[sessionId] = transport;
      }
    });

    // Clean up transport when closed
    transport.onclose = () => {
      if (transport.sessionId) {
        delete transports[transport.sessionId];
      }
    };
    const server = new McpServer({
      name: "example-server",
      version: "1.0.0"
    });

    // ... set up server resources, tools, and prompts ...
server.tool(
    // Tool ID 
    "get-mon-balance",
    // Description of what the tool does
    "Get MON balance for an address on Monad testnet",
    // Input schema
    {
        address: z.string().describe("Monad testnet address to check balance for"),
    },
    // Tool implementation
    async ({ address }) => {
        try {
            // Check MON balance for the input address
            const balance = await publicClient.getBalance({
                address: address as `0x${string}`,
            });

            // Return a human friendly message indicating the balance.
            return {
                content: [
                    {
                        type: "text",
                        text: `Balance for ${address}: ${formatUnits(balance, 18)} MON`,
                    },
                ],
            };
        } catch (error) {
            // If the balance check process fails, return a graceful message back to the MCP client indicating a failure.
            return {
                content: [
                    {
                        type: "text",
                        text: `Failed to retrieve balance for address: ${address}. Error: ${
                        error instanceof Error ? error.message : String(error)
                        }`,
                    },
                ],
            };
        }
    }
);

server.tool(
    "get-block-number",
    "Get current block number on Monad testnet",
    {},
    async () => {
        try {
            const blockNumber = await publicClient.getBlockNumber();
            return {
                content: [
                    {
                        type: "text",
                        text: `Current block number: ${blockNumber.toString()}`,
                    },
                ],
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Failed to retrieve block number. Error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    }
);

server.tool(
    "get-code",
    "Get contract bytecode for an address on Monad testnet",
    {
        address: z.string().describe("Monad testnet address to get code for"),
    },
    async ({ address }) => {
        try {
            const code = await publicClient.getCode({ address: address as `0x${string}` });
            return {
                content: [
                    {
                        type: "text",
                        text: `Code for ${address}: ${code}`,
                    },
                ],
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Failed to retrieve code for address: ${address}. Error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    }
);

server.tool(
    "get-block",
    "Get block details by number or hash",
    {
        blockNumber: z.string().optional(),
        blockHash: z.string().optional(),
    },
    async ({ blockNumber, blockHash }) => {
        try {
            let block;
            if (blockNumber) {
                block = await publicClient.getBlock({ blockNumber: BigInt(blockNumber) });
            } else if (blockHash) {
                block = await publicClient.getBlock({ blockHash: blockHash as `0x${string}` });
            } else {
                throw new Error("Must provide blockNumber or blockHash");
            }
            return { content: [{ type: "text", text: JSON.stringify(block) }] };
        } catch (error) {
            return { content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }] };
        }
    }
);

server.tool(
    "get-transaction",
    "Get transaction details by hash",
    {
        hash: z.string().describe("Transaction hash"),
    },
    async ({ hash }) => {
        try {
            const tx = await publicClient.getTransaction({ hash: hash as `0x${string}` });
            return { content: [{ type: "text", text: JSON.stringify(tx) }] };
        } catch (error) {
            return { content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }] };
        }
    }
);

server.tool(
    "get-transaction-receipt",
    "Get transaction receipt by hash",
    {
        hash: z.string().describe("Transaction hash"),
    },
    async ({ hash }) => {
        try {
            const receipt = await publicClient.getTransactionReceipt({ hash: hash as `0x${string}` });
            return { content: [{ type: "text", text: JSON.stringify(receipt) }] };
        } catch (error) {
            return { content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }] };
        }
    }
);

server.tool(
    "get-gas-price",
    "Get current gas price",
    {},
    async () => {
        try {
            const gasPrice = await publicClient.getGasPrice();
            return { content: [{ type: "text", text: gasPrice.toString() }] };
        } catch (error) {
            return { content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }] };
        }
    }
);

server.tool(
    "get-logs",
    "Get logs for an address or contract",
    {
        address: z.string().optional(),
        fromBlock: z.string().optional(),
        toBlock: z.string().optional(),
    },
    async ({ address, fromBlock, toBlock }) => {
        try {
            const logs = await publicClient.getLogs({
                address: address as `0x${string}` | undefined,
                fromBlock: fromBlock ? BigInt(fromBlock) : undefined,
                toBlock: toBlock ? BigInt(toBlock) : undefined,
            });
            return { content: [{ type: "text", text: JSON.stringify(logs) }] };
        } catch (error) {
            return { content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }] };
        }
    }
);

server.tool(
    "get-storage-at",
    "Get storage value at a slot for a contract",
    {
        address: z.string().describe("Contract address"),
        slot: z.string().describe("Storage slot (hex or decimal)"),
    },
    async ({ address, slot }) => {
        try {
            const value = await publicClient.getStorageAt({
                address: address as `0x${string}`,
                slot: slot as `0x${string}`,
            });
            return { content: [{ type: "text", text: String(value) }] };
        } catch (error) {
            return { content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }] };
        }
    }
);

server.tool(
    "get-transaction-count",
    "Get transaction count (nonce) for an address",
    {
        address: z.string().describe("Address to get nonce for"),
    },
    async ({ address }) => {
        try {
            const count = await publicClient.getTransactionCount({ address: address as `0x${string}` });
            return { content: [{ type: "text", text: count.toString() }] };
        } catch (error) {
            return { content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }] };
        }
    }
);

server.tool(
    "get-chain-id",
    "Get current chain ID",
    {},
    async () => {
        try {
            const chainId = await publicClient.getChainId();
            return { content: [{ type: "text", text: chainId.toString() }] };
        } catch (error) {
            return { content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }] };
        }
    }
);

    // Connect to the MCP server
    await server.connect(transport);
  } else {
    // Invalid request
    res.status(400).json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Bad Request: No valid session ID provided',
      },
      id: null,
    });
    return;
  }

  // Handle the request
  await transport.handleRequest(req, res, req.body);
});

// Reusable handler for GET and DELETE requests
const handleSessionRequest = async (req: express.Request, res: express.Response) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }
  
  const transport = transports[sessionId];
  await transport.handleRequest(req, res);
};

// Handle GET requests for server-to-client notifications via SSE
app.get('/mcp', handleSessionRequest);

// Handle DELETE requests for session termination
app.delete('/mcp', handleSessionRequest);

app.listen(80);