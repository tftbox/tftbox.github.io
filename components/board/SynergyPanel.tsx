'use client'

import { useState } from 'react'
import clsx from 'clsx'
import { STYLE_COLOR, type ActiveTrait } from '@/lib/synergy'

/**
 * 활성 특성 목록.
 * 모바일에서는 세로 공간이 아까우므로 활성화된 것만 먼저 보여주고,
 * 아직 부족한 특성은 접어둔다.
 */
export default function SynergyPanel({ traits }: { traits: ActiveTrait[] }) {
  const [showPending, setShowPending] = useState(false)

  const active = traits.filter((t) => t.current)
  const pending = traits.filter((t) => !t.current)

  return (
    <section className="rounded-xl border border-ink-800 bg-ink-900 p-3">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">
          특성 <span className="text-ink-400">{active.length}</span>
        </h2>
        {pending.length > 0 && (
          <button
            type="button"
            onClick={() => setShowPending((v) => !v)}
            className="text-xs text-ink-400 transition-colors hover:text-ink-200"
          >
            {showPending ? '미달 특성 숨기기' : `미달 ${pending.length}개 보기`}
          </button>
        )}
      </div>

      {active.length === 0 && pending.length === 0 && (
        <p className="py-6 text-center text-xs text-ink-400">챔피언을 배치하면 특성이 여기에 표시됩니다.</p>
      )}

      <ul className="flex flex-col gap-1.5">
        {active.map((t) => (
          <TraitRow key={t.trait.id} item={t} />
        ))}
        {showPending && pending.map((t) => <TraitRow key={t.trait.id} item={t} />)}
      </ul>
    </section>
  )
}

function TraitRow({ item }: { item: ActiveTrait }) {
  const [open, setOpen] = useState(false)
  const color = STYLE_COLOR[item.style]
  const steps = item.trait.effects

  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-ink-850"
      >
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded"
          style={{ backgroundColor: color.bg, boxShadow: `inset 0 0 0 1px ${color.ring}` }}
        >
          {item.trait.icon ? (
            <img
              src={item.trait.icon}
              alt=""
              className="h-[18px] w-[18px]"
              style={{ filter: 'brightness(0) saturate(100%) invert(1)', opacity: item.current ? 1 : 0.45 }}
            />
          ) : null}
        </span>

        <span className="min-w-0 flex-1">
          <span className={clsx('block truncate text-xs font-medium', item.current ? 'text-white' : 'text-ink-400')}>
            {item.trait.name}
          </span>
          <span className="block text-[10px] text-ink-400">
            {steps.map((s) => s.min).join(' · ')}
            {item.next && ` → ${item.next.min - item.count}명 더`}
          </span>
        </span>

        <span
          className="shrink-0 rounded px-1.5 py-0.5 text-xs font-bold tabular-nums"
          style={{ backgroundColor: color.bg, color: color.text }}
        >
          {item.count}
        </span>
      </button>

      {open && <p className="desc mt-1 rounded-lg bg-ink-950 px-3 py-2 text-[11px] leading-relaxed text-ink-400">{item.trait.desc}</p>}
    </li>
  )
}
