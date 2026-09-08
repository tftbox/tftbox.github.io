'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, Megaphone, Pencil, X } from 'lucide-react'
import { getSiteNote, saveSiteNote } from '@/lib/site-note'

/**
 * 배치툴과 내 덱 상단에 뜨는 공지 한 줄.
 *
 * 로그인이 없는 개인 도구라 "누가 쓰는 화면인지"를 가리지 않는다 — 어느 쪽에서 고쳐도
 * 같은 한 줄을 같이 본다. 새로고침해야 서로 반영되고(실시간 동기화는 하지 않는다),
 * 비워 두면 아예 표시가 사라진다.
 */
export default function SiteNote() {
  const [content, setContent] = useState<string | null>(null) // null = 아직 안 불러옴
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const draftRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    let cancelled = false
    getSiteNote()
      .then((note) => {
        if (!cancelled) setContent(note.content)
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : '불러오지 못했습니다.')
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const el = draftRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [draft, editing])

  const startEdit = () => {
    setError(null)
    setDraft(content ?? '')
    setEditing(true)
  }

  const save = async () => {
    setSaving(true)
    try {
      const note = await saveSiteNote(draft.trim())
      setContent(note.content)
      setEditing(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장하지 못했습니다.')
    } finally {
      setSaving(false)
    }
  }

  // 로딩 중엔 깜빡임 없이 조용히 기다린다. 테이블이 아직 없는 경우만 알려준다.
  if (content === null) {
    if (!error) return null
    return (
      <section className="rounded-xl border border-red-500/30 bg-red-500/5 px-3 py-2 text-xs text-red-400">
        밤돌노트: {error}
      </section>
    )
  }

  if (editing) {
    return (
      <section className="rounded-xl border border-accent/30 bg-accent/5 p-3">
        <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-accent">
          <Megaphone size={14} />
          밤돌노트
        </div>
        <textarea
          ref={draftRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={2}
          autoFocus
          placeholder="다들 보게 될 공지 한마디 (비워 두면 안 보입니다)"
          className="max-h-[40vh] min-h-[2.5rem] w-full resize-none overflow-y-auto rounded-lg bg-ink-850 px-3 py-2 text-sm text-white placeholder:text-ink-400"
        />
        {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
        <div className="mt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setEditing(false)}
            disabled={saving}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-ink-400 transition-colors hover:text-white disabled:opacity-50"
          >
            <X size={13} />
            취소
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-ink-950 transition-opacity disabled:opacity-50"
          >
            <Check size={13} />
            저장
          </button>
        </div>
      </section>
    )
  }

  if (!content) {
    return (
      <button
        type="button"
        onClick={startEdit}
        className="flex w-full items-center gap-1.5 rounded-xl border border-dashed border-ink-800 bg-ink-900/50 px-3 py-2 text-left text-xs text-ink-500 transition-colors hover:border-ink-700 hover:text-ink-300"
      >
        <Megaphone size={14} className="shrink-0" />
        밤돌노트 : 눌러서 공지를 적어 보세요
      </button>
    )
  }

  return (
    <section className="rounded-xl border border-accent/30 bg-accent/5 px-3 py-2.5">
      <div className="flex items-start gap-2">
        <Megaphone size={14} className="mt-0.5 shrink-0 text-accent" />
        <p className="min-w-0 flex-1 whitespace-pre-wrap break-words text-sm">
          <span className="font-semibold text-accent">밤돌노트 : </span>
          <span className="text-accent/90">{content}</span>
        </p>
        <button
          type="button"
          onClick={startEdit}
          aria-label="밤돌노트 수정"
          title="밤돌노트 수정"
          className="shrink-0 rounded-lg p-1 text-accent/60 transition-colors hover:bg-accent/10 hover:text-accent"
        >
          <Pencil size={13} />
        </button>
      </div>
    </section>
  )
}
