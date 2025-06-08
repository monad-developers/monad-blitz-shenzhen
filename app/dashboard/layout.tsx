import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SignalCast Dashboard',
  description: '查看交易动态和排行榜',
  other: {
    'fc:frame': 'vNext',
    'fc:frame:image': 'https://signalcast-demo.vercel.app/api/og',
    'fc:frame:button:1': 'Timeline',
    'fc:frame:button:2': 'Leaderboard', 
    'fc:frame:button:3': 'Summarize',
    'fc:frame:post_url': 'https://signalcast-demo.vercel.app/api/frame',
    'og:title': 'SignalCast - 去中心化链上跟单',
    'og:description': '通过AI宠物跟踪投资动态',
    'og:image': 'https://signalcast-demo.vercel.app/api/og',
    'twitter:card': 'summary_large_image',
    'twitter:title': 'SignalCast Dashboard',
    'twitter:description': '查看交易动态和排行榜',
    'twitter:image': 'https://signalcast-demo.vercel.app/api/og',
  },
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
} 