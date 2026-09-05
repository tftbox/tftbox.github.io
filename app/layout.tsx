import type { Metadata, Viewport } from 'next'
import './globals.css'
import NavBar from '@/components/NavBar'
import { CURRENT_SET } from '@/lib/set-data'

export const metadata: Metadata = {
  title: 'TFT 툴',
  description: '배치 · 유물 · 상징을 한 곳에서 보는 롤토체스 도구',
}

export const viewport: Viewport = {
  themeColor: '#0a0d14',
  // 배치판을 손가락으로 확대할 일이 있으므로 확대를 막지 않는다
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <NavBar setNumber={CURRENT_SET} />
        <main className="pb-navbar mx-auto max-w-[1400px] px-3 pt-3 md:px-5 md:pt-5">{children}</main>
      </body>
    </html>
  )
}
