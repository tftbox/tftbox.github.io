'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import type { Deck } from '@/lib/types'
import { listDecks } from '@/lib/decks'
import Sheet from '@/components/Sheet'

interface Props {
  setNumber: number
  onPick: (deck: Deck) => void
  onClose: () => void
}

/**
 * 배치툴을 떠나지 않고 저장해 둔 덱 중 하나를 골라 이어서 고치는 시트.
 *
 * "저장"은 항상 새 덱을 만들지만, 기존 덱을 수정하려면 그 덱의 deckId를
 * 화면 상태로 가져와야 "덮어쓰기" 버튼이 뜬다. 링크 없이 배치툴에 들어오면
 * 늘 빈 판에서 시작하므로, 여기서 바로 고를 수 있게 한다.
 */
export default function DeckPicker({ setNumber, onPick, onClose }: Props) {
  const [decks, setDecks] = useState<Deck[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    listDecks(setNumber)
      .then(setDecks)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : '덱을 불러오지 못했습니다.'))
  }, [setNumber])

  const filtered = useMemo(() => {
    if (!decks) return []
    const q = query.trim().toLowerCase()
    if (!q) return decks
    return decks.filter((d) => d.name.toLowerCase().includes(q) || d.tags.some((t) => t.toLowerCase().includes(q)))
  }, [decks, query])

  return (
    <Sheet onClose={onClose}>
      <div className="sticky top-0 z-10 space-y-2 border-b border-ink-800 bg-ink-900 p-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">불러올 덱 선택</h3>
          <button type="button" onClick={onClose} aria-label="닫기" className="rounded p-1 text-ink-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="덱 이름 · 태그 검색"
            className="w-full rounded-lg bg-ink-850 py-2 pl-9 pr-3 text-sm text-white placeholder:text-ink-400"
          />
        </div>
      </div>

      <div className="p-3">
        {error && <p className="py-8 text-center text-xs text-red-400">{error}</p>}

        {!error && decks === null && <p className="py-8 text-center text-xs text-ink-400">불러오는 중...</p>}

        {!error && decks !== null && filtered.length === 0 && (
          <p className="py-8 text-center text-xs text-ink-400">
            {decks.length === 0 ? '저장된 덱이 없습니다.' : '검색 결과가 없습니다.'}
          </p>
        )}

        <ul className="space-y-1.5">
          {filtered.map((deck) => (
            <li key={deck.id}>
              <button
                type="button"
                onClick={() => onPick(deck)}
                className="flex w-full items-center justify-between gap-2 rounded-lg bg-ink-850 px-3 py-2.5 text-left transition-colors hover:bg-ink-800"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-white">{deck.name}</span>
                  <span className="block truncate text-[11px] text-ink-400">
                    유닛 {deck.units.length}개
                    {deck.tags.length > 0 && ` · ${deck.tags.map((t) => `#${t}`).join(' ')}`}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Sheet>
  )
}
