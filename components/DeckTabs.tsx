'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import clsx from 'clsx'
import type { SetData } from '@/lib/types'
import DeckLibrary from './DeckLibrary'
import ItemRankings from './ItemRankings'
import ArtifactRankings from './ArtifactRankings'
import EmblemRankings from './EmblemRankings'

type Tab = 'decks' | 'items' | 'artifacts' | 'emblems'

const TABS: { key: Tab; label: string }[] = [
  { key: 'decks', label: '내 덱' },
  { key: 'items', label: '아이템 순위' },
  { key: 'artifacts', label: '유물 순위' },
  { key: 'emblems', label: '상징 순위' },
]

/**
 * "내 덱" 페이지 안에서 탭으로 화면을 바꾼다.
 *
 * 탭은 화면 안의 상태로만 바꾼다. 예전엔 탭을 누를 때마다 라우터로 주소를 바꿨는데,
 * 그러면 서버에서 페이지 데이터를 다시 받아 와야 화면이 바뀌어서 네트워크가 느리거나
 * 실패하면 눌러도 반응이 없었다. 주소(?tab=)는 새로고침해도 그 탭이 유지되도록
 * 조용히 덧써 두기만 하고, 처음 열 때만 읽는다.
 */
export default function DeckTabs({ data }: { data: SetData }) {
  const searchParams = useSearchParams()
  const [tab, setTabState] = useState<Tab>(() => {
    const param = searchParams.get('tab')
    return param === 'items' || param === 'artifacts' || param === 'emblems' ? param : 'decks'
  })

  const setTab = (next: Tab) => {
    setTabState(next)
    const url = next === 'decks' ? '/decks/' : `/decks/?tab=${next}`
    window.history.replaceState(window.history.state, '', url)
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-1 rounded-xl border border-ink-800 bg-ink-900 p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={clsx(
              'flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
              tab === t.key ? 'bg-accent text-ink-950' : 'text-ink-400 hover:bg-ink-850 hover:text-ink-200'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'decks' && <DeckLibrary data={data} />}
      {tab === 'items' && <ItemRankings data={data} />}
      {tab === 'artifacts' && <ArtifactRankings data={data} />}
      {tab === 'emblems' && <EmblemRankings data={data} />}
    </div>
  )
}
