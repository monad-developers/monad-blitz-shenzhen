import { NextRequest, NextResponse } from "next/server";
import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk";
import { supabase } from "../../../lib/supabase";
import { ethers } from "ethers";
import { SimplifiedTransaction } from "../../../lib/types";

// 初始化 Neynar 客户端
if (!process.env.NEYNAR_API_KEY) {
  throw new Error("NEYNAR_API_KEY is not set in .env.local");
}
const neynarClient = new NeynarAPIClient(new Configuration({
    apiKey: process.env.NEYNAR_API_KEY,
}));

// GoldRush API Configuration
const GOLDRUSH_API_KEY = process.env.GOLDRUSH_API_KEY;
const GOLDRUSH_API_BASE_URL = "https://api.covalenthq.com/v1";

// 解析从 GoldRush API 获取的原始交易数据
function parseTransaction(tx: any, user: any): SimplifiedTransaction | null {
  const fromAddress = tx.from_address.toLowerCase();
  let sent = null;
  let received = null;

  // 安全检查：确保 log_events 是一个可遍历的数组
  if (tx.log_events && Array.isArray(tx.log_events)) {
    for (const event of tx.log_events) {
      if (event.decoded?.name === 'Transfer') {
        const params = event.decoded.params;
        const transferFrom = params.find((p: any) => p.name === 'from')?.value?.toLowerCase();
        const transferTo = params.find((p: any) => p.name === 'to')?.value?.toLowerCase();
        const value = params.find((p: any) => p.name === 'value')?.value;

        if (!transferFrom || !transferTo || !value) continue;

        const tokenAmount = ethers.formatUnits(value, event.sender_contract_decimals || 18);
        
        const tokenDetails = {
          token: event.sender_contract_ticker_symbol || 'Unknown',
          amount: parseFloat(tokenAmount).toLocaleString('en-US', { maximumFractionDigits: 4 }),
          logo: event.sender_logo_url
        };

        if (transferFrom === fromAddress && !sent) {
          sent = tokenDetails;
        }
        
        if (transferTo === fromAddress && !received) {
          received = tokenDetails;
        }
      }
    }
  }

  // 根据解析出的 sent 和 received 来确定操作类型
  let action: SimplifiedTransaction['action'] = 'Other';
  if (sent && received) {
    action = 'Swap';
  } else if (sent) {
    action = 'Transfer';
  } else if (tx.log_events && Array.isArray(tx.log_events) && tx.log_events.some((e: any) => e.decoded?.name === 'Approval')) {
    action = 'Approval';
  }

  // 对于Swap和Transfer，我们需要它们有价值才展示
  if ((action === 'Swap' || action === 'Transfer') && (tx.value_quote > 1 || tx.gas_quote > 0.1)) {
     return {
      tx_hash: tx.tx_hash,
      chain: tx.chain_name,
      timestamp: new Date(tx.block_signed_at).getTime(),
      user: user,
      action: action,
      sent: sent || undefined,
      received: received || undefined,
      usd_value: tx.value_quote
    };
  }

  return null;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 帮助函数：从 GoldRush 获取单个地址和链的交易
async function fetchTransactionsForChain(address: string, chainName: string, user: any) {
  if (!GOLDRUSH_API_KEY) return [];

  const url = `${GOLDRUSH_API_BASE_URL}/${chainName}/address/${address}/transactions_v3/?quote-currency=USD&no-logs=false&page-size=5`;
  try {
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${GOLDRUSH_API_KEY}` }
    });

    if (!response.ok) {
      console.error(`GoldRush API error for ${address} on ${chainName}:`, await response.text());
      return [];
    }
    
    const data = await response.json();
    if (data.error || !data.data?.items) {
      // It's common for addresses to have no transactions, so we don't log an error for that.
      return [];
    }

    const parsedTxs = data.data.items
      .map((tx: any) => parseTransaction(tx, user))
      .filter((tx: SimplifiedTransaction | null): tx is SimplifiedTransaction => tx !== null);
      
    return parsedTxs;
  } catch (e) {
    console.error(`Failed to fetch transactions from GoldRush for ${address} on ${chainName}:`, e);
    return [];
  }
}

export async function GET(req: NextRequest) {
  if (!GOLDRUSH_API_KEY) {
    return NextResponse.json({ message: "GOLDRUSH_API_KEY is not set" }, { status: 500 });
  }
  
  const { searchParams } = new URL(req.url);
  const fidParam = searchParams.get('fid');
  const addressParam = searchParams.get('address');

  if (!fidParam && !addressParam) {
    return NextResponse.json({ message: "fid or address is required" }, { status: 400 });
  }

  try {
    // ---- 分支 1: 按钱包地址查询 ----
    if (addressParam) {
      const address = addressParam.toLowerCase();
      let user = { fid: 0, username: 'unknown', display_name: 'Unknown', pfp_url: '' };

      // 尝试从数据库中查找与该钱包关联的用户信息
      const { data: walletData } = await supabase.from('wallets').select('user_fid').eq('address', address).single();
      if (walletData?.user_fid) {
        const { data: userData } = await supabase.from('users').select('*').eq('fid', walletData.user_fid).single();
        if (userData) {
          user = { fid: userData.fid, username: userData.username, display_name: userData.display_name, pfp_url: userData.pfp_url };
        }
      }
      
      // 同时查询 eth-mainnet 和 monad-testnet
      const ethTxs = await fetchTransactionsForChain(address, "eth-mainnet", user);
      const monadTxs = await fetchTransactionsForChain(address, "monad-testnet", user);
      const transactions = [...ethTxs, ...monadTxs];
      
      transactions.sort((a: SimplifiedTransaction, b: SimplifiedTransaction) => b.timestamp - a.timestamp);
      return NextResponse.json(transactions);
    }

    // ---- 分支 2: 按 FID 查询 ----
    if (fidParam) {
      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          const pushEvent = (event: string, data: object) => {
            controller.enqueue(encoder.encode(`event: ${event}\n`));
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          };

          try {
            const fid = parseInt(fidParam);
            let cursor: string | null = null;
            let aFollowingFound = false;

            do {
              // 1. 按页获取关注者
              const response = await neynarClient.fetchUserFollowing({ fid, limit: 100, cursor: cursor ?? undefined });
              const followingBatch = response.users;
              cursor = response.next.cursor;

              if (followingBatch.length > 0) {
                aFollowingFound = true;
                const followingFids = followingBatch.map(item => item.user.fid);
                const userMap = new Map(followingBatch.map(item => [item.user.fid, item.user]));

                // 2. 获取该批次关注者的钱包
                const { data: wallets, error: dbError } = await supabase
                  .from('wallets')
                  .select('user_fid, address')
                  .in('user_fid', followingFids);

                if (dbError) {
                  console.error("Supabase error fetching wallets for a batch:", dbError);
                  continue; // 跳过此批次
                }

                const evmWallets = wallets ? wallets.filter(w => w.address.startsWith('0x')) : [];

                // 3. 为该批次的每个钱包获取交易并立即推送
                for (const wallet of evmWallets) {
                  const user = userMap.get(wallet.user_fid);
                  if (!user) continue;

                  const ethTxs = await fetchTransactionsForChain(wallet.address, "eth-mainnet", user);
                  const monadTxs = await fetchTransactionsForChain(wallet.address, "monad-testnet", user);
                  
                  const transactions = [...ethTxs, ...monadTxs];
                  if (transactions.length > 0) {
                    pushEvent('transaction', transactions);
                  }
                  await delay(250); // 增加延时以避免API限速
                }
              }
            } while (cursor); // 4. 如果有下一页，则继续循环

            if (!aFollowingFound) {
              pushEvent('done', { message: 'No one followed.' });
            } else {
              pushEvent('done', { message: 'Stream completed' });
            }
          } catch (error) {
            console.error("Streaming error:", error);
            const errorMessage = (error as any).message || 'An unknown error occurred';
            pushEvent('error', { message: "Streaming failed", error: errorMessage });
          } finally {
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

  } catch (error) {
    console.error("Failed to fetch transactions:", error);
    const errorMessage = (error as any).message || 'An unknown error occurred';
    return NextResponse.json({ message: "Failed to fetch transactions", error: errorMessage }, { status: 500 });
  }
  
  return NextResponse.json({ message: "Invalid request" }, { status: 400 });
} 