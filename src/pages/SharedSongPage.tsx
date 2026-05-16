import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Music, Gauge, Hash, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ChordDiagram } from '@/components/ChordDiagram'
import { Metronome } from '@/components/Metronome'
import { extractChordsFromText, lookupChord } from '@/lib/chords'
import type { Song, DrumPattern, TimeSignature } from '@/types/song'

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
    mbid: (r.mbid as string) ?? undefined,
    coverUrl: (r.cover_url as string) ?? undefined,
    createdAt: new Date(r.created_at as string),
    updatedAt: new Date(r.updated_at as string),
  }
}

export function SharedSongPage() {
  const { token } = useParams<{ token: string }>()
  const { t } = useTranslation()
  const [song, setSong] = useState<Song | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [showPractice, setShowPractice] = useState(false)
  const [coverFailed, setCoverFailed] = useState(false)

  useEffect(() => {
    if (!token) { setNotFound(true); setLoading(false); return }
    supabase.from('songs').select('*').eq('share_token', token).single()
      .then(({ data, error }) => {
        if (error || !data) setNotFound(true)
        else setSong(rowToSong(data as Record<string, unknown>))
        setLoading(false)
      })
  }, [token])

  const chordPositions = useMemo(() => {
    if (!song?.chords) return []
    return extractChordsFromText(song.chords).map((name) => ({ name, position: lookupChord(name) }))
  }, [song?.chords])

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (notFound || !song) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4 text-zinc-500 p-6">
        <Music className="h-16 w-16 opacity-30" />
        <p className="text-lg font-semibold text-zinc-300">{t('share.notFound')}</p>
        <p className="text-sm text-center">{t('share.notFoundDesc')}</p>
        <PoweredBy />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Title area */}
        <div className="flex items-start gap-4">
          {song.coverUrl && !coverFailed && (
            <img
              src={song.coverUrl}
              alt=""
              className="w-20 h-20 rounded-xl object-cover shrink-0 shadow-lg"
              onError={() => setCoverFailed(true)}
            />
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-bold text-zinc-100">{song.title}</h1>
            <p className="text-xl text-zinc-400 mt-1">{song.artist}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {song.bpm && (
                <span className="flex items-center gap-1.5 text-sm text-zinc-400 bg-zinc-800 rounded-full px-3 py-1">
                  <Gauge className="h-3.5 w-3.5 text-amber-500" />{song.bpm} BPM
                </span>
              )}
              {song.musicalKey && (
                <span className="flex items-center gap-1.5 text-sm text-zinc-400 bg-zinc-800 rounded-full px-3 py-1">
                  <Hash className="h-3.5 w-3.5" />{song.musicalKey}
                </span>
              )}
              {song.capo != null && song.capo > 0 && (
                <span className="text-sm text-zinc-400 bg-zinc-800 rounded-full px-3 py-1">
                  Capo {song.capo}
                </span>
              )}
              {song.timeSignature && (
                <span className="text-sm text-zinc-400 bg-zinc-800 rounded-full px-3 py-1">
                  {song.timeSignature}
                </span>
              )}
              {song.tags?.map((tag) => (
                <span key={tag} className="text-xs text-zinc-500 bg-zinc-800 rounded-full px-2.5 py-1">{tag}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Content tabs */}
        <Tabs defaultValue={song.chords ? 'chords' : 'lyrics'}>
          <TabsList>
            {song.chords && <TabsTrigger value="chords">{t('practice.chordsTab')}</TabsTrigger>}
            {song.lyrics && <TabsTrigger value="lyrics">{t('practice.lyricsTab')}</TabsTrigger>}
            {song.notes && <TabsTrigger value="notes">{t('practice.notesTab')}</TabsTrigger>}
          </TabsList>

          {song.chords && (
            <TabsContent value="chords" className="space-y-4">
              {chordPositions.length > 0 && (
                <div className="flex flex-wrap gap-4 px-1">
                  {chordPositions.map(({ name, position }) => (
                    <ChordDiagram key={name} name={name} position={position} />
                  ))}
                </div>
              )}
              <pre className="whitespace-pre-wrap font-mono text-sm text-zinc-300 bg-zinc-900 rounded-xl p-4 border border-zinc-800 leading-relaxed overflow-x-auto">
                {song.chords}
              </pre>
            </TabsContent>
          )}
          {song.lyrics && (
            <TabsContent value="lyrics">
              <pre className="whitespace-pre-wrap text-sm text-zinc-300 bg-zinc-900 rounded-xl p-4 border border-zinc-800 leading-relaxed">
                {song.lyrics}
              </pre>
            </TabsContent>
          )}
          {song.notes && (
            <TabsContent value="notes">
              <pre className="whitespace-pre-wrap text-sm text-zinc-300 bg-zinc-900 rounded-xl p-4 border border-zinc-800 leading-relaxed">
                {song.notes}
              </pre>
            </TabsContent>
          )}
        </Tabs>

        {/* Practice section */}
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden">
          <button
            onClick={() => setShowPractice((p) => !p)}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-zinc-800/50 transition-colors"
          >
            <span className="font-semibold text-zinc-200">{t('share.practiceSection')}</span>
            {showPractice
              ? <ChevronUp className="h-4 w-4 text-zinc-500" />
              : <ChevronDown className="h-4 w-4 text-zinc-500" />
            }
          </button>
          {showPractice && (
            <div className="border-t border-zinc-800 p-4">
              <Metronome
                bpm={song.bpm ?? 120}
                drumPattern={song.drumPattern ?? 'none'}
                timeSignature={song.timeSignature ?? '4/4'}
              />
            </div>
          )}
        </div>

        <PoweredBy />
      </div>
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
