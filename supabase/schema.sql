-- TFT 툴이 쓰는 테이블
--
-- Supabase 대시보드 → SQL Editor에 그대로 붙여넣고 실행하면 된다.
-- 여러 번 실행해도 문제없도록 만들어 두었다.

-- ---------------------------------------------------------------------------
-- 저장한 덱
-- ---------------------------------------------------------------------------
create table if not exists public.tft_decks (
  id          uuid primary key default gen_random_uuid(),
  set_number  int not null default 17,
  name        text not null,
  tags        text[] not null default '{}',
  units       jsonb not null default '[]'::jsonb,
  memo        text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

-- 이미 만든 표에 새로 추가하는 열(있으면 건너뛴다)
alter table public.tft_decks add column if not exists deleted_at timestamptz;

create index if not exists tft_decks_set_updated_idx
  on public.tft_decks (set_number, updated_at desc);

-- ---------------------------------------------------------------------------
-- 유물 · 상징에 붙이는 즐겨찾기 / 메모
-- ---------------------------------------------------------------------------
create table if not exists public.tft_notes (
  kind        text not null check (kind in ('artifact', 'emblem')),
  ref_id      text not null,
  favorite    boolean not null default false,
  memo        text not null default '',
  updated_at  timestamptz not null default now(),
  primary key (kind, ref_id)
);

-- ---------------------------------------------------------------------------
-- 밤돌노트 — 배치툴 · 내 덱 상단에 뜨는 공지 한 줄 (딱 한 행만 쓴다)
-- ---------------------------------------------------------------------------
create table if not exists public.tft_site_note (
  id          text primary key default 'global',
  content     text not null default '',
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 접근 정책
--
-- 보는 건 로그인 없이 누구나(anon) 가능하고, 저장 · 수정 · 삭제는 로그인한
-- 사람(authenticated)만 할 수 있다. 회원가입 화면은 사이트에 없으므로,
-- Supabase 대시보드 → Authentication → Users에서 계정을 직접 하나 만들어야
-- 그 계정으로 로그인해 고칠 수 있다.
-- ---------------------------------------------------------------------------
alter table public.tft_decks enable row level security;
alter table public.tft_notes enable row level security;
alter table public.tft_site_note enable row level security;

drop policy if exists "tft_decks anon full access" on public.tft_decks;
drop policy if exists "tft_decks public read" on public.tft_decks;
drop policy if exists "tft_decks owner insert" on public.tft_decks;
drop policy if exists "tft_decks owner update" on public.tft_decks;
drop policy if exists "tft_decks owner delete" on public.tft_decks;
create policy "tft_decks public read" on public.tft_decks for select to anon, authenticated using (true);
create policy "tft_decks owner insert" on public.tft_decks for insert to authenticated with check (true);
create policy "tft_decks owner update" on public.tft_decks for update to authenticated using (true) with check (true);
create policy "tft_decks owner delete" on public.tft_decks for delete to authenticated using (true);

drop policy if exists "tft_notes anon full access" on public.tft_notes;
drop policy if exists "tft_notes public read" on public.tft_notes;
drop policy if exists "tft_notes owner insert" on public.tft_notes;
drop policy if exists "tft_notes owner update" on public.tft_notes;
drop policy if exists "tft_notes owner delete" on public.tft_notes;
create policy "tft_notes public read" on public.tft_notes for select to anon, authenticated using (true);
create policy "tft_notes owner insert" on public.tft_notes for insert to authenticated with check (true);
create policy "tft_notes owner update" on public.tft_notes for update to authenticated using (true) with check (true);
create policy "tft_notes owner delete" on public.tft_notes for delete to authenticated using (true);

drop policy if exists "tft_site_note anon full access" on public.tft_site_note;
drop policy if exists "tft_site_note public read" on public.tft_site_note;
drop policy if exists "tft_site_note owner insert" on public.tft_site_note;
drop policy if exists "tft_site_note owner update" on public.tft_site_note;
create policy "tft_site_note public read" on public.tft_site_note for select to anon, authenticated using (true);
create policy "tft_site_note owner insert" on public.tft_site_note for insert to authenticated with check (true);
create policy "tft_site_note owner update" on public.tft_site_note for update to authenticated using (true) with check (true);
