'use client';

import './globals.css';
import { AuthKitProvider } from '@farcaster/auth-kit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { optimism, mainnet } from 'wagmi/chains';
import React from 'react';

// 注意：由于我们在 'use client' 组件中，所以不能导出 'metadata' 对象。
// 您需要将元数据处理移至特定页面或另一个服务器组件。
// 为了让应用能运行，我暂时注释掉了它。
// export const metadata = {
//   title: 'SignalCast - 去中心化链上跟单',
//   description: '通过AI宠物跟踪Farcaster上关注者的投资动态',
//   manifest: '/manifest.json',
//   other: {
//     'viewport': 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
//     'apple-mobile-web-app-capable': 'yes',
//     'apple-mobile-web-app-status-bar-style': 'default',
//     'apple-mobile-web-app-title': 'SignalCast',
//     'mobile-web-app-capable': 'yes',
//   },
// };

// 这个配置对象向 Farcaster 官方认证服务表明了我们应用的身份，是解决 401 错误的关键。
const config = {
  rpcUrl: 'https://mainnet.optimism.io',
};

const wagmiConfig = createConfig({
  chains: [mainnet, optimism],
  transports: {
    [mainnet.id]: http(),
    [optimism.id]: http(),
  },
});

const queryClient = new QueryClient();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        <title>SignalCast - 去中心化链上跟单</title>
        <meta name="description" content="通过AI宠物跟踪Farcaster上关注者的投资动态" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SignalCast" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="bg-gradient-to-br from-purple-50 to-blue-50 min-h-screen">
        <WagmiProvider config={wagmiConfig}>
          <QueryClientProvider client={queryClient}>
            <AuthKitProvider config={config}>
                {children}
            </AuthKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </body>
    </html>
  );
} 