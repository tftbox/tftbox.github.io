'use client'

import { supabase } from './supabase'

const TABLE = 'tft_site_note'
const ID = 'global'

function fail(error: { code?: string; message: string }): never {
  if (error.code === 'PGRST205' || /Could not find the table/i.test(error.message)) {
    throw new Error('Supabase에 테이블이 아직 없습니다. supabase/schema.sql을 SQL Editor에서 실행해 주세요.')
  }
  throw new Error(error.message)
}

export interface SiteNote {
  content: string
  updatedAt: string | null
}

/** 배치판·내 덱 상단에 뜨는 공지 한 줄. 아직 아무도 안 썼으면 빈 내용으로 돌려준다. */
export async function getSiteNote(): Promise<SiteNote> {
  const { data, error } = await supabase.from(TABLE).select('content, updated_at').eq('id', ID).maybeSingle()
  if (error) fail(error)
  return { content: data?.content ?? '', updatedAt: data?.updated_at ?? null }
}

export async function saveSiteNote(content: string): Promise<SiteNote> {
  const { data, error } = await supabase
    .from(TABLE)
    .upsert({ id: ID, content, updated_at: new Date().toISOString() })
    .select('content, updated_at')
    .single()
  if (error) fail(error)
  return { content: data.content ?? '', updatedAt: data.updated_at ?? null }
}
