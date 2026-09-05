'use client'

import { useEffect, useRef } from 'react'

/**
 * 모바일에서는 아래에서 올라오는 시트, 데스크톱에서는 가운데 뜨는 창.
 * 두 화면 크기에서 같은 컴포넌트를 쓰기 위한 껍데기.
 */
export default function Sheet({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  // 시트가 열려 있는 동안 뒤 배경이 스크롤되지 않게 한다
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)

    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  // 시트를 여는 손동작이 끝나면서 생기는 click이 갓 나타난 배경 위에 떨어져
  // 시트가 열리자마자 닫히는 일이 있다. 배경에서 눌러서 배경에서 뗀 경우에만 닫는다.
  const pressedBackdrop = useRef(false)

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 md:items-center"
      onPointerDown={(e) => {
        pressedBackdrop.current = e.target === e.currentTarget
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && pressedBackdrop.current) onClose()
        pressedBackdrop.current = false
      }}
    >
      <div className="thin-scroll max-h-[85vh] w-full overflow-y-auto rounded-t-2xl border border-ink-800 bg-ink-900 pb-[env(safe-area-inset-bottom)] md:max-w-lg md:rounded-2xl">
        {children}
      </div>
    </div>
  )
}
