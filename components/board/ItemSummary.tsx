'use client'

import { useMemo } from 'react'
import type { PlacedUnit } from '@/lib/types'
import type { SetIndex } from '@/lib/synergy'

interface Props {
  units: PlacedUnit[]
  index: SetIndex
}

interface Tally {
  id: string
  name: string
  icon: string | null
  count: number
}

/**
 * 배치판에 올라간 유닛들이 낀 아이템을 모아 보여준다.
 *
 * - "사용된 아이템": 지금 실제로 껴 있는 완성 아이템 그대로
 * - "필요한 기본 재료": 그 완성 아이템들을 전부 조합 재료(대검·지팡이 같은 것)로
 *   쪼개서 몇 개씩 필요한지 합산한 것. 유물처럼 조합식이 없는 아이템은 쪼갤 수
 *   없어 빠지고, 기본 재료 자체를 직접 낀 경우는 그 재료 자신으로 한 번 센다.
 */
export default function ItemSummary({ units, index }: Props) {
  const { used, base } = useMemo(() => {
    const usedMap = new Map<string, Tally>()
    const baseMap = new Map<string, Tally>()
    const componentIds = new Set(index.data.items.components.map((c) => c.id))
    const componentOrder = index.data.items.components.map((c) => c.id)

    const bump = (map: Map<string, Tally>, id: string, name: string, icon: string | null) => {
      const prev = map.get(id)
      if (prev) prev.count += 1
      else map.set(id, { id, name, icon, count: 1 })
    }

    for (const unit of units) {
      for (const itemId of unit.items) {
        const item = index.itemById.get(itemId)
        if (!item) continue

        bump(usedMap, item.id, item.name, item.icon)

        if (item.from.length > 0) {
          for (const src of item.from) bump(baseMap, src.id, src.name, src.icon)
        } else if (componentIds.has(item.id)) {
          // 기본 재료를 완성하지 않고 그대로 낀 경우 — 그 자체가 이미 재료다
          bump(baseMap, item.id, item.name, item.icon)
        }
      }
    }

    const base = [...baseMap.values()].sort((a, b) => componentOrder.indexOf(a.id) - componentOrder.indexOf(b.id))
    return { used: [...usedMap.values()], base }
  }, [units, index])

  if (used.length === 0) return null

  return (
    <section className="rounded-xl border border-ink-800 bg-ink-900 p-3">
      <h2 className="mb-2 text-sm font-semibold text-white">사용된 아이템</h2>
      <div className="flex flex-wrap gap-1.5">
        {used.map((t) => (
          <div key={t.id} className="relative" title={t.name}>
            {t.icon && (
              <img src={t.icon} alt={t.name} className="h-9 w-9 rounded-lg bg-ink-850 object-contain p-0.5" />
            )}
            {t.count > 1 && (
              <span className="absolute -bottom-1 -right-1 rounded bg-ink-950 px-1 text-[10px] font-bold leading-tight text-accent ring-1 ring-ink-700">
                x{t.count}
              </span>
            )}
          </div>
        ))}
      </div>

      {base.length > 0 && (
        <>
          <h2 className="mb-2 mt-3 text-sm font-semibold text-white">필요한 기본 재료</h2>
          <div className="flex flex-wrap gap-1.5">
            {base.map((t) => (
              <div key={t.id} className="relative" title={t.name}>
                {t.icon && (
                  <img src={t.icon} alt={t.name} className="h-9 w-9 rounded-lg bg-ink-850 object-contain p-0.5" />
                )}
                <span className="absolute -bottom-1 -right-1 rounded bg-ink-950 px-1 text-[10px] font-bold leading-tight text-accent ring-1 ring-ink-700">
                  x{t.count}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
