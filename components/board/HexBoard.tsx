'use client'

import clsx from 'clsx'
import { BOARD_COLS, BOARD_ROWS, type PlacedUnit } from '@/lib/types'
import { COST_COLOR, type SetIndex } from '@/lib/synergy'
import type { Cell } from './useDragPlacement'

// 육각형 한 칸의 비율과 배치 간격.
// 가로 7칸 + 홀수 줄의 반 칸 어긋남 = 7.5칸 너비, 세로는 겹쳐 쌓이므로 3.25칸 높이가 된다.
const HEX_RATIO = 2 / Math.sqrt(3) // 높이 / 너비
const HEX_W = 100 / 7.5 // %
const HEX_H = 100 / 3.25 // %  (세로로 겹쳐 쌓여 총 3.25칸 높이)
const ROW_STEP = HEX_H * 0.75
const BOARD_RATIO = 7.5 / (3.25 * HEX_RATIO)

export interface HexBoardProps {
  units: PlacedUnit[]
  index: SetIndex
  /** 목록에서 골라 둔 챔피언. 빈 칸을 누르면 여기에 놓인다 */
  pendingChampionId: string | null
  selectedCell: Cell | null
  /** 지금 손가락/커서 아래에 있는 칸 */
  hoverCell: Cell | null
  /** 끌고 있는 유닛이 원래 있던 칸 */
  dragFrom: Cell | null
  /** 지금 무엇을 끌고 있는지 — 아이템을 끄는 중이면 빈 칸은 놓을 수 없는 자리로 표시한다 */
  dragKind: 'champion' | 'item' | null
  onUnitPointerDown: (e: React.PointerEvent, cell: Cell, championId: string) => void
  onEmptyCellClick: (cell: Cell) => void
  /** 우클릭으로 빼기 */
  onUnitContextMenu: (cell: Cell) => void
  /** 성급 빠른 선택 (마우스 오버 시 뜨는 별) */
  onSetStar: (cell: Cell, star: number) => void
}

export default function HexBoard({
  units,
  index,
  pendingChampionId,
  selectedCell,
  hoverCell,
  dragFrom,
  dragKind,
  onUnitPointerDown,
  onEmptyCellClick,
  onUnitContextMenu,
  onSetStar,
}: HexBoardProps) {
  const unitAt = (row: number, col: number) => units.find((u) => u.row === row && u.col === col)

  return (
    <div className="relative w-full select-none" style={{ aspectRatio: String(BOARD_RATIO) }}>
      {Array.from({ length: BOARD_ROWS }).map((_, row) =>
        Array.from({ length: BOARD_COLS }).map((__, col) => {
          const unit = unitAt(row, col)
          const champ = unit ? index.championById.get(unit.id) : null
          const isHover = hoverCell?.row === row && hoverCell?.col === col
          const isSelected = selectedCell?.row === row && selectedCell?.col === col
          const isDragSource = dragFrom?.row === row && dragFrom?.col === col
          // 아이템을 끄는 중에 유닛이 없는 칸 위에 있으면 놓을 수 없는 자리다
          const isInvalidDrop = isHover && dragKind === 'item' && !unit

          return (
            <div
              key={`${row}-${col}`}
              data-cell={`${row},${col}`}
              onPointerDown={(e) => {
                if (unit && champ) onUnitPointerDown(e, { row, col }, champ.id)
              }}
              onClick={() => {
                // 유닛이 있는 칸은 pointerup 쪽에서 처리한다
                if (!unit) onEmptyCellClick({ row, col })
              }}
              onContextMenu={(e) => {
                if (!unit) return
                // 브라우저 기본 메뉴 대신 바로 빼 준다
                e.preventDefault()
                onUnitContextMenu({ row, col })
              }}
              className="group absolute"
              style={{
                width: `${HEX_W}%`,
                height: `${HEX_H}%`,
                left: `${(col + (row % 2 === 1 ? 0.5 : 0)) * HEX_W}%`,
                top: `${row * ROW_STEP}%`,
                padding: '1.5%',
                // 유닛이 있는 칸에서만 드래그를 잡는다.
                // 빈 칸까지 막아버리면 모바일에서 배치판을 스와이프해 화면을 내릴 수 없다.
                touchAction: unit ? 'none' : 'auto',
              }}
            >
              <div
                className={clsx(
                  'hex relative h-full w-full transition-colors',
                  unit ? 'bg-ink-700' : 'bg-ink-850',
                  !unit && dragKind !== 'item' && (pendingChampionId || dragFrom) && 'ring-1 ring-accent/40',
                  isDragSource && 'opacity-25'
                )}
                style={champ ? { backgroundColor: COST_COLOR[champ.cost] ?? '#6b7280' } : undefined}
              >
                {champ && (
                  <div className="hex absolute inset-[6%] overflow-hidden bg-ink-900">
                    {champ.icon && (
                      <img src={champ.icon} alt={champ.name} className="h-full w-full object-cover" draggable={false} />
                    )}
                  </div>
                )}

                {/* 지금 놓이게 될 칸을 또렷하게 표시한다. 아이템을 빈 칸 위로 끌고 있으면 안 된다는 표시로 바꾼다 */}
                {isHover && (
                  <div
                    className={clsx(
                      'hex pointer-events-none absolute inset-0 ring-2',
                      isInvalidDrop ? 'bg-red-500/25 ring-red-500/70' : 'bg-accent/45 ring-accent'
                    )}
                  />
                )}
                {isSelected && !isHover && (
                  <div className="hex pointer-events-none absolute inset-0 ring-2 ring-white/80" />
                )}
              </div>

              {unit && champ && (
                <>
                  {/*
                    성급 빠른 선택 — 마우스를 올렸을 때만 나타난다.
                    (터치에는 hover가 없어 자연히 안 뜨고, 폰에서는 시트의 큰 버튼으로 정한다)

                    칸 박스 "바깥"(육각형 위 허공)에 띄우면, 마우스가 그 빈 공간을 지나는 순간
                    바로 위 줄의 다른 칸이 그 자리를 대신 차지하고 있어 hover가 끊겨 버튼을
                    끝내 못 누르게 된다. 그래서 이 칸 자신의 박스 안(top-0)에 겹쳐 놓아
                    마우스 이동 경로가 끊기지 않게 한다.
                  */}
                  <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex justify-center gap-0.5 rounded-t-[35%] bg-gradient-to-b from-black/85 to-transparent pb-3 pt-1.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-hover:pointer-events-auto">
                    {[1, 2, 3].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation()
                          onSetStar({ row, col }, star)
                        }}
                        title={`${star}성으로`}
                        className={clsx(
                          'rounded bg-ink-950/95 px-1.5 py-0.5 text-xs font-bold leading-none ring-1 ring-ink-700 transition-colors',
                          unit.star >= star ? 'text-amber-300' : 'text-ink-500 hover:text-amber-200'
                        )}
                      >
                        ★
                      </button>
                    ))}
                  </div>

                  {/* 성급 */}
                  {unit.star > 1 && (
                    <div className="pointer-events-none absolute left-1/2 top-[2%] -translate-x-1/2 whitespace-nowrap text-[9px] leading-none text-amber-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] sm:text-xs">
                      {'★'.repeat(unit.star)}
                    </div>
                  )}
                  {/* 이름 */}
                  <div className="pointer-events-none absolute inset-x-0 bottom-[16%] truncate px-1 text-center text-[8px] font-medium leading-none text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] sm:text-[10px]">
                    {champ.name}
                  </div>
                  {/* 장착 아이템 */}
                  {unit.items.length > 0 && (
                    <div className="pointer-events-none absolute inset-x-0 bottom-[3%] flex justify-center gap-[2px]">
                      {unit.items.map((itemId, i) => {
                        const item = index.itemById.get(itemId)
                        return item?.icon ? (
                          <img
                            key={`${itemId}-${i}`}
                            src={item.icon}
                            alt={item.name}
                            className="w-[22%] rounded-[2px] ring-1 ring-black/60"
                            draggable={false}
                          />
                        ) : null
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}
