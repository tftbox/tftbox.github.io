'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Gem, Link2, RotateCcw, Save, Swords, X } from 'lucide-react'
import clsx from 'clsx'
import type { PlacedUnit, SetData } from '@/lib/types'
import { buildIndex, computeTraits, deckCost } from '@/lib/synergy'
import { createDeck, getDeck, updateDeck } from '@/lib/decks'
import { decodeUnits, encodeUnits } from '@/lib/deck-url'
import HexBoard from './HexBoard'
import SynergyPanel from './SynergyPanel'
import ChampionPool from './ChampionPool'
import ItemPool from './ItemPool'
import UnitSheet from './UnitSheet'
import { useDragPlacement, type Cell } from './useDragPlacement'

const DRAFT_KEY = 'tft-tool:draft'

/** 이 시간 안에 같은 칸을 다시 두드리면 "두 번 두드림"으로 본다 */
const DOUBLE_TAP_MS = 400

const MAX_ITEMS = 3

interface Draft {
  units: PlacedUnit[]
  name: string
  tags: string[]
  memo: string
  deckId: string | null
}

export default function BoardTool({ data }: { data: SetData }) {
  const index = useMemo(() => buildIndex(data), [data])
  const router = useRouter()
  const searchParams = useSearchParams()

  const [units, setUnits] = useState<PlacedUnit[]>([])
  const [name, setName] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [memo, setMemo] = useState('')
  const [deckId, setDeckId] = useState<string | null>(null)

  const [poolTab, setPoolTab] = useState<'champion' | 'item'>('champion')
  const [pendingChampionId, setPendingChampionId] = useState<string | null>(null)
  const [pendingItemId, setPendingItemId] = useState<string | null>(null)
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const deckParam = searchParams.get('deck')
  const boardParam = searchParams.get('b')

  // 링크로 들어왔으면 그쪽을 우선하고, 아니면 쓰던 작업을 복구한다
  useEffect(() => {
    let cancelled = false

    const restore = async () => {
      if (deckParam) {
        try {
          const deck = await getDeck(deckParam)
          if (!cancelled && deck) {
            setUnits(deck.units)
            setName(deck.name)
            setTags(deck.tags)
            setMemo(deck.memo)
            setDeckId(deck.id)
          }
        } catch {
          if (!cancelled) setStatus('덱을 불러오지 못했습니다.')
        }
        if (!cancelled) setLoaded(true)
        return
      }

      if (boardParam) {
        const championIds = data.champions.map((c) => c.id)
        const itemIds = [...index.itemById.keys()]
        const decoded = decodeUnits(boardParam, championIds, itemIds)
        if (!cancelled && decoded) setUnits(decoded)
        if (!cancelled) setLoaded(true)
        return
      }

      try {
        const raw = localStorage.getItem(DRAFT_KEY)
        if (raw && !cancelled) {
          const draft = JSON.parse(raw) as Draft
          setUnits(draft.units ?? [])
          setName(draft.name ?? '')
          setTags(draft.tags ?? [])
          setMemo(draft.memo ?? '')
          setDeckId(draft.deckId ?? null)
        }
      } catch {
        // 저장된 작업이 깨져 있으면 그냥 빈 판으로 시작한다
      }
      if (!cancelled) setLoaded(true)
    }

    restore()
    return () => {
      cancelled = true
    }
  }, [deckParam, boardParam, data.champions, index.itemById])

  // 작업 중인 내용은 새로고침해도 남아 있어야 한다
  useEffect(() => {
    if (!loaded) return
    const draft: Draft = { units, name, tags, memo, deckId }
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  }, [loaded, units, name, tags, memo, deckId])

  // 안내 문구는 잠깐 보여주고 지운다
  useEffect(() => {
    if (!status) return
    const timer = setTimeout(() => setStatus(null), 2600)
    return () => clearTimeout(timer)
  }, [status])

  const traits = useMemo(() => computeTraits(units, index), [units, index])
  const cost = useMemo(() => deckCost(units, index), [units, index])
  const placedIds = useMemo(() => new Set(units.map((u) => u.id)), [units])
  const selectedUnit = selectedCell
    ? units.find((u) => u.row === selectedCell.row && u.col === selectedCell.col) ?? null
    : null

  /** 칸에 챔피언을 놓는다. 이미 있으면 그 자리를 대신한다. */
  const placeChampion = useCallback((championId: string, cell: Cell) => {
    setUnits((prev) => [
      ...prev.filter((u) => !(u.row === cell.row && u.col === cell.col)),
      { id: championId, row: cell.row, col: cell.col, star: 1, items: [] },
    ])
    setPendingChampionId(null)
  }, [])

  const moveUnit = useCallback(
    (from: { row: number; col: number }, to: { row: number; col: number }) => {
      setUnits((prev) => {
        const source = prev.find((u) => u.row === from.row && u.col === from.col)
        if (!source) return prev
        const target = prev.find((u) => u.row === to.row && u.col === to.col)

        return prev.map((u) => {
          if (u === source) return { ...u, row: to.row, col: to.col }
          // 이미 유닛이 있는 칸이면 자리를 맞바꾼다
          if (target && u === target) return { ...u, row: from.row, col: from.col }
          return u
        })
      })
    },
    []
  )

  const updateUnit = useCallback((next: PlacedUnit) => {
    setUnits((prev) => prev.map((u) => (u.row === next.row && u.col === next.col ? next : u)))
  }, [])

  const removeUnit = useCallback((row: number, col: number) => {
    setUnits((prev) => prev.filter((u) => !(u.row === row && u.col === col)))
    setSelectedCell(null)
  }, [])

  /** 유닛의 성급을 바로 정한다 (배치판 위에서 마우스 오버로 뜨는 별 선택) */
  const setStar = useCallback((cell: Cell, star: number) => {
    setUnits((prev) => prev.map((u) => (u.row === cell.row && u.col === cell.col ? { ...u, star } : u)))
  }, [])

  /**
   * 칸 위의 유닛에게 아이템을 낀다. 빈 칸이거나 이미 가득 찼으면 안내만 하고 끝낸다.
   * 같은 아이템을 여러 개 끼우는 건 실제 게임처럼 허용하고, 유니크 아이템만 중복을 막는다.
   */
  const attachItem = useCallback(
    (itemId: string, cell: Cell) => {
      const unit = units.find((u) => u.row === cell.row && u.col === cell.col)
      if (!unit) return setStatus('빈 칸에는 아이템을 낄 수 없습니다. 유닛 위에 놓아 주세요.')
      if (unit.items.length >= MAX_ITEMS) return setStatus('아이템은 최대 3개까지 낄 수 있습니다.')

      const item = index.itemById.get(itemId)
      if (item?.unique && unit.items.includes(itemId)) return setStatus('유니크 아이템은 중복으로 낄 수 없습니다.')

      setUnits((prev) =>
        prev.map((u) => (u.row === cell.row && u.col === cell.col ? { ...u, items: [...u.items, itemId] } : u))
      )
      setPendingItemId(null)
    },
    [units, index]
  )

  // 손가락으로 같은 칸을 연달아 두 번 두드리면 빼기 위한 기록
  const lastTap = useRef<{ cell: Cell; at: number } | null>(null)

  // 챔피언·아이템을 끌어다 놓기 · 배치판 안에서 자리 옮기기 · 눌러서 고르기를 함께 처리한다
  const {
    state: drag,
    startFromPoolChampion,
    startFromPoolItem,
    startFromBoardUnit,
  } = useDragPlacement({
    onDropChampion: placeChampion,
    onDropItem: attachItem,
    onMoveUnit: moveUnit,
    onTapPoolChampion: (championId) => {
      setPendingItemId(null)
      setPendingChampionId((prev) => (prev === championId ? null : championId))
    },
    onTapPoolItem: (itemId) => {
      setPendingChampionId(null)
      setPendingItemId((prev) => (prev === itemId ? null : itemId))
    },
    onTapBoardUnit: (cell, pointerType) => {
      if (pendingChampionId) {
        placeChampion(pendingChampionId, cell)
        return
      }
      if (pendingItemId) {
        attachItem(pendingItemId, cell)
        return
      }
      if (pointerType !== 'mouse') lastTap.current = { cell, at: Date.now() }
      setSelectedCell(cell)
    },
  })

  /**
   * 폰에서 두 번 두드려 빼기.
   *
   * 첫 번째 두드림에 설정 시트가 바로 열리기 때문에, 두 번째 두드림은 칸이 아니라
   * 시트 배경 위에 떨어진다. 그래서 눌린 좌표가 방금 두드린 칸 위인지를 직접 따져 본다.
   */
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') return

      const last = lastTap.current
      if (!last || Date.now() - last.at > DOUBLE_TAP_MS) return

      const el = document.querySelector(`[data-cell="${last.cell.row},${last.cell.col}"]`)
      if (!el) return

      const r = el.getBoundingClientRect()
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom
      if (!inside) return

      lastTap.current = null
      e.stopPropagation()
      removeUnit(last.cell.row, last.cell.col)
      setStatus('유닛을 뺐습니다.')
    }

    window.addEventListener('pointerdown', onPointerDown, true)
    return () => window.removeEventListener('pointerdown', onPointerDown, true)
  }, [removeUnit])

  // 드래그 미리보기와 배치판 강조 표시에 쓸, 지금 끌고 있는 대상
  const dragChampionId =
    drag && (drag.source.kind === 'poolChampion' || drag.source.kind === 'boardUnit') ? drag.source.championId : null
  const dragItemId = drag && drag.source.kind === 'poolItem' ? drag.source.itemId : null
  const dragChampion = dragChampionId ? index.championById.get(dragChampionId) : null
  const dragItem = dragItemId ? index.itemById.get(dragItemId) : null
  const dragFrom = drag && drag.source.kind === 'boardUnit' ? { row: drag.source.row, col: drag.source.col } : null
  const dragKind: 'champion' | 'item' | null = dragChampionId ? 'champion' : dragItemId ? 'item' : null

  const clearBoard = () => {
    if (units.length && !confirm('배치판을 비울까요?')) return
    setUnits([])
    setName('')
    setTags([])
    setMemo('')
    setDeckId(null)
    setPendingChampionId(null)
    setPendingItemId(null)
    router.replace('/')
    setStatus('배치판을 비웠습니다.')
  }

  const save = async () => {
    if (!units.length) return setStatus('먼저 챔피언을 배치해 주세요.')
    const trimmed = name.trim()
    if (!trimmed) return setStatus('덱 이름을 입력해 주세요.')

    setSaving(true)
    try {
      const payload = { name: trimmed, tags, units, memo }
      const deck = deckId ? await updateDeck(deckId, payload) : await createDeck(data.set, payload)
      setDeckId(deck.id)
      setStatus(deckId ? '저장했습니다.' : '새 덱으로 저장했습니다.')
    } catch (err) {
      setStatus(err instanceof Error ? `저장 실패: ${err.message}` : '저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const copyShareLink = async () => {
    const url = `${location.origin}${location.pathname}?b=${encodeUnits(units, data.set)}`
    try {
      await navigator.clipboard.writeText(url)
      setStatus('공유 링크를 복사했습니다.')
    } catch {
      setStatus('복사에 실패했습니다. 주소창에서 직접 복사해 주세요.')
    }
  }

  const pendingChampion = pendingChampionId ? index.championById.get(pendingChampionId) : null
  const pendingItem = pendingItemId ? index.itemById.get(pendingItemId) : null

  // 챔피언/아이템 목록 전환 버튼. 검색창 옆에 얹어 별도 줄을 만들지 않는다
  // (모바일에서는 이 한 줄이 늘어나는 것만으로도 목록 첫 줄이 하단 탭바 뒤로 넘어갈 수 있다)
  const poolToggle = (
    <div className="flex shrink-0 gap-0.5 rounded-lg bg-ink-850 p-0.5">
      <button
        type="button"
        onClick={() => setPoolTab('champion')}
        aria-label="챔피언 목록"
        title="챔피언"
        className={clsx(
          'rounded-md p-1.5 transition-colors',
          poolTab === 'champion' ? 'bg-ink-700 text-white' : 'text-ink-400 hover:text-ink-200'
        )}
      >
        <Swords size={16} />
      </button>
      <button
        type="button"
        onClick={() => setPoolTab('item')}
        aria-label="아이템 목록"
        title="아이템"
        className={clsx(
          'rounded-md p-1.5 transition-colors',
          poolTab === 'item' ? 'bg-ink-700 text-white' : 'text-ink-400 hover:text-ink-200'
        )}
      >
        <Gem size={16} />
      </button>
    </div>
  )

  return (
    <div className="space-y-3">
      {/* 덱 이름 · 저장 */}
      <section className="rounded-xl border border-ink-800 bg-ink-900 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="덱 이름 (예: 4암흑의별 리롤)"
            className="min-w-0 flex-1 rounded-lg bg-ink-850 px-3 py-2 text-sm text-white placeholder:text-ink-400"
          />
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-ink-950 transition-opacity disabled:opacity-50"
          >
            <Save size={15} />
            {deckId ? '덮어쓰기' : '저장'}
          </button>
          <button
            type="button"
            onClick={copyShareLink}
            aria-label="공유 링크 복사"
            className="rounded-lg bg-ink-850 p-2 text-ink-400 transition-colors hover:text-white"
          >
            <Link2 size={17} />
          </button>
          <button
            type="button"
            onClick={clearBoard}
            aria-label="배치판 비우기"
            className="rounded-lg bg-ink-850 p-2 text-ink-400 transition-colors hover:text-white"
          >
            <RotateCcw size={17} />
          </button>
        </div>

        <TagEditor tags={tags} onChange={setTags} />

        <div className="mt-2 flex items-center gap-3 text-xs text-ink-400">
          <span>
            유닛 <b className="text-ink-200">{units.length}</b>
          </span>
          <span>
            비용 <b className="text-ink-200">{cost}</b>G
          </span>
          {deckId && <span className="text-accent">저장된 덱 수정 중</span>}
          {status && <span className="ml-auto text-accent">{status}</span>}
        </div>
      </section>

      {/* 배치판 + 특성 */}
      <div className="grid gap-3 lg:grid-cols-[300px_minmax(0,1fr)]">
        <div className="order-2 lg:order-1">
          <div className="lg:sticky lg:top-20">
            <SynergyPanel traits={traits} />
          </div>
        </div>

        <div className="order-1 rounded-xl border border-ink-800 bg-ink-900 p-3 lg:order-2">
          {(pendingChampion || pendingItem) && (
            <div className="mb-2 flex items-center gap-2 rounded-lg bg-accent/10 px-3 py-2 text-xs text-accent">
              {(pendingChampion?.icon || pendingItem?.icon) && (
                <img
                  src={pendingChampion?.icon ?? pendingItem?.icon ?? ''}
                  alt=""
                  className="h-6 w-6 rounded object-cover"
                />
              )}
              <span className="font-semibold">{pendingChampion?.name ?? pendingItem?.name}</span>
              <span className="text-accent/70">
                {pendingChampion ? '놓을 칸을 누르세요' : '장착할 유닛을 누르세요'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setPendingChampionId(null)
                  setPendingItemId(null)
                }}
                aria-label="선택 취소"
                className="ml-auto rounded p-0.5 hover:bg-accent/20"
              >
                <X size={14} />
              </button>
            </div>
          )}

          <HexBoard
            units={units}
            index={index}
            pendingChampionId={pendingChampionId}
            selectedCell={selectedCell}
            hoverCell={drag?.cell ?? null}
            dragFrom={dragFrom}
            dragKind={dragKind}
            onSetStar={setStar}
            onUnitPointerDown={startFromBoardUnit}
            onEmptyCellClick={(cell) => {
              if (pendingChampionId) placeChampion(pendingChampionId, cell)
              else if (pendingItemId) setStatus('빈 칸에는 아이템을 낄 수 없습니다. 유닛을 누르세요.')
            }}
            onUnitContextMenu={(cell) => {
              removeUnit(cell.row, cell.col)
              setStatus('유닛을 뺐습니다.')
            }}
          />

          <p className="mt-1 text-center text-[10px] leading-relaxed text-ink-400">
            위쪽이 앞줄 · 아래 목록에서 챔피언과 아이템을 끌어다 놓습니다
            <br />
            성급은 유닛에 마우스를 올려 별로 바로 정할 수 있습니다
            <br />
            <span className="hidden md:inline">빼기는 유닛에서 오른쪽 클릭</span>
            <span className="md:hidden">빼기는 유닛을 두 번 두드리기</span>
          </p>
        </div>
      </div>

      {/* 메모 */}
      <section className="rounded-xl border border-ink-800 bg-ink-900 p-3">
        <label htmlFor="deck-memo" className="mb-1.5 block text-xs font-semibold text-ink-400">
          메모
        </label>
        <textarea
          id="deck-memo"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          rows={2}
          placeholder="이 배치에 대해 기억해 둘 것 — 언제 쓰는 덱인지, 증강체 우선순위, 주의할 상대 등"
          className="w-full resize-none rounded-lg bg-ink-850 px-3 py-2 text-sm text-white placeholder:text-ink-400"
        />
      </section>

      {poolTab === 'champion' ? (
        <ChampionPool
          champions={data.champions}
          traits={data.traits}
          placedIds={placedIds}
          pendingChampionId={pendingChampionId}
          onDragStart={startFromPoolChampion}
          headerExtra={poolToggle}
        />
      ) : (
        <ItemPool data={data} pendingItemId={pendingItemId} onDragStart={startFromPoolItem} headerExtra={poolToggle} />
      )}

      {/* 끌고 다니는 동안 손가락을 따라다니는 미리보기 */}
      {(dragChampion?.icon || dragItem?.icon) && (
        <img
          src={dragChampion?.icon ?? dragItem?.icon ?? ''}
          alt=""
          className={clsx(
            'pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 object-cover opacity-90 drop-shadow-lg',
            dragChampion ? 'hex h-16 w-16 object-cover' : 'h-10 w-10 rounded bg-ink-900 object-contain p-1'
          )}
          style={{ left: drag?.x, top: drag?.y }}
        />
      )}

      {selectedUnit && (
        <UnitSheet
          unit={selectedUnit}
          index={index}
          onChange={updateUnit}
          onRemove={() => removeUnit(selectedUnit.row, selectedUnit.col)}
          onClose={() => setSelectedCell(null)}
        />
      )}
    </div>
  )
}

/** 쉼표나 엔터로 구분해 입력하는 태그 */
function TagEditor({ tags, onChange }: { tags: string[]; onChange: (next: string[]) => void }) {
  const [draft, setDraft] = useState('')

  const commit = () => {
    const value = draft.trim().replace(/,$/, '')
    if (value && !tags.includes(value)) onChange([...tags, value])
    setDraft('')
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      {tags.map((tag) => (
        <span key={tag} className="flex items-center gap-1 rounded-md bg-ink-800 px-2 py-1 text-[11px] text-ink-200">
          #{tag}
          <button
            type="button"
            onClick={() => onChange(tags.filter((t) => t !== tag))}
            aria-label={`${tag} 태그 삭제`}
            className="text-ink-400 hover:text-white"
          >
            <X size={11} />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            commit()
          }
        }}
        onBlur={commit}
        placeholder="태그 추가"
        className={clsx(
          'w-24 rounded-md bg-transparent px-1 py-1 text-[11px] text-white placeholder:text-ink-400',
          'focus:bg-ink-850'
        )}
      />
    </div>
  )
}
