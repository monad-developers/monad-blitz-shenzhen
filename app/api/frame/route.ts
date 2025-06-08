import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { buttonIndex, fid } = body

    // 根据按钮索引处理不同的操作
    switch (buttonIndex) {
      case 1: // Timeline
        return NextResponse.json({
          type: 'frame',
          frameUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard?tab=timeline`
        })
      
      case 2: // Leaderboard
        return NextResponse.json({
          type: 'frame',
          frameUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard?tab=leaderboard`
        })
      
      case 3: // Summarize
        return NextResponse.json({
          type: 'message',
          message: `用户 ${fid} 的交易总结：过去7天共监控到15笔交易，总价值$12,450。其中大额交易3笔，建议关注@bootoshi和@alise的投资动向。`
        })
      
      default:
        return NextResponse.json({
          type: 'frame',
          frameUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard`
        })
    }
  } catch (error) {
    console.error('Frame API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'SignalCast Frame API is running'
  })
} 