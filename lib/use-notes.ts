'use client'

import { useCallback, useEffect, useState } from 'react'
import { listNotes, saveNote } from './decks'
import type { Note, NoteKind } from './types'

/**
 * 유물 · 상징에 붙이는 즐겨찾기와 메모.
 * 화면에는 바로 반영하고 저장은 뒤에서 처리한다 (실패해도 보던 걸 잃지 않게).
 */
export function useNotes(kind: NoteKind) {
  const [notes, setNotes] = useState<Record<string, Note>>({})
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    listNotes()
      .then((rows) => {
        if (cancelled) return
        const next: Record<string, Note> = {}
        for (const n of rows) if (n.kind === kind) next[n.refId] = n
        setNotes(next)
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : '메모를 불러오지 못했습니다.')
      })
    return () => {
      cancelled = true
    }
  }, [kind])

  const get = useCallback(
    (refId: string): Note => notes[refId] ?? { kind, refId, favorite: false, memo: '' },
    [notes, kind]
  )

  const update = useCallback(
    (refId: string, patch: Partial<Pick<Note, 'favorite' | 'memo'>>) => {
      setNotes((prev) => {
        const current = prev[refId] ?? { kind, refId, favorite: false, memo: '' }
        const next = { ...current, ...patch }
        saveNote(next).catch((e: unknown) => setError(e instanceof Error ? e.message : '저장하지 못했습니다.'))
        return { ...prev, [refId]: next }
      })
    },
    [kind]
  )

  return { get, update, error, favorites: Object.values(notes).filter((n) => n.favorite).length }
}
