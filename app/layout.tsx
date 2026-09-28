import type { Metadata, Viewport } from 'next'
import { Jua } from 'next/font/google'
import './globals.css'
import NavBar from '@/components/NavBar'
import { AuthProvider } from '@/lib/auth-context'
import { CURRENT_SET } from '@/lib/set-data'

export const metadata: Metadata = {
  title: '밤돌지지 - 얘들아 롤체하자',
  description: '배치 · 유물 · 상징을 한 곳에서 보는 롤토체스 도구',
}

// 사이트 이름에만 쓰는 둥근 글씨체 (빌드 때 내려받아 같이 배포된다)
const jua = Jua({ weight: '400', subsets: ['latin'], variable: '--font-jua', display: 'swap' })

export const viewport: Viewport = {
  themeColor: '#fbf4e8',
  // 배치판을 손가락으로 확대할 일이 있으므로 확대를 막지 않는다
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={jua.variable}>
      <body>
        <AuthProvider>
          <NavBar setNumber={CURRENT_SET} />
          <main className="pb-navbar mx-auto max-w-[1400px] px-3 pt-3 md:px-5 md:pt-5">{children}</main>
        </AuthProvider>
      </body>
    </html>
  )
}
