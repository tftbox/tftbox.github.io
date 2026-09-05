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
  updated_at  timestamptz not null default now()
);

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
-- 접근 정책
--
-- 로그인 없이 쓰는 개인 도구라서 publishable key(anon)로 읽고 쓸 수 있게 열어 둔다.
-- 즉, 주소와 키를 아는 사람은 누구나 이 두 테이블을 보고 고칠 수 있다.
-- 나중에 로그인을 붙이면 이 정책을 auth.uid() 기준으로 바꾸면 된다.
-- ---------------------------------------------------------------------------
alter table public.tft_decks enable row level security;
alter table public.tft_notes enable row level security;

drop policy if exists "tft_decks anon full access" on public.tft_decks;
create policy "tft_decks anon full access"
  on public.tft_decks for all
  to anon, authenticated
  using (true) with check (true);

drop policy if exists "tft_notes anon full access" on public.tft_notes;
create policy "tft_notes anon full access"
  on public.tft_notes for all
  to anon, authenticated
  using (true) with check (true);
