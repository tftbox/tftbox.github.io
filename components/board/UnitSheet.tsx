'use client'

import { useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import clsx from 'clsx'
import type { Item, PlacedUnit } from '@/lib/types'
import { COST_COLOR, type SetIndex } from '@/lib/synergy'
import Sheet from '@/components/Sheet'
import { ITEM_TABS } from './itemTabs'

interface Props {
  unit: PlacedUnit
  index: SetIndex
  onChange: (next: PlacedUnit) => void
  onRemove: () => void
  onClose: () => void
}

const MAX_ITEMS = 3

export default function UnitSheet({ unit, index, onChange, onRemove, onClose }: Props) {
  const [picking, setPicking] = useState(false)
  const champ = index.championById.get(unit.id)
  if (!champ) return null

  const items = unit.items.map((id) => index.itemById.get(id)).filter((i): i is Item => !!i)

  return (
    <>
      <Sheet onClose={onClose}>
        <div className="flex items-start gap-3 border-b border-ink-800 p-4">
          <div
            className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2"
            style={{ borderColor: COST_COLOR[champ.cost] ?? '#6b7280' }}
          >
            {champ.icon && <img src={champ.icon} alt="" className="h-full w-full object-cover" />}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-base font-bold text-white">{champ.name}</h3>
              <span className="shrink-0 rounded px-1.5 py-0.5 text-[11px] font-bold text-white" style={{ backgroundColor: COST_COLOR[champ.cost] }}>
                {champ.cost}코스트
              </span>
            </div>
            <p className="mt-1 truncate text-xs text-ink-400">{champ.traits.join(' · ')}</p>
            <p className="mt-0.5 text-[11px] text-ink-400">
              {unit.row === 0 ? '맨 앞줄' : unit.row === 3 ? '맨 뒷줄' : `${unit.row + 1}번째 줄`} · {unit.col + 1}번째 칸
            </p>
          </div>

          <button type="button" onClick={onClose} aria-label="닫기" className="rounded p-1 text-ink-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 p-4">
          {/* 성급 */}
          <div>
            <p className="mb-1.5 text-xs font-semibold text-ink-400">성급</p>
            <div className="flex gap-1.5">
              {[1, 2, 3].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => onChange({ ...unit, star })}
                  className={clsx(
                    'flex-1 rounded-lg py-2 text-sm font-semibold transition-colors',
                    unit.star === star ? 'bg-amber-400 text-ink-950' : 'bg-ink-850 text-ink-400 hover:text-ink-200'
                  )}
                >
                  {'★'.repeat(star)}
                </button>
              ))}
            </div>
          </div>

          {/* 아이템 */}
          <div>
            <p className="mb-1.5 text-xs font-semibold text-ink-400">아이템 ({items.length}/{MAX_ITEMS})</p>
            <div className="flex gap-2">
              {Array.from({ length: MAX_ITEMS }).map((_, slot) => {
                const item = items[slot]
                if (!item) {
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setPicking(true)}
                      className="flex h-14 flex-1 items-center justify-center rounded-lg border border-dashed border-ink-700 text-ink-400 transition-colors hover:border-accent hover:text-accent"
                    >
                      <Plus size={18} />
                    </button>
                  )
                }
                return (
                  <button
                    key={`${item.id}-${slot}`}
                    type="button"
                    onClick={() => onChange({ ...unit, items: unit.items.filter((_, i) => i !== slot) })}
                    title="눌러서 해제"
                    className="group relative h-14 flex-1 overflow-hidden rounded-lg bg-ink-850"
                  >
                    {item.icon && <img src={item.icon} alt={item.name} className="h-full w-full object-contain p-1" />}
                    <span className="absolute inset-0 hidden items-center justify-center bg-black/70 text-[10px] font-semibold text-white group-hover:flex">
                      해제
                    </span>
                  </button>
                )
              })}
            </div>

            {items.length > 0 && (
              <ul className="mt-2 space-y-1">
                {items.map((item, i) => (
                  <li key={`${item.id}-${i}`} className="rounded-lg bg-ink-950 px-3 py-2">
                    <p className="text-xs font-semibold text-white">{item.name}</p>
                    <p className="desc mt-0.5 text-[11px] leading-relaxed text-ink-400">{item.desc}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 스킬 */}
          {champ.ability && (
            <div>
              <p className="mb-1.5 text-xs font-semibold text-ink-400">스킬 · {champ.ability.name}</p>
              <p className="desc rounded-lg bg-ink-950 px-3 py-2 text-[11px] leading-relaxed text-ink-400">
                {champ.ability.desc}
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={onRemove}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-500/10 py-2.5 text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/20"
          >
            <Trash2 size={16} />
            배치판에서 빼기
          </button>
        </div>
      </Sheet>

      {picking && (
        <ItemPicker
          index={index}
          disabledIds={unit.items}
          onPick={(itemId) => {
            if (unit.items.length < MAX_ITEMS) onChange({ ...unit, items: [...unit.items, itemId] })
            setPicking(false)
          }}
          onClose={() => setPicking(false)}
        />
      )}
    </>
  )
}

// ---------------------------------------------------------------------------

function ItemPicker({
  index,
  disabledIds,
  onPick,
  onClose,
}: {
  index: SetIndex
  disabledIds: string[]
  onPick: (itemId: string) => void
  onClose: () => void
}) {
  const [tab, setTab] = useState<(typeof ITEM_TABS)[number]['key']>('combined')
  const [query, setQuery] = useState('')

  // 찬란한 아이템처럼 시즌에 따라 아예 없는 분류는 탭을 띄우지 않는다
  const tabs = ITEM_TABS.filter((t) => index.data.items[t.key].length > 0)

  const q = query.trim().toLowerCase()
  const list = index.data.items[tab].filter((i) => !q || i.name.toLowerCase().includes(q))

  return (
    <Sheet onClose={onClose}>
      <div className="sticky top-0 space-y-2 border-b border-ink-800 bg-ink-900 p-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">아이템 선택</h3>
          <button type="button" onClick={onClose} aria-label="닫기" className="rounded p-1 text-ink-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={clsx(
                'flex-1 rounded-lg py-1.5 text-xs font-semibold transition-colors',
                tab === t.key ? 'bg-accent text-ink-950' : 'bg-ink-850 text-ink-400'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="아이템 이름 검색"
          className="w-full rounded-lg bg-ink-850 px-3 py-2 text-sm text-white placeholder:text-ink-400"
        />
      </div>

      <div className="grid grid-cols-5 gap-2 p-3 sm:grid-cols-7">
        {list.map((item) => {
          // 유니크 아이템만 중복 장착을 막는다. 일반 아이템은 실제 게임처럼 여러 개 껴도 된다.
          const blocked = item.unique && disabledIds.includes(item.id)
          return (
            <button
              key={item.id}
              type="button"
              disabled={blocked}
              onClick={() => onPick(item.id)}
              title={blocked ? `${item.name} (유니크 · 이미 장착함)` : item.name}
              className={clsx(
                'aspect-square rounded-lg bg-ink-850 p-1 transition-transform active:scale-95',
                blocked && 'opacity-30'
              )}
            >
              {item.icon && <img src={item.icon} alt={item.name} className="h-full w-full object-contain" />}
            </button>
          )
        })}
        {list.length === 0 && <p className="col-span-full py-8 text-center text-xs text-ink-400">결과가 없습니다.</p>}
      </div>
    </Sheet>
  )
}
