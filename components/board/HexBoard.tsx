'use client'

import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { BOARD_COLS, BOARD_ROWS, type PlacedUnit } from '@/lib/types'
import { COST_COLOR, type SetIndex } from '@/lib/synergy'

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
  /** 풀에서 고른 챔피언. 빈 칸을 누르면 여기에 놓인다 */
  pendingChampionId: string | null
  onPlace: (row: number, col: number) => void
  onSelectUnit: (unit: PlacedUnit) => void
  onMoveUnit: (from: { row: number; col: number }, to: { row: number; col: number }) => void
  selectedCell: { row: number; col: number } | null
}

interface DragState {
  unit: PlacedUnit
  x: number
  y: number
  moved: boolean
}

export default function HexBoard({
  units,
  index,
  pendingChampionId,
  onPlace,
  onSelectUnit,
  onMoveUnit,
  selectedCell,
}: HexBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<DragState | null>(null)
  const [hoverCell, setHoverCell] = useState<{ row: number; col: number } | null>(null)

  const unitAt = (row: number, col: number) => units.find((u) => u.row === row && u.col === col)

  // 손가락/마우스 위치 아래에 있는 칸을 찾는다
  const cellFromPoint = (x: number, y: number) => {
    const el = document.elementFromPoint(x, y)?.closest('[data-cell]') as HTMLElement | null
    if (!el) return null
    const [row, col] = (el.dataset.cell ?? '').split(',').map(Number)
    return Number.isFinite(row) && Number.isFinite(col) ? { row, col } : null
  }

  // 드래그는 배치판 안에서만 일어난다 (풀에서는 탭으로 고르고 탭으로 놓는다)
  useEffect(() => {
    if (!drag) return

    const move = (e: PointerEvent) => {
      const moved = drag.moved || Math.abs(e.clientX - drag.x) > 6 || Math.abs(e.clientY - drag.y) > 6
      setDrag((prev) => (prev ? { ...prev, x: e.clientX, y: e.clientY, moved } : prev))
      if (moved) setHoverCell(cellFromPoint(e.clientX, e.clientY))
    }

    const up = (e: PointerEvent) => {
      const target = cellFromPoint(e.clientX, e.clientY)
      if (drag.moved && target && (target.row !== drag.unit.row || target.col !== drag.unit.col)) {
        onMoveUnit({ row: drag.unit.row, col: drag.unit.col }, target)
      } else if (!drag.moved) {
        // 움직이지 않았으면 그냥 탭으로 본다
        onSelectUnit(drag.unit)
      }
      setDrag(null)
      setHoverCell(null)
    }

    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
  }, [drag, onMoveUnit, onSelectUnit])

  const dragChamp = drag ? index.championById.get(drag.unit.id) : null

  return (
    <div className="relative">
      <div
        ref={boardRef}
        className="relative w-full select-none"
        style={{ aspectRatio: String(BOARD_RATIO) }}
      >
        {Array.from({ length: BOARD_ROWS }).map((_, row) =>
          Array.from({ length: BOARD_COLS }).map((__, col) => {
            const unit = unitAt(row, col)
            const champ = unit ? index.championById.get(unit.id) : null
            const isHover = hoverCell?.row === row && hoverCell?.col === col
            const isSelected = selectedCell?.row === row && selectedCell?.col === col
            const isDragSource = drag?.moved && drag.unit.row === row && drag.unit.col === col

            return (
              <div
                key={`${row}-${col}`}
                data-cell={`${row},${col}`}
                onPointerDown={(e) => {
                  if (!unit) return
                  // 빈 칸에 놓으려고 챔피언을 고른 상태라면 드래그가 아니라 교체 동작
                  if (pendingChampionId) return
                  e.preventDefault()
                  setDrag({ unit, x: e.clientX, y: e.clientY, moved: false })
                }}
                onClick={() => {
                  // 유닛 선택은 pointerup에서 처리한다. 여기서는 "고른 챔피언 놓기"만.
                  if (pendingChampionId) onPlace(row, col)
                }}
                className="absolute"
                style={{
                  width: `${HEX_W}%`,
                  height: `${HEX_H}%`,
                  left: `${(col + (row % 2 === 1 ? 0.5 : 0)) * HEX_W}%`,
                  top: `${row * ROW_STEP}%`,
                  padding: '1.5%',
                  // 유닛이 있는 칸에서만 드래그를 잡는다.
                  // 빈 칸까지 막아버리면 모바일에서 배치판을 스와이프해 화면을 내릴 수 없다.
                  touchAction: unit && !pendingChampionId ? 'none' : 'auto',
                }}
              >
                <div
                  className={clsx(
                    'hex relative h-full w-full transition-colors',
                    unit ? 'bg-ink-700' : 'bg-ink-850',
                    isHover && 'bg-accent-dim',
                    !unit && pendingChampionId && 'bg-ink-800 ring-1 ring-accent/40',
                    isDragSource && 'opacity-30'
                  )}
                  style={
                    champ
                      ? {
                          backgroundColor: COST_COLOR[champ.cost] ?? '#6b7280',
                        }
                      : undefined
                  }
                >
                  {champ && (
                    <div className="hex absolute inset-[6%] overflow-hidden bg-ink-900">
                      {champ.icon && (
                        <img
                          src={champ.icon}
                          alt={champ.name}
                          className="h-full w-full object-cover"
                          draggable={false}
                        />
                      )}
                    </div>
                  )}

                  {isSelected && <div className="hex pointer-events-none absolute inset-0 ring-2 ring-white/80" />}
                </div>

                {unit && champ && (
                  <>
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

      {/* 드래그 중 따라다니는 미리보기 */}
      {drag?.moved && dragChamp?.icon && (
        <img
          src={dragChamp.icon}
          alt=""
          className="hex pointer-events-none fixed z-50 h-14 w-14 -translate-x-1/2 -translate-y-1/2 object-cover opacity-90"
          style={{ left: drag.x, top: drag.y }}
        />
      )}
    </div>
  )
}
