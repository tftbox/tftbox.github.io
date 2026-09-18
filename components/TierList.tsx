import type { Item } from '@/lib/types'
import { TIER_COLOR, type TierRow } from '@/lib/tier-list'

/** S~C 등급 순위표. 아이템 순위 · 유물 순위가 같이 쓴다 */
export default function TierList({ pool, tierList }: { pool: Item[]; tierList: TierRow[] }) {
  const itemById = new Map(pool.map((i) => [i.id, i]))

  return (
    <div className="space-y-2">
      {tierList.map((row) => {
        const color = TIER_COLOR[row.tier]
        return (
          <div key={row.tier} className="flex overflow-hidden rounded-xl border border-ink-800">
            <div
              className="flex w-14 shrink-0 items-center justify-center text-xl font-extrabold sm:w-20 sm:text-2xl"
              style={{ backgroundColor: color.bg, color: color.text }}
            >
              {row.tier}
            </div>
            <div className="flex flex-1 flex-wrap gap-3 bg-ink-900 p-3">
              {row.itemIds.map((id) => {
                const item = itemById.get(id)
                if (!item) return null
                return (
                  <div key={id} className="flex w-16 flex-col items-center gap-1 sm:w-[72px]">
                    {item.icon && (
                      <img src={item.icon} alt={item.name} title={item.name} className="h-12 w-12 rounded-lg sm:h-14 sm:w-14" />
                    )}
                    <p className="line-clamp-2 text-center text-[10px] leading-tight text-ink-200">{item.name}</p>
                    {/* 뭐랑 뭐를 합쳐야 하는지 — 재료 아이콘 두 개 (유물처럼 조합식이 없으면 안 뜬다) */}
                    {item.from.length > 0 && (
                      <div className="flex items-center gap-0.5">
                        {item.from.map((f, i) => (
                          <span key={`${f.id}-${i}`} className="flex items-center gap-0.5">
                            {i > 0 && <span className="text-[9px] text-ink-500">+</span>}
                            {f.icon && <img src={f.icon} alt={f.name} title={f.name} className="h-4 w-4 rounded-sm" />}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
