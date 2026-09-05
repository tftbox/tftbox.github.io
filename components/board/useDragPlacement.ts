'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * 챔피언을 끌어다 놓는 동작을 한곳에서 처리한다.
 *
 * 두 군데에서 시작할 수 있다.
 *   - 아래 챔피언 목록에서 배치판으로 (새로 놓기)
 *   - 배치판 안에서 다른 칸으로 (자리 옮기기 / 맞바꾸기)
 *
 * 모바일에서는 챔피언 목록이 세로로 긴 스크롤 영역이라, 손가락을 대자마자
 * 드래그를 잡아버리면 화면을 내릴 수가 없다. 그래서 목록에서는 "잠깐 누르고 있기"를
 * 거쳐야 드래그가 시작되고, 그 전에 손가락이 움직이면 그냥 스크롤로 넘긴다.
 * 배치판 안에서는 스크롤과 겹칠 일이 없으므로 바로 끌린다.
 */

const LONG_PRESS_MS = 180
const MOVE_THRESHOLD = 8

export type DragSource = { kind: 'pool'; championId: string } | { kind: 'board'; row: number; col: number }

export interface DragState {
  source: DragSource
  /** 따라다니는 미리보기에 쓸 챔피언 */
  championId: string
  x: number
  y: number
  /** 손가락 아래에 있는 칸 */
  cell: Cell | null
}

export interface Cell {
  row: number
  col: number
}

interface Gesture {
  source: DragSource
  championId: string
  pointerId: number
  pointerType: string
  startX: number
  startY: number
  /** 드래그로 넘어갈 수 있는 상태인지 (목록에서는 길게 누른 뒤에 켜진다) */
  armed: boolean
  /** 실제로 끌고 있는 중인지 */
  active: boolean
  /** 임계값을 넘겨 움직였는지 — 탭인지 드래그인지 가른다 */
  moved: boolean
  longPressTimer: number | null
}

interface Options {
  onDropFromPool: (championId: string, cell: Cell) => void
  onMoveOnBoard: (from: Cell, to: Cell) => void
  onTapPool: (championId: string) => void
  /** pointerType은 손가락으로 두드린 것과 마우스로 누른 것을 가리는 데 쓴다 */
  onTapBoard: (cell: Cell, pointerType: string) => void
}

/** 화면 좌표 아래에 있는 배치판 칸을 찾는다 */
function cellFromPoint(x: number, y: number): Cell | null {
  const el = document.elementFromPoint(x, y)?.closest('[data-cell]') as HTMLElement | null
  if (!el) return null
  const [row, col] = (el.dataset.cell ?? '').split(',').map(Number)
  return Number.isFinite(row) && Number.isFinite(col) ? { row, col } : null
}

export function useDragPlacement({ onDropFromPool, onMoveOnBoard, onTapPool, onTapBoard }: Options) {
  const gesture = useRef<Gesture | null>(null)
  const [state, setState] = useState<DragState | null>(null)

  // 콜백이 매 렌더마다 새로 만들어져도 리스너를 다시 달지 않도록 최신 값만 참조한다
  const handlers = useRef({ onDropFromPool, onMoveOnBoard, onTapPool, onTapBoard })
  useEffect(() => {
    handlers.current = { onDropFromPool, onMoveOnBoard, onTapPool, onTapBoard }
  })

  const clear = useCallback(() => {
    const g = gesture.current
    if (g?.longPressTimer) clearTimeout(g.longPressTimer)
    gesture.current = null
    setState(null)
  }, [])

  const begin = useCallback((source: DragSource, championId: string, e: React.PointerEvent) => {
    // 목록에서 손가락으로 시작한 경우에만 길게 누르기를 요구한다
    const needsLongPress = source.kind === 'pool' && e.pointerType !== 'mouse'

    const g: Gesture = {
      source,
      championId,
      pointerId: e.pointerId,
      pointerType: e.pointerType,
      startX: e.clientX,
      startY: e.clientY,
      armed: !needsLongPress,
      active: false,
      moved: false,
      longPressTimer: null,
    }

    if (needsLongPress) {
      g.longPressTimer = window.setTimeout(() => {
        const current = gesture.current
        if (!current || current.moved) return
        current.armed = true
        current.active = true
        current.longPressTimer = null
        setState({ source: current.source, championId: current.championId, x: current.startX, y: current.startY, cell: null })
      }, LONG_PRESS_MS)
    }

    gesture.current = g
  }, [])

  const startFromPool = useCallback(
    (e: React.PointerEvent, championId: string) => {
      if (e.button !== 0) return
      begin({ kind: 'pool', championId }, championId, e)
    },
    [begin]
  )

  const startFromBoard = useCallback(
    (e: React.PointerEvent, cell: Cell, championId: string) => {
      // 오른쪽 버튼은 빼기용이라 드래그로 잡지 않는다
      if (e.button !== 0) return
      // 배치판에서는 브라우저가 스크롤로 가져가지 못하게 막는다
      e.preventDefault()
      begin({ kind: 'board', ...cell }, championId, e)
    },
    [begin]
  )

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      const g = gesture.current
      if (!g || e.pointerId !== g.pointerId) return

      const far = Math.abs(e.clientX - g.startX) > MOVE_THRESHOLD || Math.abs(e.clientY - g.startY) > MOVE_THRESHOLD

      if (!g.armed) {
        // 길게 누르기를 기다리는 중에 움직였다면 스크롤이므로 손을 뗀다
        if (far) clear()
        return
      }

      if (far) g.moved = true
      if (!g.active && g.moved) g.active = true
      if (!g.active) return

      setState({ source: g.source, championId: g.championId, x: e.clientX, y: e.clientY, cell: cellFromPoint(e.clientX, e.clientY) })
    }

    const onPointerUp = (e: PointerEvent) => {
      const g = gesture.current
      if (!g || e.pointerId !== g.pointerId) return

      const target = cellFromPoint(e.clientX, e.clientY)

      if (g.active && target) {
        if (g.source.kind === 'pool') {
          handlers.current.onDropFromPool(g.source.championId, target)
        } else if (target.row !== g.source.row || target.col !== g.source.col) {
          handlers.current.onMoveOnBoard({ row: g.source.row, col: g.source.col }, target)
        }
      } else if (!g.moved && !g.active) {
        // 끌지 않고 그냥 눌렀다 뗀 경우
        if (g.source.kind === 'board') handlers.current.onTapBoard({ row: g.source.row, col: g.source.col }, g.pointerType)
        else handlers.current.onTapPool(g.source.championId)
      }

      clear()
    }

    // 드래그 중에는 화면이 같이 밀리지 않게 한다.
    // touch-action만으로는 이미 시작된 제스처를 막을 수 없어서 직접 막아야 한다.
    const onTouchMove = (e: TouchEvent) => {
      if (gesture.current?.active) e.preventDefault()
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', clear)
    window.addEventListener('touchmove', onTouchMove, { passive: false })

    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', clear)
      window.removeEventListener('touchmove', onTouchMove)
    }
  }, [clear])

  return { state, startFromPool, startFromBoard }
}
