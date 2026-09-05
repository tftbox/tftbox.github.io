import { createClient } from '@supabase/supabase-js'

// Publishable key는 브라우저에서 쓰라고 만들어진 공개 키다.
// (테이블 접근 제어는 Supabase의 RLS 정책으로 한다 — supabase/schema.sql 참고)
const SUPABASE_URL = 'https://vmiunpyfnqhdmrfinlly.supabase.co'
const SUPABASE_KEY = 'sb_publishable_SMirdDYFSf2qLhySY37lyA_9ltmy-T9'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
