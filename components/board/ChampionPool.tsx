'use client'

import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import clsx from 'clsx'
import type { Champion, Trait } from '@/lib/types'
import { COST_COLOR } from '@/lib/synergy'

interface Props {
  champions: Champion[]
  traits: Trait[]
  /** 지금 배치판에 올라가 있는 챔피언 id (중복 표시용) */
  placedIds: Set<string>
  pendingChampionId: string | null
  /** 끌어서 배치판에 놓기 시작할 때 */
  onDragStart: (e: React.PointerEvent, championId: string) => void
}

const COSTS = [1, 2, 3, 4, 5]

export default function ChampionPool({ champions, traits, placedIds, pendingChampionId, onDragStart }: Props) {
  const [query, setQuery] = useState('')
  const [cost, setCost] = useState<number | null>(null)
  const [trait, setTrait] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return champions.filter((c) => {
      if (cost && c.cost !== cost) return false
      if (trait && !c.traits.includes(trait)) return false
      if (!q) return true
      return c.name.toLowerCase().includes(q) || c.traits.some((t) => t.toLowerCase().includes(q))
    })
  }, [champions, query, cost, trait])

  const resetFilters = () => {
    setQuery('')
    setCost(null)
    setTrait(null)
  }

  const hasFilter = !!query || cost !== null || trait !== null

  return (
    <section className="rounded-xl border border-ink-800 bg-ink-900">
      <div className="sticky top-12 z-20 space-y-2 rounded-t-xl border-b border-ink-800 bg-ink-900 p-3 md:top-14">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="챔피언 · 특성 검색"
            className="w-full rounded-lg bg-ink-850 py-2 pl-9 pr-9 text-sm text-white placeholder:text-ink-400"
          />
          {hasFilter && (
            <button
              type="button"
              onClick={resetFilters}
              aria-label="검색 조건 지우기"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-ink-400 hover:text-white"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className="thin-scroll -mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
          {COSTS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCost(cost === c ? null : c)}
              className={clsx(
                'shrink-0 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors',
                cost === c ? 'text-white' : 'bg-ink-850 text-ink-400 hover:text-ink-200'
              )}
              style={cost === c ? { backgroundColor: COST_COLOR[c] } : undefined}
            >
              {c}코
            </button>
          ))}
          <span className="mx-1 w-px shrink-0 bg-ink-700" />
          {traits.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTrait(trait === t.name ? null : t.name)}
              className={clsx(
                'shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                trait === t.name ? 'bg-accent text-ink-950' : 'bg-ink-850 text-ink-400 hover:text-ink-200'
              )}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1.5 p-3 sm:grid-cols-6 lg:grid-cols-5 xl:grid-cols-6">
        {filtered.map((c) => (
          <button
            key={c.id}
            type="button"
            onPointerDown={(e) => onDragStart(e, c.id)}
            // 길게 눌러 끌기를 쓰므로 브라우저의 확대·선택 동작은 꺼 둔다.
            // (세로 스크롤은 그대로 살아 있다)
            style={{ touchAction: 'manipulation', WebkitTouchCallout: 'none' }}
            className={clsx(
              'group relative select-none overflow-hidden rounded-lg text-left transition-transform active:scale-95',
              pendingChampionId === c.id && 'ring-2 ring-accent'
            )}
          >
            <div
              className="aspect-square overflow-hidden rounded-lg border-2"
              style={{ borderColor: COST_COLOR[c.cost] ?? '#6b7280' }}
            >
              {c.icon && <img src={c.icon} alt={c.name} className="h-full w-full object-cover" draggable={false} />}
            </div>
            {placedIds.has(c.id) && (
              <span className="absolute right-1 top-1 rounded bg-accent px-1 text-[9px] font-bold text-ink-950">
                배치됨
              </span>
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-1 pb-0.5 pt-3">
              <span className="block truncate text-[10px] font-medium text-white">{c.name}</span>
            </div>
          </button>
        ))}

        {filtered.length === 0 && (
          <p className="col-span-full py-8 text-center text-xs text-ink-400">조건에 맞는 챔피언이 없습니다.</p>
        )}
      </div>
    </section>
  )
}
