'use client'

import { useEffect, useState } from 'react'
import { RotateCcw, Trash2, X } from 'lucide-react'
import type { Deck } from '@/lib/types'
import { deleteDeck, listTrashedDecks, restoreDeck } from '@/lib/decks'
import Sheet from './Sheet'

interface Props {
  setNumber: number
  onClose: () => void
  /** 무언가 복원되거나 완전히 지워지면, 목록(활성 덱 개수 등)을 다시 불러오라고 알려준다 */
  onChanged: () => void
}

/** 실수로 지운 덱을 되돌리거나, 정말 필요 없는 덱을 완전히 없애는 곳 */
export default function TrashSheet({ setNumber, onClose, onChanged }: Props) {
  const [decks, setDecks] = useState<Deck[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = () => {
    listTrashedDecks(setNumber)
      .then(setDecks)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : '불러오지 못했습니다.'))
  }

  useEffect(load, [setNumber])

  const restore = async (deck: Deck) => {
    setBusyId(deck.id)
    try {
      await restoreDeck(deck.id)
      setDecks((prev) => prev?.filter((d) => d.id !== deck.id) ?? null)
      onChanged()
    } catch (e) {
      setError(e instanceof Error ? e.message : '복원하지 못했습니다.')
    } finally {
      setBusyId(null)
    }
  }

  const removeForever = async (deck: Deck) => {
    if (!confirm(`"${deck.name}" 덱을 완전히 삭제할까요? 이 작업은 되돌릴 수 없습니다.`)) return
    setBusyId(deck.id)
    try {
      await deleteDeck(deck.id)
      setDecks((prev) => prev?.filter((d) => d.id !== deck.id) ?? null)
      onChanged()
    } catch (e) {
      setError(e instanceof Error ? e.message : '삭제하지 못했습니다.')
    } finally {
      setBusyId(null)
    }
  }

  const emptyTrash = async () => {
    if (!decks?.length) return
    if (!confirm(`휴지통에 있는 ${decks.length}개 덱을 전부 완전히 삭제할까요? 이 작업은 되돌릴 수 없습니다.`)) return
    setBusyId('__all__')
    try {
      for (const deck of decks) await deleteDeck(deck.id)
      setDecks([])
      onChanged()
    } catch (e) {
      setError(e instanceof Error ? e.message : '비우지 못했습니다.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <Sheet onClose={onClose}>
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ink-800 bg-ink-900 p-3">
        <h3 className="text-sm font-bold text-white">휴지통</h3>
        <div className="flex items-center gap-1">
          {decks && decks.length > 0 && (
            <button
              type="button"
              onClick={emptyTrash}
              disabled={busyId !== null}
              className="rounded-lg px-2 py-1 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
            >
              휴지통 비우기
            </button>
          )}
          <button type="button" onClick={onClose} aria-label="닫기" className="rounded p-1 text-ink-400 hover:text-white">
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="p-3">
        {error && <p className="py-8 text-center text-xs text-red-400">{error}</p>}

        {!error && decks === null && <p className="py-8 text-center text-xs text-ink-400">불러오는 중...</p>}

        {!error && decks !== null && decks.length === 0 && (
          <p className="py-8 text-center text-xs text-ink-400">휴지통이 비어 있습니다.</p>
        )}

        <ul className="space-y-1.5">
          {decks?.map((deck) => (
            <li
              key={deck.id}
              className="flex items-center justify-between gap-2 rounded-lg bg-ink-850 px-3 py-2.5"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-white">{deck.name}</span>
                <span className="block truncate text-[11px] text-ink-400">
                  유닛 {deck.units.length}개 · {formatDate(deck.deletedAt)} 삭제됨
                </span>
              </span>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => restore(deck)}
                  disabled={busyId !== null}
                  aria-label="복원"
                  title="복원"
                  className="rounded-lg p-1.5 text-ink-300 transition-colors hover:bg-accent/10 hover:text-accent disabled:opacity-50"
                >
                  <RotateCcw size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => removeForever(deck)}
                  disabled={busyId !== null}
                  aria-label="완전 삭제"
                  title="완전 삭제"
                  className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Sheet>
  )
}

function formatDate(iso: string | null) {
  if (!iso) return ''
  return new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(
    new Date(iso)
  )
}
