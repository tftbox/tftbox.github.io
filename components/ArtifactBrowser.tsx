'use client'

import { useMemo, useState } from 'react'
import { Search, Star, X } from 'lucide-react'
import clsx from 'clsx'
import type { Item } from '@/lib/types'
import { useNotes } from '@/lib/use-notes'
import Sheet from '@/components/Sheet'

type Filter = 'all' | 'favorite' | 'exclusive'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'favorite', label: '즐겨찾기' },
  { key: 'exclusive', label: '이번 시즌 전용' },
]

export default function ArtifactBrowser({ artifacts, setNumber }: { artifacts: Item[]; setNumber: number }) {
  const notes = useNotes('artifact')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [opened, setOpened] = useState<Item | null>(null)

  // 시즌 전용 유물을 따로 구분할 수 없는 시즌에서는 그 필터를 감춘다
  const hasExclusive = useMemo(() => artifacts.some((a) => a.setExclusive), [artifacts])
  const visibleFilters = FILTERS.filter((f) => f.key !== 'exclusive' || hasExclusive)

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return artifacts.filter((item) => {
      if (filter === 'favorite' && !notes.get(item.id).favorite) return false
      if (filter === 'exclusive' && !item.setExclusive) return false
      if (!q) return true
      return (
        item.name.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q) ||
        notes.get(item.id).memo.toLowerCase().includes(q)
      )
    })
  }, [artifacts, query, filter, notes])

  return (
    <div className="space-y-3">
      <header className="rounded-xl border border-ink-800 bg-ink-900 p-3">
        <div className="flex items-baseline justify-between">
          <h1 className="text-base font-bold text-white">유물</h1>
          <span className="text-xs text-ink-400">
            시즌 {setNumber} · {artifacts.length}종
          </span>
        </div>

        <div className="relative mt-2">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="이름 · 효과 · 내 메모 검색"
            className="w-full rounded-lg bg-ink-850 py-2 pl-9 pr-3 text-sm text-white placeholder:text-ink-400"
          />
        </div>

        <div className="mt-2 flex gap-1">
          {visibleFilters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={clsx(
                'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                filter === f.key ? 'bg-accent text-ink-950' : 'bg-ink-850 text-ink-400 hover:text-ink-200'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {notes.error && <p className="mt-2 text-[11px] text-red-400">{notes.error}</p>}
      </header>

      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {list.map((item) => {
          const note = notes.get(item.id)
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => setOpened(item)}
                className="flex h-full w-full flex-col rounded-xl border border-ink-800 bg-ink-900 p-3 text-left transition-colors hover:border-ink-600"
              >
                <div className="flex items-start gap-2">
                  {item.icon && <img src={item.icon} alt="" className="h-11 w-11 shrink-0 rounded-lg" />}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{item.name}</p>
                    {item.setExclusive && <span className="text-[10px] text-accent">시즌 전용</span>}
                  </div>
                  {note.favorite && <Star size={14} className="shrink-0 fill-amber-400 text-amber-400" />}
                </div>

                <p className="desc mt-2 line-clamp-3 text-[11px] leading-relaxed text-ink-400">{item.desc}</p>

                {note.memo && (
                  <p className="mt-2 line-clamp-2 rounded-md bg-ink-950 px-2 py-1 text-[11px] text-accent">
                    {note.memo}
                  </p>
                )}
              </button>
            </li>
          )
        })}

        {list.length === 0 && (
          <li className="col-span-full py-12 text-center text-sm text-ink-400">조건에 맞는 유물이 없습니다.</li>
        )}
      </ul>

      {opened && (
        <ItemDetail
          item={opened}
          note={notes.get(opened.id)}
          onToggleFavorite={() => notes.update(opened.id, { favorite: !notes.get(opened.id).favorite })}
          onMemo={(memo) => notes.update(opened.id, { memo })}
          onClose={() => setOpened(null)}
        />
      )}
    </div>
  )
}

export function ItemDetail({
  item,
  note,
  onToggleFavorite,
  onMemo,
  onClose,
  extra,
}: {
  item: Item
  note: { favorite: boolean; memo: string }
  onToggleFavorite: () => void
  onMemo: (memo: string) => void
  onClose: () => void
  extra?: React.ReactNode
}) {
  const [memo, setMemo] = useState(note.memo)

  return (
    <Sheet onClose={onClose}>
      <div className="flex items-start gap-3 border-b border-ink-800 p-4">
        {item.icon && <img src={item.icon} alt="" className="h-14 w-14 shrink-0 rounded-lg" />}
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-white">{item.name}</h3>
          {item.setExclusive && <span className="text-[11px] text-accent">이번 시즌 전용 유물</span>}
        </div>
        <button
          type="button"
          onClick={onToggleFavorite}
          aria-label="즐겨찾기"
          className="rounded p-1 text-ink-400 hover:text-amber-400"
        >
          <Star size={20} className={note.favorite ? 'fill-amber-400 text-amber-400' : ''} />
        </button>
        <button type="button" onClick={onClose} aria-label="닫기" className="rounded p-1 text-ink-400 hover:text-white">
          <X size={18} />
        </button>
      </div>

      <div className="space-y-4 p-4">
        <p className="desc text-sm leading-relaxed text-ink-200">{item.desc}</p>

        {extra}

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-ink-400">내 메모</label>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            onBlur={() => memo !== note.memo && onMemo(memo)}
            rows={3}
            placeholder="어떤 챔피언한테 좋은지, 언제 고를지 적어두세요"
            className="w-full resize-none rounded-lg bg-ink-850 px-3 py-2 text-sm text-white placeholder:text-ink-400"
          />
          <p className="mt-1 text-[11px] text-ink-400">입력칸 밖을 누르면 저장됩니다.</p>
        </div>
      </div>
    </Sheet>
  )
}
