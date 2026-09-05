'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, Trash2 } from 'lucide-react'
import clsx from 'clsx'
import type { Deck, SetData } from '@/lib/types'
import { buildIndex, computeTraits, COST_COLOR, STYLE_COLOR } from '@/lib/synergy'
import { deleteDeck, listDecks } from '@/lib/decks'

export default function DeckLibrary({ data }: { data: SetData }) {
  const index = useMemo(() => buildIndex(data), [data])
  const [decks, setDecks] = useState<Deck[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)

  useEffect(() => {
    listDecks(data.set)
      .then(setDecks)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : '덱을 불러오지 못했습니다.'))
  }, [data.set])

  // 덱마다 검색에 쓸 문자열과 화면에 보여줄 요약을 미리 만들어 둔다
  const enriched = useMemo(() => {
    if (!decks) return []
    return decks.map((deck) => {
      const champions = deck.units
        .map((u) => index.championById.get(u.id))
        .filter((c): c is NonNullable<typeof c> => !!c)
        .sort((a, b) => b.cost - a.cost)

      const traits = computeTraits(deck.units, index).filter((t) => t.current)

      const haystack = [deck.name, deck.memo, ...deck.tags, ...champions.map((c) => c.name), ...traits.map((t) => t.trait.name)]
        .join(' ')
        .toLowerCase()

      return { deck, champions, traits, haystack }
    })
  }, [decks, index])

  const allTags = useMemo(() => {
    const set = new Set<string>()
    for (const { deck } of enriched) for (const tag of deck.tags) set.add(tag)
    return [...set].sort((a, b) => a.localeCompare(b, 'ko'))
  }, [enriched])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return enriched.filter(({ deck, haystack }) => {
      if (activeTag && !deck.tags.includes(activeTag)) return false
      return !q || haystack.includes(q)
    })
  }, [enriched, query, activeTag])

  const remove = async (deck: Deck) => {
    if (!confirm(`"${deck.name}" 덱을 삭제할까요?`)) return
    try {
      await deleteDeck(deck.id)
      setDecks((prev) => prev?.filter((d) => d.id !== deck.id) ?? null)
    } catch (e) {
      setError(e instanceof Error ? e.message : '삭제하지 못했습니다.')
    }
  }

  return (
    <div className="space-y-3">
      <header className="rounded-xl border border-ink-800 bg-ink-900 p-3">
        <div className="flex items-baseline justify-between">
          <h1 className="text-base font-bold text-white">내 덱</h1>
          <span className="text-xs text-ink-400">
            시즌 {data.set} · {decks?.length ?? 0}개
          </span>
        </div>

        <div className="relative mt-2">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="덱 이름 · 챔피언 · 특성 · 메모 검색"
            className="w-full rounded-lg bg-ink-850 py-2 pl-9 pr-3 text-sm text-white placeholder:text-ink-400"
          />
        </div>

        {allTags.length > 0 && (
          <div className="thin-scroll mt-2 flex gap-1 overflow-x-auto pb-1">
            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={clsx(
                  'shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
                  activeTag === tag ? 'bg-accent text-ink-950' : 'bg-ink-850 text-ink-400 hover:text-ink-200'
                )}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        {error && <p className="mt-2 text-[11px] text-red-400">{error}</p>}
      </header>

      {decks === null && !error && <p className="py-16 text-center text-sm text-ink-400">불러오는 중...</p>}

      {decks !== null && filtered.length === 0 && (
        <p className="py-16 text-center text-sm text-ink-400">
          {decks.length === 0 ? (
            <>
              아직 저장한 덱이 없습니다.
              <br />
              <Link href="/" className="text-accent underline">
                배치툴
              </Link>
              에서 배치를 짜고 저장해 보세요.
            </>
          ) : (
            '검색 결과가 없습니다.'
          )}
        </p>
      )}

      <ul className="grid gap-2 md:grid-cols-2">
        {filtered.map(({ deck, champions, traits }) => (
          <li key={deck.id} className="rounded-xl border border-ink-800 bg-ink-900 p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="truncate text-sm font-bold text-white">{deck.name}</h2>
                <p className="text-[11px] text-ink-400">
                  유닛 {deck.units.length} · {formatDate(deck.updatedAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => remove(deck)}
                aria-label="덱 삭제"
                className="shrink-0 rounded p-1.5 text-ink-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
              >
                <Trash2 size={15} />
              </button>
            </div>

            {/* 활성 특성 */}
            {traits.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {traits.slice(0, 6).map((t) => (
                  <span
                    key={t.trait.id}
                    className="rounded px-1.5 py-0.5 text-[10px] font-semibold"
                    style={{ backgroundColor: STYLE_COLOR[t.style].bg, color: STYLE_COLOR[t.style].text }}
                  >
                    {t.count} {t.trait.name}
                  </span>
                ))}
              </div>
            )}

            {/* 챔피언 */}
            <div className="thin-scroll mt-2 flex gap-1 overflow-x-auto pb-1">
              {champions.map((c, i) => (
                <img
                  key={`${c.id}-${i}`}
                  src={c.icon ?? ''}
                  alt={c.name}
                  title={c.name}
                  className="h-9 w-9 shrink-0 rounded border-2 object-cover"
                  style={{ borderColor: COST_COLOR[c.cost] ?? '#6b7280' }}
                />
              ))}
            </div>

            {deck.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {deck.tags.map((tag) => (
                  <span key={tag} className="rounded bg-ink-800 px-1.5 py-0.5 text-[10px] text-ink-400">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {deck.memo && <p className="mt-2 line-clamp-2 text-[11px] text-ink-400">{deck.memo}</p>}

            <Link
              href={`/?deck=${deck.id}`}
              className="mt-3 block rounded-lg bg-ink-800 py-2 text-center text-xs font-semibold text-white transition-colors hover:bg-ink-700"
            >
              배치툴에서 열기
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

function formatDate(iso: string) {
  const date = new Date(iso)
  return new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(
    date
  )
}
