"use client";

import { useState } from "react";
import { createWalletClient, http, parseEther } from "viem";
// 移除hardhat导入
// import { hardhat } from "viem/chains";
import { useAccount } from "wagmi";
import { BanknotesIcon } from "@heroicons/react/24/outline";
import { useTransactor } from "~~/hooks/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { useWatchBalance } from "~~/hooks/scaffold-eth/useWatchBalance";

// Number of ETH faucet sends to an address
const NUM_OF_ETH = "1";
// 注意：这个地址只在hardhat网络上有效
const FAUCET_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

/**
 * FaucetButton button which lets you grab eth.
 */
export const FaucetButton = () => {
  const { address, chain: ConnectedChain } = useAccount();
  const { targetNetwork } = useTargetNetwork();

  const { data: balance } = useWatchBalance({ address });

  const [loading, setLoading] = useState(false);

  // 使用当前连接的链创建钱包客户端
  const walletClient = ConnectedChain ? createWalletClient({
    chain: ConnectedChain,
    transport: http(),
  }) : null;

  const faucetTxn = useTransactor(walletClient);

  const sendETH = async () => {
    if (!address || !walletClient) return;
    try {
      setLoading(true);
      await faucetTxn({
        account: FAUCET_ADDRESS,
        to: address,
        value: parseEther(NUM_OF_ETH),
      });
      setLoading(false);
    } catch (error) {
      console.error("⚡️ ~ file: FaucetButton.tsx:sendETH ~ error", error);
      setLoading(false);
    }
  };

  // 在Monad测试网上，我们不显示Faucet按钮，因为我们没有控制测试网的水龙头
  // 如果需要在Monad测试网上添加水龙头功能，需要修改这里的逻辑
  if (!targetNetwork.testnet || targetNetwork.id === 10143) {
    return null;
  }

  return (
    <div onClick={sendETH} className="btn btn-secondary btn-sm px-2 rounded-full">
      {!loading ? (
        <BanknotesIcon className="h-4 w-4" />
      ) : (
        <span className="loading loading-spinner loading-xs"></span>
      )}
      <span className="ml-1">Faucet</span>
    </div>
  );
};
