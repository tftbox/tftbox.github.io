'use client'

import { supabase } from './supabase'
import type { Deck, Note, NoteKind, PlacedUnit } from './types'

const DECK_TABLE = 'tft_decks'
const NOTE_TABLE = 'tft_notes'

/** 덱을 수정하려 했는데 그 id의 행이 이미 없을 때 (다른 곳에서 지워졌거나, 링크가 오래됐거나) */
export class DeckNotFoundError extends Error {}

/**
 * Supabase가 돌려주는 메시지는 그대로 보여주면 무슨 말인지 알기 어렵다.
 * 특히 테이블을 아직 만들지 않았을 때가 그렇다.
 */
function fail(error: { code?: string; message: string }): never {
  if (error.code === 'PGRST205' || /Could not find the table/i.test(error.message)) {
    throw new Error('Supabase에 테이블이 아직 없습니다. supabase/schema.sql을 SQL Editor에서 실행해 주세요.')
  }
  // 42703: 코드는 업데이트됐는데 Supabase에 새로 추가된 열(예: deleted_at)이 아직 없는 경우
  if (error.code === '42703' || /column .* does not exist/i.test(error.message)) {
    throw new Error('Supabase 표 구조가 오래됐습니다. supabase/schema.sql을 SQL Editor에서 다시 실행해 주세요.')
  }
  // PGRST116: .single()에 걸리는 행이 0개 — update/select 대상이 이미 사라진 경우다
  if (error.code === 'PGRST116') {
    throw new DeckNotFoundError('이 덱은 더 이상 존재하지 않습니다.')
  }
  throw new Error(error.message)
}

interface DeckRow {
  id: string
  set_number: number
  name: string
  tags: string[] | null
  units: PlacedUnit[]
  memo: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

function toDeck(row: DeckRow): Deck {
  return {
    id: row.id,
    setNumber: row.set_number,
    name: row.name,
    tags: row.tags ?? [],
    units: row.units ?? [],
    memo: row.memo ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at ?? null,
  }
}

/** 휴지통에 들어있지 않은, 정상적으로 보이는 덱만 */
export async function listDecks(setNumber: number): Promise<Deck[]> {
  const { data, error } = await supabase
    .from(DECK_TABLE)
    .select('*')
    .eq('set_number', setNumber)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })

  if (error) fail(error)
  return (data as DeckRow[]).map(toDeck)
}

/** 휴지통에 들어있는 덱만, 최근에 지운 순서로 */
export async function listTrashedDecks(setNumber: number): Promise<Deck[]> {
  const { data, error } = await supabase
    .from(DECK_TABLE)
    .select('*')
    .eq('set_number', setNumber)
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false })

  if (error) fail(error)
  return (data as DeckRow[]).map(toDeck)
}

export async function countTrashedDecks(setNumber: number): Promise<number> {
  const { count, error } = await supabase
    .from(DECK_TABLE)
    .select('id', { count: 'exact', head: true })
    .eq('set_number', setNumber)
    .not('deleted_at', 'is', null)

  if (error) fail(error)
  return count ?? 0
}

export async function getDeck(id: string): Promise<Deck | null> {
  const { data, error } = await supabase.from(DECK_TABLE).select('*').eq('id', id).maybeSingle()
  if (error) fail(error)
  return data ? toDeck(data as DeckRow) : null
}

export interface DeckInput {
  name: string
  tags: string[]
  units: PlacedUnit[]
  memo: string
}

export async function createDeck(setNumber: number, input: DeckInput): Promise<Deck> {
  const { data, error } = await supabase
    .from(DECK_TABLE)
    .insert({ set_number: setNumber, ...input })
    .select()
    .single()

  if (error) fail(error)
  return toDeck(data as DeckRow)
}

export async function updateDeck(id: string, input: DeckInput): Promise<Deck> {
  const { data, error } = await supabase
    .from(DECK_TABLE)
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) fail(error)
  return toDeck(data as DeckRow)
}

/** 실수로 없애는 걸 막기 위해, 목록에서 지우는 건 실제로는 휴지통行(deleted_at 표시)일 뿐이다 */
export async function trashDeck(id: string): Promise<void> {
  const { error } = await supabase.from(DECK_TABLE).update({ deleted_at: new Date().toISOString() }).eq('id', id)
  if (error) fail(error)
}

export async function restoreDeck(id: string): Promise<void> {
  const { error } = await supabase.from(DECK_TABLE).update({ deleted_at: null }).eq('id', id)
  if (error) fail(error)
}

/**
 * 지금 보이는 덱을 전부 한 번에 휴지통으로 보낸다 ("초기화" 버튼).
 * 바로 없어지지 않고 휴지통에 남으므로, 잘못 눌러도 하나씩 복원할 수 있다.
 */
export async function trashAllDecks(setNumber: number): Promise<void> {
  const { error } = await supabase
    .from(DECK_TABLE)
    .update({ deleted_at: new Date().toISOString() })
    .eq('set_number', setNumber)
    .is('deleted_at', null)
  if (error) fail(error)
}

/** 휴지통에서 완전히 없앤다. 되돌릴 수 없다 */
export async function deleteDeck(id: string): Promise<void> {
  const { error } = await supabase.from(DECK_TABLE).delete().eq('id', id)
  if (error) fail(error)
}

// ---- 유물 / 상징 메모 ------------------------------------------------------

interface NoteRow {
  kind: NoteKind
  ref_id: string
  favorite: boolean
  memo: string | null
}

export async function listNotes(): Promise<Note[]> {
  const { data, error } = await supabase.from(NOTE_TABLE).select('*')
  if (error) fail(error)
  return (data as NoteRow[]).map((r) => ({
    kind: r.kind,
    refId: r.ref_id,
    favorite: r.favorite,
    memo: r.memo ?? '',
  }))
}

export async function saveNote(note: Note): Promise<void> {
  const { error } = await supabase.from(NOTE_TABLE).upsert(
    {
      kind: note.kind,
      ref_id: note.refId,
      favorite: note.favorite,
      memo: note.memo,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'kind,ref_id' }
  )
  if (error) fail(error)
}
