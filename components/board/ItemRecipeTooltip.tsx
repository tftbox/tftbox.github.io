import type { Item } from '@/lib/types'

/**
 * 아이템 조합 재료를 아이콘 + 이름으로 보여주는 툴팁 "내용물".
 *
 * 어디에 걸어 두느냐(배치판 위 유닛, 아이템 목록, 유닛 시트)에 따라 칸 크기와
 * 위치가 다 달라서, 위치를 잡는 바깥 상자는 부르는 쪽에서 만들고 이 컴포넌트는
 * 내용만 채운다.
 */
export default function ItemRecipeTooltip({ item }: { item: Item }) {
  if (item.from.length === 0) return null

  return (
    <div className="flex items-center gap-1">
      {item.from.map((f, i) => (
        <span key={`${f.id}-${i}`} className="flex items-center gap-1">
          {i > 0 && <span className="text-ink-400">+</span>}
          {f.icon && <img src={f.icon} alt="" className="h-4 w-4 shrink-0 rounded" />}
          <span>{f.name}</span>
        </span>
      ))}
    </div>
  )
}
