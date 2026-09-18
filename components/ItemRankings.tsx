import type { SetData } from '@/lib/types'
import { ITEM_TIER_LIST, ITEM_TIER_COLOR } from '@/lib/item-tier-list'

/** 아이템 순위표. S~C 등급으로 고정해 둔 목록을 그대로 보여준다 */
export default function ItemRankings({ data }: { data: SetData }) {
  const itemById = new Map([...data.items.combined, ...data.items.radiant].map((i) => [i.id, i]))

  return (
    <div className="space-y-2">
      {ITEM_TIER_LIST.map((row) => {
        const color = ITEM_TIER_COLOR[row.tier]
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
                    {/* 뭐랑 뭐를 합쳐야 하는지 — 재료 아이콘 두 개 */}
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
