import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ListMusic, Clock, ChevronDown, ChevronUp, Gauge, Hash } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ChordDiagram } from '@/components/ChordDiagram'
import { Metronome } from '@/components/Metronome'
import { extractChordsFromText, lookupChord } from '@/lib/chords'
import { formatDurationSec, formatTotalDuration } from '@/lib/utils'
import type { Song, DrumPattern, TimeSignature } from '@/types/song'
import type { SongSet } from '@/types/set'

function rowToSong(r: Record<string, unknown>): Song {
  return {
    id: r.id as string,
    title: r.title as string,
    artist: r.artist as string,
    lyrics: (r.lyrics as string) ?? undefined,
    chords: (r.chords as string) ?? undefined,
    bpm: (r.bpm as number) ?? undefined,
    durationSec: (r.duration_sec as number) ?? undefined,
    timeSignature: (r.time_signature as TimeSignature) ?? undefined,
    drumPattern: (r.drum_pattern as DrumPattern) ?? undefined,
    musicalKey: (r.musical_key as string) ?? undefined,
    capo: (r.capo as number) ?? 0,
    notes: (r.notes as string) ?? undefined,
    tags: (r.tags as string[]) ?? [],
    practiceCount: (r.practice_count as number) ?? 0,
    coverUrl: (r.cover_url as string) ?? undefined,
    createdAt: new Date(r.created_at as string),
    updatedAt: new Date(r.updated_at as string),
  }
}

function rowToSet(r: Record<string, unknown>): SongSet {
  return {
    id: r.id as string,
    name: r.name as string,
    description: (r.description as string) ?? undefined,
    songIds: (r.song_ids as string[]) ?? [],
    createdAt: new Date(r.created_at as string),
    updatedAt: new Date(r.updated_at as string),
  }
}

export function SharedSetPage() {
  const { token } = useParams<{ token: string }>()
  const { t } = useTranslation()
  const [songSet, setSongSet] = useState<SongSet | null>(null)
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    if (!token) { setNotFound(true); setLoading(false); return }
    supabase.from('sets').select('*').eq('share_token', token).single()
      .then(async ({ data, error }) => {
        if (error || !data) { setNotFound(true); setLoading(false); return }
        const set = rowToSet(data as Record<string, unknown>)
        setSongSet(set)
        if (set.songIds.length > 0) {
          const { data: songRows } = await supabase.from('songs').select('*').in('id', set.songIds)
          if (songRows) {
            const ordered = set.songIds
              .map((id) => (songRows as Record<string, unknown>[]).find((r) => r.id === id))
              .filter(Boolean)
              .map((r) => rowToSong(r as Record<string, unknown>))
            setSongs(ordered)
          }
        }
        setLoading(false)
      })
  }, [token])

  const totalDuration = useMemo(
    () => songs.reduce((sum, s) => sum + (s.durationSec ?? 0), 0),
    [songs],
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (notFound || !songSet) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4 text-zinc-500 p-6">
        <ListMusic className="h-16 w-16 opacity-30" />
        <p className="text-lg font-semibold text-zinc-300">{t('share.notFound')}</p>
        <p className="text-sm text-center">{t('share.notFoundDesc')}</p>
        <PoweredBy />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-zinc-100">{songSet.name}</h1>
          {songSet.description && <p className="text-zinc-400">{songSet.description}</p>}
          <div className="flex items-center gap-3 text-sm text-zinc-500 pt-1">
            <span>{songs.length} {t('sets.songs')}</span>
            {totalDuration > 0 && (
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-amber-500" />
                <span className="font-mono text-amber-400">{formatTotalDuration(totalDuration)}</span>
              </span>
            )}
          </div>
        </div>

        {/* Songs */}
        <div className="space-y-2">
          {songs.map((song, idx) => (
            <SongCard
              key={song.id}
              song={song}
              index={idx + 1}
              expanded={expandedId === song.id}
              onToggle={() => setExpandedId(expandedId === song.id ? null : song.id)}
            />
          ))}
        </div>

        <PoweredBy />
      </div>
    </div>
  )
}

interface SongCardProps {
  song: Song
  index: number
  expanded: boolean
  onToggle: () => void
}

function SongCard({ song, index, expanded, onToggle }: SongCardProps) {
  const { t } = useTranslation()
  const [coverFailed, setCoverFailed] = useState(false)
  const [showPractice, setShowPractice] = useState(false)

  const chordPositions = useMemo(() => {
    if (!song.chords) return []
    return extractChordsFromText(song.chords).map((name) => ({ name, position: lookupChord(name) }))
  }, [song.chords])

  return (
    <div className="rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden">
      {/* Summary row */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-zinc-800/40 transition-colors"
      >
        <span className="text-zinc-600 text-sm font-mono w-5 text-center shrink-0">{index}</span>
        {song.coverUrl && !coverFailed && (
          <img
            src={song.coverUrl}
            alt=""
            className="w-9 h-9 rounded object-cover shrink-0"
            onError={() => setCoverFailed(true)}
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-zinc-100 truncate">{song.title}</p>
          <p className="text-sm text-zinc-400 truncate">{song.artist}</p>
        </div>
        {song.durationSec && (
          <span className="text-xs text-zinc-600 shrink-0">{formatDurationSec(song.durationSec)}</span>
        )}
        {expanded
          ? <ChevronUp className="h-4 w-4 text-zinc-500 shrink-0" />
          : <ChevronDown className="h-4 w-4 text-zinc-500 shrink-0" />
        }
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-zinc-800 p-4 space-y-4">
          {/* Meta */}
          <div className="flex flex-wrap gap-2">
            {song.bpm && (
              <span className="flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-800 rounded-full px-2.5 py-1">
                <Gauge className="h-3 w-3 text-amber-500" />{song.bpm} BPM
              </span>
            )}
            {song.musicalKey && (
              <span className="flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-800 rounded-full px-2.5 py-1">
                <Hash className="h-3 w-3" />{song.musicalKey}
              </span>
            )}
            {song.capo != null && song.capo > 0 && (
              <span className="text-xs text-zinc-400 bg-zinc-800 rounded-full px-2.5 py-1">Capo {song.capo}</span>
            )}
          </div>

          {/* Tabs */}
          {(song.chords || song.lyrics || song.notes) && (
            <Tabs defaultValue={song.chords ? 'chords' : 'lyrics'}>
              <TabsList>
                {song.chords && <TabsTrigger value="chords">{t('practice.chordsTab')}</TabsTrigger>}
                {song.lyrics && <TabsTrigger value="lyrics">{t('practice.lyricsTab')}</TabsTrigger>}
                {song.notes && <TabsTrigger value="notes">{t('practice.notesTab')}</TabsTrigger>}
              </TabsList>
              {song.chords && (
                <TabsContent value="chords" className="space-y-3">
                  {chordPositions.length > 0 && (
                    <div className="flex flex-wrap gap-3 px-1">
                      {chordPositions.map(({ name, position }) => (
                        <ChordDiagram key={name} name={name} position={position} />
                      ))}
                    </div>
                  )}
                  <pre className="whitespace-pre-wrap font-mono text-xs text-zinc-300 bg-zinc-950 rounded-lg p-3 border border-zinc-800 leading-relaxed overflow-x-auto">
                    {song.chords}
                  </pre>
                </TabsContent>
              )}
              {song.lyrics && (
                <TabsContent value="lyrics">
                  <pre className="whitespace-pre-wrap text-sm text-zinc-300 bg-zinc-950 rounded-lg p-3 border border-zinc-800 leading-relaxed">
                    {song.lyrics}
                  </pre>
                </TabsContent>
              )}
              {song.notes && (
                <TabsContent value="notes">
                  <pre className="whitespace-pre-wrap text-sm text-zinc-300 bg-zinc-950 rounded-lg p-3 border border-zinc-800 leading-relaxed">
                    {song.notes}
                  </pre>
                </TabsContent>
              )}
            </Tabs>
          )}

          {/* Practice toggle */}
          <div className="rounded-lg bg-zinc-950 border border-zinc-800 overflow-hidden">
            <button
              onClick={() => setShowPractice((p) => !p)}
              className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-zinc-800/40 transition-colors"
            >
              <span className="text-sm font-medium text-zinc-300">{t('share.practiceSection')}</span>
              {showPractice
                ? <ChevronUp className="h-3.5 w-3.5 text-zinc-500" />
                : <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />
              }
            </button>
            {showPractice && (
              <div className="border-t border-zinc-800 p-3">
                <Metronome
                  bpm={song.bpm ?? 120}
                  drumPattern={song.drumPattern ?? 'none'}
                  timeSignature={song.timeSignature ?? '4/4'}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function PoweredBy() {
  const { t } = useTranslation()
  return (
    <div className="text-center pt-4 pb-2">
      <p className="text-xs text-zinc-600">{t('share.poweredBy')}</p>
    </div>
  )
}
