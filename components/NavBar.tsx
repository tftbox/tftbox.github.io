'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Gem, Grid3x3, Library, Lock, Sparkles, Unlock } from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '@/lib/auth-context'
import LoginSheet from './LoginSheet'

/** 화면에 표시되는 사이트 이름. 주소(tftbox.github.io)는 그대로 두고 이 글자만 바꾼다. */
const SITE_NAME = '밤돌지지 - 얘들아 롤체하자'

const TABS = [
  { href: '/', label: '배치툴', Icon: Grid3x3 },
  { href: '/artifacts', label: '유물', Icon: Gem },
  { href: '/emblems', label: '상징', Icon: Sparkles },
  { href: '/decks', label: '내 덱', Icon: Library },
]

export default function NavBar({ setNumber }: { setNumber: number }) {
  const pathname = usePathname()
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href))
  const { isOwner, loading, signOut } = useAuth()
  const [loginOpen, setLoginOpen] = useState(false)

  const authButton = (size: number, className: string) =>
    !loading && (
      <button
        type="button"
        onClick={() => (isOwner ? signOut() : setLoginOpen(true))}
        aria-label={isOwner ? '로그아웃' : '로그인'}
        title={isOwner ? '로그아웃 (지금은 저장 · 수정 · 삭제가 가능한 상태)' : '로그인 (본인만 — 저장 · 수정 · 삭제용)'}
        className={className}
      >
        {isOwner ? <Unlock size={size} /> : <Lock size={size} />}
      </button>
    )

  return (
    <>
      {/* 데스크톱: 상단 바 */}
      <header className="sticky top-0 z-40 hidden border-b border-ink-800 bg-ink-950/90 backdrop-blur md:block">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-6 px-5">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="text-lg font-bold tracking-tight text-white">{SITE_NAME}</span>
            <span className="text-xs text-ink-400">시즌 {setNumber}</span>
          </Link>
          <nav className="flex items-center gap-1">
            {TABS.map(({ href, label, Icon }) => (
              <Link
                key={href}
                href={href}
                className={clsx(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive(href) ? 'bg-ink-800 text-white' : 'text-ink-400 hover:bg-ink-900 hover:text-ink-200'
                )}
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
          </nav>
          {authButton(15, clsx('ml-auto rounded-lg p-2 transition-colors', isOwner ? 'text-accent hover:bg-accent/10' : 'text-ink-500 hover:bg-ink-900 hover:text-ink-300'))}
        </div>
      </header>

      {/* 모바일: 상단 타이틀 + 하단 탭바 */}
      <header className="sticky top-0 z-40 flex h-12 items-center justify-between border-b border-ink-800 bg-ink-950/90 px-4 backdrop-blur md:hidden">
        <span className="min-w-0 flex-1 truncate font-bold text-white">{SITE_NAME}</span>
        <span className="shrink-0 pl-2 text-xs text-ink-400">시즌 {setNumber}</span>
        {authButton(16, clsx('shrink-0 rounded-lg p-1.5 pl-2', isOwner ? 'text-accent' : 'text-ink-500'))}
      </header>

      {loginOpen && <LoginSheet onClose={() => setLoginOpen(false)} />}

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-800 bg-ink-900/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <div className="grid grid-cols-4">
          {TABS.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors',
                isActive(href) ? 'text-accent' : 'text-ink-400'
              )}
            >
              <Icon size={20} />
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  )
}
