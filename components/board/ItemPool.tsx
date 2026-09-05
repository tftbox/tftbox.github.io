'use client'

import { useState } from 'react'
import { Search, X } from 'lucide-react'
import clsx from 'clsx'
import type { SetData } from '@/lib/types'
import { ITEM_TABS } from './itemTabs'

interface Props {
  data: SetData
  pendingItemId: string | null
  onDragStart: (e: React.PointerEvent, itemId: string) => void
  /** 검색창 옆에 얹을 내용 (챔피언/아이템 전환 버튼). 모바일에서 세로 공간을 아끼려고 별도 줄을 만들지 않는다 */
  headerExtra?: React.ReactNode
}

export default function ItemPool({ data, pendingItemId, onDragStart, headerExtra }: Props) {
  const [tab, setTab] = useState<(typeof ITEM_TABS)[number]['key']>('combined')
  const [query, setQuery] = useState('')

  // 찬란한 아이템처럼 시즌에 따라 아예 없는 분류는 탭을 띄우지 않는다
  const tabs = ITEM_TABS.filter((t) => data.items[t.key].length > 0)

  const q = query.trim().toLowerCase()
  const list = data.items[tab].filter((i) => !q || i.name.toLowerCase().includes(q))

  return (
    <section className="rounded-xl border border-ink-800 bg-ink-900">
      <div className="sticky top-12 z-20 space-y-2 rounded-t-xl border-b border-ink-800 bg-ink-900 p-3 md:top-14">
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="아이템 이름 검색"
              className="w-full rounded-lg bg-ink-850 py-2 pl-9 pr-9 text-sm text-white placeholder:text-ink-400"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="검색어 지우기"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-ink-400 hover:text-white"
              >
                <X size={15} />
              </button>
            )}
          </div>
          {headerExtra}
        </div>

        <div className="thin-scroll -mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={clsx(
                'shrink-0 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors',
                tab === t.key ? 'bg-accent text-ink-950' : 'bg-ink-850 text-ink-400 hover:text-ink-200'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(52px,1fr))] gap-1.5 p-3">
        {list.map((item) => (
          <button
            key={item.id}
            type="button"
            onPointerDown={(e) => onDragStart(e, item.id)}
            // 길게 눌러 끌기를 쓰므로 브라우저의 확대·선택 동작은 꺼 둔다.
            // (세로 스크롤은 그대로 살아 있다)
            style={{ touchAction: 'manipulation', WebkitTouchCallout: 'none' }}
            title={item.name}
            className={clsx(
              'aspect-square select-none overflow-hidden rounded-lg bg-ink-850 p-1 transition-transform active:scale-95',
              pendingItemId === item.id && 'ring-2 ring-accent'
            )}
          >
            {item.icon && <img src={item.icon} alt={item.name} className="h-full w-full object-contain" draggable={false} />}
          </button>
        ))}

        {list.length === 0 && <p className="col-span-full py-8 text-center text-xs text-ink-400">결과가 없습니다.</p>}
      </div>
    </section>
  )
}
