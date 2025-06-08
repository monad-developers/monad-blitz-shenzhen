"use client";

import Link from "next/link";
import type { NextPage } from "next";
import { BoltIcon, BookOpenIcon, BugAntIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Address } from "~~/components/scaffold-eth";
import { useEffect, useState } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
// import ShortzyABI from "../contracts/Shortzy.json";
import SHORTZY_ABI from "../contracts/Shortzy";


const contractAddress = "0x3d91e5AC2d499fF3Da3Cd2690705Cc7e163AF32D";



const getTokenPrice = (tokenId: string, vsCurrency: string = 'usd'): Promise<number> => {
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${tokenId}&vs_currencies=${vsCurrency}`;

  return fetch(url, {
    method: 'GET'
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      // 从响应中提取价格数值
      const price = data[tokenId]?.[vsCurrency];

      if (price === undefined) {
        throw new Error(`未找到 ${tokenId} 的 ${vsCurrency} 价格`);
      }

      return price;
    })
    .catch(error => {
      console.error('获取代币价格失败:', error);
      throw error;
    });
};

const Home = () => {
  const [tokensWithPrices, setTokensWithPrices] = useState([
    { symbol: "DOGE", address: "0xba2ae424d960c26247dd6c32edc70b295c744c43", id: "dogecoin", price: 0 },
    { symbol: "SHIBA", address: "0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce", id: "shiba-inu", price: 0 },
  ]);
  const [processedRecords, setProcessedRecords] = useState([]);
  const [tokenPrices, setTokenPrices] = useState<{ [key: string]: number }>({});
  const [loadingPrices, setLoadingPrices] = useState(true);
  const { address: connectedAddress } = useAccount();
  const [selectedToken, setSelectedToken] = useState(tokensWithPrices[0]);
  const [usdcAmount, setUsdcAmount] = useState("100");
  const [txHash, setTxHash] = useState<string | null>(null);
  const { data: shortingUsersCount } = useReadContract({
    abi: SHORTZY_ABI,
    address: contractAddress,
    functionName: "getShortingUsersCount",
  });
  const { data: userShortRecords, isLoading: loadingRecords, isError: recordsError } = useReadContract({
    abi: SHORTZY_ABI,
    address: contractAddress,
    functionName: "getUserShorts",
    args: [connectedAddress],
  });

  // 然后使用shortingUsersCount来显示做空用户数量
  const { writeContract, isPending, failureReason } = useWriteContract()



  useEffect(() => {
    const fetchTokenPrices = async () => {
      try {
        // 创建一个Promise数组来并行获取所有代币价格
        const pricePromises = tokensWithPrices.map(async (token) => {
          const price = await getTokenPrice(token.id.toString());
          return { ...token, price }; // 返回带有新价格的token对象
        });

        console.log(`pricePromises: ${pricePromises}`)

        // 等待所有价格获取完成
        const updatedTokens = await Promise.all(pricePromises);
        setTokensWithPrices(updatedTokens); // 更新状态
      } catch (error) {
        console.error("获取代币价格失败:", error);
        // 可以在这里添加错误处理逻辑
      }
    };

    fetchTokenPrices(); // 调用函数获取价格
  }, []); // 空依赖数组表示只在组件挂载时执行一次

  useEffect(() => {
    if (userShortRecords && tokensWithPrices) {
      const recordsWithPNL = calculateUserShortPNL(userShortRecords, tokensWithPrices);
      setProcessedRecords(recordsWithPNL);
    }
  }, [userShortRecords, tokensWithPrices]);


  const calculateUserShortPNL = (userShortRecords: any, tokensWithPrices: any) => {
    if (!userShortRecords || !tokensWithPrices) return [];

    return userShortRecords.map(record => {
      // 从合约获取的数据需要除以10^18转换为实际数值
      const entryPrice = Number(record.entryPrice) / 10 ** 18;
      const tokenAmount = Number(record.tokenAmount) / 10 ** 18; // 假设tokenAmount也需要转换

      // 找到当前代币的价格
      const currentTokenPrice = tokensWithPrices.find(
        token => token.address.toLowerCase() === record.token.toLowerCase()
      )?.price || 0;

      // 计算PNL: (entryPrice - currentPrice) * tokenAmount (做空盈利逻辑)
      const pnl = (entryPrice - currentTokenPrice) * tokenAmount;

      return {
        ...record,
        currentPrice: currentTokenPrice,
        pnl: pnl
      };
    });
  };


  const handleShort = () => {
    if (!usdcAmount || Number(usdcAmount) <= 0) {
      alert("请输入正确的做空 USDC 数量");
      return;
    }
    let tokenPrice = selectedToken.price;
    try {
      writeContract({
        abi: SHORTZY_ABI,
        address: contractAddress,
        functionName: 'short',
        args: [
          selectedToken.address,
          Number(usdcAmount),
          Number(tokenPrice * 10 ** 18)
        ],
      })
    } catch (e) {
      console.error(e);
    }
  };

  const handleCloseShort = (tokenAddress: string, pnl: number) => {
    if (!connectedAddress) {
      alert("请先连接钱包");
      return;
    }

    try {
      writeContract({
        abi: SHORTZY_ABI,
        address: contractAddress,
        functionName: 'closeShort',
        args: [
          tokenAddress,
          Math.floor(pnl) // 将PNL转换为整数，因为合约中pnl是int256类型
        ],
      });
    } catch (e) {
      console.error("关闭做空失败:", e);
    }
  };

  return (
    <div className="flex items-center flex-col flex-grow pt-10 px-4 max-w-lg mx-auto">
      <h1 className="text-4xl font-bold text-center mb-4">🚀 Shortzy 做空平台</h1>
      <p className="text-center text-lg mb-6">
        目前已有{" "}
        <span className="font-bold text-red-500">{Number(shortingUsersCount)}</span> 人做空！
      </p>

      {/* Token 选择 */}
      <label className="block mb-2 font-semibold">选择做空代币</label>
      <select
        className="input input-bordered w-full mb-4"
        value={selectedToken.address}
        onChange={(e) => {
          const token = tokensWithPrices.find((t) => t.address === e.target.value);
          if (token) setSelectedToken(token);
        }}
      >
        {tokensWithPrices.map((token) => (
          <option key={token.address} value={token.address}>
            {token.symbol} - 当前价格：${token.price.toFixed(6)}
          </option>
        ))}
      </select>

      {/* USDC 输入 */}
      <label className="block mb-2 font-semibold">做空金额 (USDC)</label>
      <input
        type="number"
        min="0"
        step="0.01"
        className="input input-bordered w-full mb-6"
        value={usdcAmount}
        onChange={(e) => setUsdcAmount(e.target.value)}
        placeholder="输入做空的 USDC 数量"
      />

      <button
        onClick={handleShort}
        disabled={isPending}
        className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl text-lg font-semibold w-full"
      >
        {isPending ? "🚀 正在提交做空交易..." : "🚀 做空"}
      </button>

      {txHash && (
        <div className="mt-6 text-center">
          <p className="text-green-500 font-semibold">交易已提交！</p>
          <a
            className="underline text-blue-500 break-all"
            href={`https://explorer.monad.xyz/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            查看交易: {txHash}
          </a>
        </div>
      )}

      {connectedAddress && (
        <div className="mt-10 text-center">
          <p className="font-medium">Connected 地址:</p>
          <Address address={connectedAddress} />
        </div>
      )}

      {failureReason && (
        <p className="mt-4 text-red-600 font-semibold">
          交易出错: {failureReason.message}
        </p>
      )}


      <div className="mt-10 w-full">
        <h2 className="text-2xl font-bold mb-4">我的做空记录</h2>

        {loadingRecords ? (
          <p className="text-gray-500">加载中...</p>
        ) : processedRecords.length === 0 ? (
          <p className="text-gray-500">暂无做空记录</p>
        ) : (
          <div className="space-y-4">
            {processedRecords.map((record: any, index: number) => {
              // 尝试从record中提取字段，由于不知道具体结构，使用安全访问方式
              const token = record?.token || '未知代币';
              const tokenAmount = record?.tokenAmount?.toString() || '0';
              const entryPrice = record?.entryPrice?.toString() || '0';
              const startTime = record?.startTime ? new Date(Number(record.startTime) * 1000).toLocaleString() : '未知时间';
              const endTime = record?.endTime === 0 ? '进行中' : new Date(Number(record.endTime) * 1000).toLocaleString();
              const pnl = record.pnl;

              // 判断是否可以关闭做空（endTime为0表示进行中）
              const canClose = Number(record.endTime) == 0;



              return (
                <div key={index} className="border rounded-lg p-4 bg-red-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">代币</p>
                      <p className="font-medium">{token}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">数量</p>
                      <p className="font-medium">{tokenAmount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">入场价格</p>
                      <p className="font-medium">{entryPrice}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">开始时间</p>
                      <p className="font-medium">{startTime}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">结束时间</p>
                      <p className="font-medium">{endTime}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">PNL</p>
                      <p className="font-medium">{pnl}</p>
                    </div>
                  </div>

                  {canClose && (
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => handleCloseShort(record.token, pnl)}
                        disabled={isPending}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                      >
                        {isPending ? "处理中..." : "关闭做空"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};


export default Home;
