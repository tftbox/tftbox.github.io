'use client'

import { useState } from 'react'
import { Search, X } from 'lucide-react'
import clsx from 'clsx'
import type { SetData } from '@/lib/types'
import { ITEM_TABS } from './itemTabs'
import ItemRecipeTooltip from './ItemRecipeTooltip'

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
              'group/tip relative aspect-square select-none transition-transform active:scale-95',
              pendingItemId === item.id && 'ring-2 ring-accent'
            )}
          >
            <span className="block h-full w-full overflow-hidden rounded-lg bg-ink-850 p-1">
              {item.icon && (
                <img src={item.icon} alt={item.name} className="h-full w-full object-contain" draggable={false} />
              )}
            </span>

            {/* 마우스를 올리면 재료 아이콘·이름이 뜬다. 브라우저 기본 title 툴팁은
                한글 텍스트만 나와 가독성이 떨어져서, 아이콘이 들어간 것을 직접 그린다. */}
            {item.from.length > 0 && (
              <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1 hidden w-max max-w-[220px] -translate-x-1/2 rounded-lg bg-ink-950 px-2 py-1.5 text-[11px] text-white shadow-lg ring-1 ring-ink-700 group-hover/tip:block">
                <p className="mb-1 whitespace-nowrap font-semibold">{item.name}</p>
                <ItemRecipeTooltip item={item} />
              </div>
            )}
          </button>
        ))}

        {list.length === 0 && <p className="col-span-full py-8 text-center text-xs text-ink-400">결과가 없습니다.</p>}
      </div>
    </section>
  )
}
