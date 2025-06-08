import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    name: 'SignalCast',
    version: '1.0.0',
    description: 'AI pet that helps you follow trader signals on Farcaster',
    url: 'https://signalcast.vercel.app',
    status: 'active',
    miniapp: true,
    features: [
      'pet-selection',
      'trade-tracking',
      'leaderboard',
      'farcaster-integration'
    ]
  })
}

export async function POST() {
  return NextResponse.json({
    message: 'SignalCast Mini App is ready for Farcaster integration'
  })
} 