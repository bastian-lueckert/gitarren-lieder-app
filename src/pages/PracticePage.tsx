import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft, CheckCircle2, Music, ScrollText, PauseCircle,
  ALargeSmall, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Gauge,
} from 'lucide-react'
import { useSongStore } from '@/store/songStore'
import { useSetStore } from '@/store/setStore'
import { Metronome } from '@/components/Metronome'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import type { DrumPattern, TimeSignature } from '@/types/song'

const FONT_SIZES = [0.75, 0.875, 1, 1.125, 1.375, 1.625] as const
const FONT_LABELS = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const
const LINE_HEIGHT = 1.75
const DEFAULT_FONT_IDX = 2
const DEFAULT_LINES_PER_SEC = 1.0

function linesToPx(linesPerSec: number, fontRem: number) {
  return linesPerSec * fontRem * 16 * LINE_HEIGHT
}

function loadPref<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) ?? '') ?? fallback }
  catch { return fallback }
}

export function PracticePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()
  const { getSong, updateSong, markPracticed } = useSongStore()
  const { sets } = useSetStore()
  const song = getSong(id!)

  const [localBpm, setLocalBpm] = useState(song?.bpm ?? 120)
  const [practiced, setPracticed] = useState(false)
  const [fontIdx, setFontIdx] = useState<number>(() => loadPref('practice_fontIdx', DEFAULT_FONT_IDX))
  const [linesPerSec, setLinesPerSec] = useState<number>(() => loadPref('practice_linesPerSec', DEFAULT_LINES_PER_SEC))
  const [autoScroll, setAutoScroll] = useState(false)
  const [metroOpen, setMetroOpen] = useState(true)

  const fontRem = FONT_SIZES[fontIdx]

  // Set navigation context
  const setId = (location.state as { setId?: string; songIndex?: number } | null)?.setId
  const currentSet = setId ? sets.find((s) => s.id === setId) : undefined
  const posInSet = currentSet ? currentSet.songIds.indexOf(id!) : -1
  const prevSongId = posInSet > 0 ? currentSet!.songIds[posInSet - 1] : undefined
  const nextSongId = currentSet && posInSet < currentSet.songIds.length - 1 ? currentSet.songIds[posInSet + 1] : undefined

  function goToPractice(targetId: string, targetIdx: number) {
    navigate(`/songs/${targetId}/practice`, { state: { setId, songIndex: targetIdx } })
  }

  const scrollRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number | null>(null)
  const lastTsRef = useRef<number | null>(null)
  const scrollStateRef = useRef({ linesPerSec, fontRem })
  scrollStateRef.current = { linesPerSec, fontRem }

  const stopScroll = useCallback(() => {
    if (rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
    lastTsRef.current = null
  }, [])

  const startScroll = useCallback(() => {
    stopScroll()
    function tick(ts: number) {
      if (lastTsRef.current === null) lastTsRef.current = ts
      const delta = Math.min(ts - lastTsRef.current, 100)
      lastTsRef.current = ts
      const el = scrollRef.current
      if (el) {
        const { linesPerSec: lps, fontRem: fr } = scrollStateRef.current
        el.scrollTop += linesToPx(lps, fr) / 1000 * delta
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 4) {
          setAutoScroll(false)
          return
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [stopScroll])

  useEffect(() => {
    if (autoScroll) startScroll()
    else stopScroll()
    return stopScroll
  }, [autoScroll, startScroll, stopScroll])

  function changeFontIdx(idx: number) {
    setFontIdx(idx)
    localStorage.setItem('practice_fontIdx', JSON.stringify(idx))
  }

  function changeSpeed(v: number) {
    setLinesPerSec(v)
    localStorage.setItem('practice_linesPerSec', JSON.stringify(v))
  }

  if (!song) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-zinc-500">
        <Music className="h-16 w-16 opacity-30" />
        <Button onClick={() => navigate('/')} variant="outline">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </div>
    )
  }

  async function handleMarkPracticed() {
    await markPracticed(id!)
    if (localBpm !== song!.bpm) await updateSong(id!, { bpm: localBpm })
    setPracticed(true)
    setTimeout(() => {
      if (nextSongId) {
        goToPractice(nextSongId, posInSet + 1)
      } else if (currentSet) {
        navigate(`/sets/${setId}`)
      } else {
        navigate(`/songs/${id}`)
      }
    }, 1000)
  }

  return (
    <div
      className="flex flex-col gap-3"
      style={{ height: 'calc(100dvh - 40px)' }}
    >
      {/* Back button + practiced button */}
      <div className="shrink-0 flex items-center justify-between gap-4">
        <button
          onClick={() => navigate(`/songs/${id}`, { state: location.state })}
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors text-sm min-w-0"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          <span className="truncate">{song.title}</span>
        </button>
        <Button
          onClick={handleMarkPracticed}
          variant={practiced ? 'secondary' : 'default'}
          size="sm"
          disabled={practiced}
          className="shrink-0"
        >
          <CheckCircle2 className="h-4 w-4" />
          {practiced ? t('practice.practiced') : t('practice.markPracticed')}
        </Button>
      </div>

      {/* Title + artist */}
      <div className="shrink-0">
        <h1 className="text-xl font-bold text-zinc-100 leading-tight">{song.title}</h1>
        <p className="text-sm text-zinc-400">{song.artist}</p>
        {currentSet && (
          <p className="text-xs text-zinc-600 mt-0.5">
            {t('sets.inSet', { name: currentSet.name })} · {posInSet + 1}/{currentSet.songIds.length}
          </p>
        )}
      </div>

      {/* Metronome — collapsible */}
      <div className="shrink-0 rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
        <button
          onClick={() => setMetroOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-zinc-800/60 transition-colors"
        >
          <div className="flex items-center gap-2 text-zinc-400">
            <Gauge className="h-4 w-4 text-amber-500" />
            <span>{t('practice.metronome')}</span>
            {!metroOpen && <span className="text-xs text-zinc-600 ml-1">{localBpm} BPM</span>}
          </div>
          {metroOpen
            ? <ChevronUp className="h-4 w-4 text-zinc-500" />
            : <ChevronDown className="h-4 w-4 text-zinc-500" />}
        </button>
        <div className={metroOpen ? 'border-t border-zinc-800 p-4' : 'hidden'}>
          <Metronome
            bpm={localBpm}
            drumPattern={(song.drumPattern ?? 'rock') as DrumPattern}
            timeSignature={(song.timeSignature ?? '4/4') as TimeSignature}
            onBpmChange={setLocalBpm}
          />
        </div>
      </div>

      {/* Tabs + content — fills remaining space */}
      <Tabs
        defaultValue={song.chords ? 'chords' : 'lyrics'}
        className="flex-1 flex flex-col min-h-0 gap-2"
      >
        {/* Tab triggers */}
        <TabsList className="w-full shrink-0">
          <TabsTrigger value="chords" className="flex-1">{t('practice.chordsTab')}</TabsTrigger>
          <TabsTrigger value="lyrics" className="flex-1">{t('practice.lyricsTab')}</TabsTrigger>
          {song.notes && (
            <TabsTrigger value="notes" className="flex-1">{t('practice.notesTab')}</TabsTrigger>
          )}
        </TabsList>

        {/* Controls row: font size picker + autoscroll toggle */}
        <div className="shrink-0 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 bg-zinc-800 rounded-lg p-1">
            <ALargeSmall className="h-3.5 w-3.5 text-zinc-500 ml-1" />
            {FONT_SIZES.map((_, i) => (
              <button
                key={i}
                onClick={() => changeFontIdx(i)}
                className={cn(
                  'px-2 py-0.5 rounded text-xs font-medium transition-colors',
                  fontIdx === i
                    ? 'bg-amber-500 text-black'
                    : 'text-zinc-400 hover:text-zinc-200'
                )}
              >
                {FONT_LABELS[i]}
              </button>
            ))}
          </div>

          <button
            onClick={() => setAutoScroll((v) => !v)}
            title={autoScroll ? t('practice.scrollStop') : t('practice.scrollStart')}
            className={cn(
              'flex items-center gap-1.5 px-3 h-9 rounded-lg border text-sm font-medium transition-colors shrink-0',
              autoScroll
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200'
            )}
          >
            {autoScroll ? <PauseCircle className="h-4 w-4" /> : <ScrollText className="h-4 w-4" />}
          </button>
        </div>

        {/* Speed slider — only shown when autoscroll is active */}
        {autoScroll && (
          <div className="shrink-0 flex items-center gap-3 px-1">
            <span className="text-xs text-zinc-500 shrink-0 w-28">{t('practice.scrollSpeed')}</span>
            <Slider
              min={0.2}
              max={4}
              step={0.1}
              value={[linesPerSec]}
              onValueChange={([v]) => changeSpeed(v)}
              className="flex-1"
            />
            <span className="text-xs text-zinc-400 w-14 text-right font-mono">
              {linesPerSec.toFixed(1)} Z/s
            </span>
          </div>
        )}

        {/* Scrollable content — fills remaining height */}
        <div
          ref={scrollRef}
          className="flex-1 min-h-0 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-900 scroll-smooth"
        >
          <TabsContent value="chords" className="mt-0">
            {song.chords ? (
              <pre
                className="whitespace-pre-wrap font-mono text-zinc-200 p-4 leading-relaxed select-text"
                style={{ fontSize: `${fontRem}rem`, lineHeight: LINE_HEIGHT }}
              >
                {song.chords}
              </pre>
            ) : (
              <p className="text-center text-zinc-600 py-12 text-sm">{t('song.chords')} —</p>
            )}
          </TabsContent>

          <TabsContent value="lyrics" className="mt-0">
            {song.lyrics ? (
              <pre
                className="whitespace-pre-wrap text-zinc-200 p-4 leading-relaxed select-text"
                style={{ fontSize: `${fontRem}rem`, lineHeight: LINE_HEIGHT }}
              >
                {song.lyrics}
              </pre>
            ) : (
              <p className="text-center text-zinc-600 py-12 text-sm">{t('song.lyrics')} —</p>
            )}
          </TabsContent>

          {song.notes && (
            <TabsContent value="notes" className="mt-0">
              <pre
                className="whitespace-pre-wrap text-zinc-300 p-4 leading-relaxed select-text"
                style={{ fontSize: `${fontRem}rem`, lineHeight: LINE_HEIGHT }}
              >
                {song.notes}
              </pre>
            </TabsContent>
          )}
        </div>
      </Tabs>

      {/* Set prev/next navigation */}
      {currentSet && (
        <div className="shrink-0 flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            disabled={!prevSongId}
            onClick={() => prevSongId && goToPractice(prevSongId, posInSet - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
            {t('sets.prevSong')}
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            disabled={!nextSongId}
            onClick={() => nextSongId && goToPractice(nextSongId, posInSet + 1)}
          >
            {t('sets.nextSong')}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
