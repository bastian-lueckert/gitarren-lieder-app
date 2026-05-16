-- Run this in your Supabase SQL editor to set up the songs table

create table if not exists public.songs (
  id           uuid primary key,
  user_id      uuid references auth.users(id) on delete cascade not null,
  title        text not null,
  artist       text not null,
  lyrics       text,
  chords       text,
  bpm          integer,
  time_signature text,
  drum_pattern text,
  musical_key  text,
  capo         integer default 0,
  notes        text,
  tags         text[] default '{}',
  last_practiced timestamptz,
  practice_count integer default 0,
  mbid         text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Row Level Security: users can only access their own songs
alter table public.songs enable row level security;

create policy "Users can manage their own songs"
  on public.songs
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Index for fast lookup
create index if not exists songs_user_id_idx on public.songs(user_id);
create index if not exists songs_updated_at_idx on public.songs(updated_at desc);
