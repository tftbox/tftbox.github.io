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
  }
}

export async function listDecks(setNumber: number): Promise<Deck[]> {
  const { data, error } = await supabase
    .from(DECK_TABLE)
    .select('*')
    .eq('set_number', setNumber)
    .order('updated_at', { ascending: false })

  if (error) fail(error)
  return (data as DeckRow[]).map(toDeck)
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
