import { supabase } from '@/lib/supabase'
import { db } from '@/db/database'
import type { Song } from '@/types/song'
import type { SongSet } from '@/types/set'
import type { PracticePlan } from '@/types/practicePlan'

// ── Row types (Supabase snake_case) ──────────────────────────────────────────

interface SongRow {
  id: string; user_id: string; title: string; artist: string
  lyrics: string | null; chords: string | null; bpm: number | null
  duration_sec: number | null; time_signature: string | null
  drum_pattern: string | null; musical_key: string | null; capo: number
  notes: string | null; tags: string[]; last_practiced: string | null
  practice_count: number; mbid: string | null; cover_url: string | null
  share_token: string | null; difficulty: number | null
  created_at: string; updated_at: string
}

interface SetRow {
  id: string; user_id: string; name: string; description: string | null
  song_ids: string[]; share_token: string | null; created_at: string; updated_at: string
}

interface PlanRow {
  id: string; user_id: string; date: string
  song_ids: string[]; completed_ids: string[]
  created_at: string; updated_at: string
}

// ── Conversion helpers ────────────────────────────────────────────────────────

function songToRow(s: Song, userId: string): SongRow {
  return {
    id: s.id, user_id: userId, title: s.title, artist: s.artist,
    lyrics: s.lyrics ?? null, chords: s.chords ?? null, bpm: s.bpm ?? null,
    duration_sec: s.durationSec ?? null, time_signature: s.timeSignature ?? null,
    drum_pattern: s.drumPattern ?? null, musical_key: s.musicalKey ?? null,
    capo: s.capo ?? 0, notes: s.notes ?? null, tags: s.tags ?? [],
    last_practiced: s.lastPracticed?.toISOString() ?? null,
    practice_count: s.practiceCount ?? 0, mbid: s.mbid ?? null,
    cover_url: s.coverUrl ?? null, share_token: s.shareToken ?? null,
    difficulty: s.difficulty ?? null,
    created_at: s.createdAt.toISOString(), updated_at: s.updatedAt.toISOString(),
  }
}

function rowToSong(r: SongRow): Song {
  return {
    id: r.id, title: r.title, artist: r.artist,
    lyrics: r.lyrics ?? undefined, chords: r.chords ?? undefined,
    bpm: r.bpm ?? undefined, durationSec: r.duration_sec ?? undefined,
    timeSignature: (r.time_signature as Song['timeSignature']) ?? undefined,
    drumPattern: (r.drum_pattern as Song['drumPattern']) ?? undefined,
    musicalKey: r.musical_key ?? undefined, capo: r.capo,
    notes: r.notes ?? undefined, tags: r.tags,
    lastPracticed: r.last_practiced ? new Date(r.last_practiced) : undefined,
    practiceCount: r.practice_count, mbid: r.mbid ?? undefined,
    coverUrl: r.cover_url ?? undefined, shareToken: r.share_token ?? undefined,
    difficulty: r.difficulty ?? undefined,
    createdAt: new Date(r.created_at), updatedAt: new Date(r.updated_at),
  }
}

function setToRow(s: SongSet, userId: string): SetRow {
  return {
    id: s.id, user_id: userId, name: s.name,
    description: s.description ?? null, song_ids: s.songIds,
    share_token: s.shareToken ?? null,
    created_at: s.createdAt.toISOString(), updated_at: s.updatedAt.toISOString(),
  }
}

function rowToSet(r: SetRow): SongSet {
  return {
    id: r.id, name: r.name, description: r.description ?? undefined,
    songIds: r.song_ids, shareToken: r.share_token ?? undefined,
    createdAt: new Date(r.created_at), updatedAt: new Date(r.updated_at),
  }
}

function planToRow(p: PracticePlan, userId: string): PlanRow {
  return {
    id: p.id, user_id: userId, date: p.date,
    song_ids: p.songIds, completed_ids: p.completedIds,
    created_at: p.createdAt.toISOString(), updated_at: p.updatedAt.toISOString(),
  }
}

function rowToPlan(r: PlanRow): PracticePlan {
  return {
    id: r.id, date: r.date,
    songIds: r.song_ids, completedIds: r.completed_ids,
    createdAt: new Date(r.created_at), updatedAt: new Date(r.updated_at),
  }
}

// ── Per-mutation push (fire-and-forget from stores) ───────────────────────────

export async function pushSong(song: Song, userId: string): Promise<void> {
  await supabase.from('songs').upsert(songToRow(song, userId))
}

export async function pushSet(s: SongSet, userId: string): Promise<void> {
  await supabase.from('sets').upsert(setToRow(s, userId))
}

export async function deleteSongCloud(id: string, userId: string): Promise<void> {
  await supabase.from('songs').delete().eq('id', id).eq('user_id', userId)
}

export async function deleteSongsCloud(ids: string[], userId: string): Promise<void> {
  await supabase.from('songs').delete().in('id', ids).eq('user_id', userId)
}

export async function deleteSetCloud(id: string, userId: string): Promise<void> {
  await supabase.from('sets').delete().eq('id', id).eq('user_id', userId)
}

export async function pushPlan(plan: PracticePlan, userId: string): Promise<void> {
  await supabase.from('plans').upsert(planToRow(plan, userId))
}

export async function deletePlanCloud(id: string, userId: string): Promise<void> {
  await supabase.from('plans').delete().eq('id', id).eq('user_id', userId)
}

// ── Full sync: push local-only additions first, then cloud overwrites local ───

export async function syncAll(userId: string): Promise<void> {
  const [localSongs, localSets, localPlans] = await Promise.all([
    db.songs.toArray(),
    db.sets.toArray(),
    db.plans.toArray(),
  ])

  // Push all local data first so offline-only additions reach the cloud
  if (localSongs.length > 0) {
    await supabase.from('songs').upsert(localSongs.map((s) => songToRow(s, userId)), { ignoreDuplicates: false })
  }
  if (localSets.length > 0) {
    await supabase.from('sets').upsert(localSets.map((s) => setToRow(s, userId)), { ignoreDuplicates: false })
  }
  if (localPlans.length > 0) {
    await supabase.from('plans').upsert(localPlans.map((p) => planToRow(p, userId)), { ignoreDuplicates: false })
  }

  // Pull all cloud data and replace local completely — cloud is the source of truth
  const [{ data: remoteSongs }, { data: remoteSets }, { data: remotePlans }] = await Promise.all([
    supabase.from('songs').select('*').eq('user_id', userId),
    supabase.from('sets').select('*').eq('user_id', userId),
    supabase.from('plans').select('*').eq('user_id', userId),
  ])

  if (remoteSongs !== null) {
    await db.songs.clear()
    if (remoteSongs.length > 0) await db.songs.bulkPut((remoteSongs as SongRow[]).map(rowToSong))
  }
  if (remoteSets !== null) {
    await db.sets.clear()
    if (remoteSets.length > 0) await db.sets.bulkPut((remoteSets as SetRow[]).map(rowToSet))
  }
  if (remotePlans !== null) {
    await db.plans.clear()
    if (remotePlans.length > 0) await db.plans.bulkPut((remotePlans as PlanRow[]).map(rowToPlan))
  }
}
