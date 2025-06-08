import { ImageResponse } from 'next/og'

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 128,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          textAlign: 'center',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
        }}
      >
        <div style={{ fontSize: 80, marginBottom: 20 }}>🐕🐱🦊</div>
        <div style={{ fontSize: 60, fontWeight: 'bold' }}>SignalCast</div>
        <div style={{ fontSize: 32, marginTop: 20 }}>去中心化链上跟单</div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
} 