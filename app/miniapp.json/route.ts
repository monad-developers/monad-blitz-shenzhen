import { NextResponse } from 'next/server'

export async function GET() {
  const miniappConfig = {
    name: "SignalCast",
    description: "Track and follow trades from people you follow on Farcaster with AI pets.",
    url: "https://signalcast.vercel.app",
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png"
      }
    ]
  }

  return NextResponse.json(miniappConfig, {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600'
    }
  })
} 