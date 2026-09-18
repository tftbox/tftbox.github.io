'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import clsx from 'clsx'
import type { SetData } from '@/lib/types'
import DeckLibrary from './DeckLibrary'
import ComingSoon from './ComingSoon'

type Tab = 'decks' | 'items' | 'augments'

const TABS: { key: Tab; label: string }[] = [
  { key: 'decks', label: '내 덱' },
  { key: 'items', label: '아이템 순위' },
  { key: 'augments', label: '증강체 순위' },
]

/**
 * "내 덱" 페이지 안에서 탭으로 화면을 바꾼다. 아이템·증강체 순위는 내용이 아직 없다.
 * 지금 탭을 ?tab= 주소에 남겨서, 배치툴 같은 다른 화면에서 특정 탭으로 바로 링크할 수 있게 한다.
 */
export default function DeckTabs({ data }: { data: SetData }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  const tab: Tab = tabParam === 'items' || tabParam === 'augments' ? tabParam : 'decks'

  const setTab = (next: Tab) => {
    router.replace(next === 'decks' ? '/decks' : `/decks?tab=${next}`)
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
      {tab === 'items' && <ComingSoon title="아이템 순위" />}
      {tab === 'augments' && <ComingSoon title="증강체 순위" />}
    </div>
  )
}
