'use client'

import FarcasterConnect from '@/components/FarcasterConnect'
import { useProfile, useSignIn } from '@farcaster/auth-kit'
import '@farcaster/auth-kit/styles.css'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const { isAuthenticated, loading: profileLoading } = useProfile()
  const { signIn } = useSignIn()

  useEffect(() => {
    // 如果用户已认证，则直接跳转到设置页面
    if (isAuthenticated) {
      router.push('/setup')
    } 
    // 否则，如果用户未认证且我们没有在等待加载，则触发登录
    else if (!isAuthenticated && !profileLoading) {
      signIn()
    }
  }, [isAuthenticated, profileLoading, signIn, router])

  // 这个页面现在是一个纯粹的加载/登录中转页
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-6">
      <div className="w-full max-w-sm mx-auto bg-white rounded-xl shadow-lg p-8 space-y-6">
        <div className="flex flex-col items-center space-y-2">
          <h1 className="text-2xl font-bold text-gray-800">SignalCast</h1>
          
          <p className="text-center text-gray-500 h-10">
            {profileLoading
              ? '正在检查登录状态...'
              : '请在弹窗中授权以连接您的 Farcaster 账户...'}
          </p>
        </div>

        {/* 
          保留一个登录按钮，以防自动弹窗被浏览器阻止。
          登录成功后，上面的 useEffect 会处理跳转。
        */}
        <div className="flex justify-center">
          <FarcasterConnect />
        </div>
      </div>

      <footer className="mt-8 text-center text-xs text-gray-400">
        <p>这是一个 Farcaster Frame 应用</p>
      </footer>
    </main>
  )
} 