-- ============================================================
-- Run this in your Supabase SQL editor (Settings → SQL Editor)
-- ============================================================

-- Songs table
create table if not exists public.songs (
  id             uuid primary key,
  user_id        uuid references auth.users(id) on delete cascade not null,
  title          text not null,
  artist         text not null,
  lyrics         text,
  chords         text,
  bpm            integer,
  duration_sec   integer,
  time_signature text,
  drum_pattern   text,
  musical_key    text,
  capo           integer default 0,
  notes          text,
  tags           text[] default '{}',
  last_practiced timestamptz,
  practice_count integer default 0,
  mbid           text,
  cover_url      text,
  share_token    text unique,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Sets table
create table if not exists public.sets (
  id          uuid primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  name        text not null,
  description text,
  song_ids    text[] default '{}',
  share_token text unique,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Row Level Security
alter table public.songs enable row level security;
alter table public.sets  enable row level security;

create policy "Users can manage their own songs"
  on public.songs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage their own sets"
  on public.sets for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Public share policies (anon role)
create policy "Public read shared songs"
  on public.songs for select to anon
  using (share_token is not null);

create policy "Public read songs in shared sets"
  on public.songs for select to anon
  using (
    id::text = any(
      select unnest(song_ids) from public.sets where share_token is not null
    )
  );

create policy "Public read shared sets"
  on public.sets for select to anon
  using (share_token is not null);

-- Migration for existing tables (run if tables already exist)
-- alter table public.songs add column if not exists share_token text unique;
-- alter table public.sets  add column if not exists share_token text unique;

-- Indexes
create index if not exists songs_user_id_idx    on public.songs(user_id);
create index if not exists songs_updated_idx    on public.songs(updated_at desc);
create index if not exists songs_share_tok_idx  on public.songs(share_token) where share_token is not null;
create index if not exists sets_user_id_idx     on public.sets(user_id);
create index if not exists sets_share_tok_idx   on public.sets(share_token) where share_token is not null;
