'use client'

import { useMemo, useState } from 'react'
import { Search, Star } from 'lucide-react'
import clsx from 'clsx'
import type { Item, Trait } from '@/lib/types'
import { STYLE_COLOR } from '@/lib/synergy'
import { useNotes } from '@/lib/use-notes'
import { ItemDetail } from '@/components/ArtifactBrowser'

/** 상징 조합에 쓰이는 두 가지 기본 아이템 */
const SPATULA = 'TFT_Item_Spatula'
const FRYING_PAN = 'TFT_Item_FryingPan'

type Filter = 'all' | 'spatula' | 'pan' | 'uncraftable' | 'favorite'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'spatula', label: '뒤집개' },
  { key: 'pan', label: '프라이팬' },
  { key: 'uncraftable', label: '조합 불가' },
  { key: 'favorite', label: '즐겨찾기' },
]

interface Props {
  emblems: Item[]
  traits: Trait[]
  setNumber: number
}

export default function EmblemBrowser({ emblems, traits, setNumber }: Props) {
  const notes = useNotes('emblem')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [opened, setOpened] = useState<Item | null>(null)

  const traitByName = useMemo(() => new Map(traits.map((t) => [t.name, t])), [traits])

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return emblems.filter((item) => {
      const baseIds = item.from.map((f) => f.id)
      if (filter === 'spatula' && !baseIds.includes(SPATULA)) return false
      if (filter === 'pan' && !baseIds.includes(FRYING_PAN)) return false
      if (filter === 'uncraftable' && item.craftable) return false
      if (filter === 'favorite' && !notes.get(item.id).favorite) return false
      if (!q) return true
      return item.name.toLowerCase().includes(q) || (item.traitName ?? '').toLowerCase().includes(q)
    })
  }, [emblems, query, filter, notes])

  return (
    <div className="space-y-3">
      <header className="rounded-xl border border-ink-800 bg-ink-900 p-3">
        <div className="flex items-baseline justify-between">
          <h1 className="text-base font-bold text-white">상징</h1>
          <span className="text-xs text-ink-400">
            시즌 {setNumber} · {emblems.length}종
          </span>
        </div>

        <div className="relative mt-2">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="상징 · 특성 검색"
            className="w-full rounded-lg bg-ink-850 py-2 pl-9 pr-3 text-sm text-white placeholder:text-ink-400"
          />
        </div>

        <div className="thin-scroll mt-2 flex gap-1 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={clsx(
                'shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                filter === f.key ? 'bg-accent text-ink-950' : 'bg-ink-850 text-ink-400 hover:text-ink-200'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {notes.error && <p className="mt-2 text-[11px] text-red-400">{notes.error}</p>}
      </header>

      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((item) => {
          const trait = item.traitName ? traitByName.get(item.traitName) : undefined
          const note = notes.get(item.id)

          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => setOpened(item)}
                className="flex h-full w-full items-start gap-3 rounded-xl border border-ink-800 bg-ink-900 p-3 text-left transition-colors hover:border-ink-600"
              >
                {item.icon && <img src={item.icon} alt="" className="h-12 w-12 shrink-0 rounded-lg" />}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-semibold text-white">{item.traitName}</p>
                    {note.favorite && <Star size={13} className="shrink-0 fill-amber-400 text-amber-400" />}
                  </div>

                  {/* 조합식 */}
                  {item.craftable ? (
                    <div className="mt-1 flex items-center gap-1">
                      {item.from.map((f, i) => (
                        <span key={`${f.id}-${i}`} className="flex items-center gap-1">
                          {i > 0 && <span className="text-[11px] text-ink-400">+</span>}
                          {f.icon && <img src={f.icon} alt={f.name} className="h-5 w-5 rounded" />}
                        </span>
                      ))}
                      <span className="ml-1 truncate text-[11px] text-ink-400">
                        {item.from.map((f) => f.name).join(' + ')}
                      </span>
                    </div>
                  ) : (
                    <p className="mt-1 text-[11px] text-amber-400">조합 불가 (증강체 · 상점에서만)</p>
                  )}

                  {/* 단계 */}
                  {trait && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {trait.effects.map((e) => (
                        <span
                          key={e.min}
                          className="rounded px-1.5 py-0.5 text-[10px] font-bold tabular-nums"
                          style={{ backgroundColor: STYLE_COLOR[e.style].bg, color: STYLE_COLOR[e.style].text }}
                        >
                          {e.min}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </button>
            </li>
          )
        })}

        {list.length === 0 && (
          <li className="col-span-full py-12 text-center text-sm text-ink-400">조건에 맞는 상징이 없습니다.</li>
        )}
      </ul>

      {opened && (
        <ItemDetail
          item={opened}
          note={notes.get(opened.id)}
          onToggleFavorite={() => notes.update(opened.id, { favorite: !notes.get(opened.id).favorite })}
          onMemo={(memo) => notes.update(opened.id, { memo })}
          onClose={() => setOpened(null)}
          extra={<EmblemExtra item={opened} trait={opened.traitName ? traitByName.get(opened.traitName) : undefined} />}
        />
      )}
    </div>
  )
}

function EmblemExtra({ item, trait }: { item: Item; trait?: Trait }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="mb-1.5 text-xs font-semibold text-ink-400">조합식</p>
        {item.craftable ? (
          <div className="flex items-center gap-2 rounded-lg bg-ink-950 p-3">
            {item.from.map((f, i) => (
              <span key={`${f.id}-${i}`} className="flex items-center gap-2">
                {i > 0 && <span className="text-ink-400">+</span>}
                <span className="flex flex-col items-center gap-1">
                  {f.icon && <img src={f.icon} alt="" className="h-9 w-9 rounded" />}
                  <span className="text-[10px] text-ink-400">{f.name}</span>
                </span>
              </span>
            ))}
            <span className="text-ink-400">=</span>
            {item.icon && <img src={item.icon} alt="" className="h-9 w-9 rounded" />}
          </div>
        ) : (
          <p className="rounded-lg bg-ink-950 p-3 text-xs text-amber-400">
            기본 아이템으로는 만들 수 없습니다. 증강체나 상점에서만 얻을 수 있습니다.
          </p>
        )}
      </div>

      {trait && (
        <div>
          <p className="mb-1.5 text-xs font-semibold text-ink-400">{trait.name} 특성</p>
          <div className="rounded-lg bg-ink-950 p-3">
            <div className="mb-2 flex flex-wrap gap-1">
              {trait.effects.map((e) => (
                <span
                  key={e.min}
                  className="rounded px-2 py-0.5 text-[11px] font-bold tabular-nums"
                  style={{ backgroundColor: STYLE_COLOR[e.style].bg, color: STYLE_COLOR[e.style].text }}
                >
                  {e.min}
                </span>
              ))}
            </div>
            <p className="desc text-[11px] leading-relaxed text-ink-400">{trait.desc}</p>
          </div>
        </div>
      )}
    </div>
  )
}
