import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft, CheckCircle2, Music, ScrollText, PauseCircle,
  ALargeSmall, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Gauge,
  Maximize2, Minimize2,
} from 'lucide-react'
import { useWakeLock } from '@/hooks/useWakeLock'
import { useSongStore } from '@/store/songStore'
import { useSetStore } from '@/store/setStore'
import { Metronome } from '@/components/Metronome'
import { ChordSheet } from '@/components/ChordSheet'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import type { DrumPattern, TimeSignature } from '@/types/song'

const FONT_SIZES = [0.625, 0.75, 0.875, 1, 1.125, 1.375, 1.625] as const
const FONT_LABELS = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL'] as const
const LINE_HEIGHT = 1.75
const DEFAULT_FONT_IDX = 3
const DEFAULT_LINES_PER_SEC = 1.0

function linesToPx(linesPerSec: number, fontRem: number) {
  return linesPerSec * fontRem * 16 * LINE_HEIGHT
}

function loadPref<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) ?? '') ?? fallback }
  catch { return fallback }
}

type FocusTab = 'chords' | 'lyrics' | 'notes'

export function PracticePage() {
  useWakeLock()
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
  const [activeTab, setActiveTab] = useState<FocusTab>(() => song?.chords ? 'chords' : 'lyrics')

  // Fullscreen state
  const [fullscreen, setFullscreen] = useState(false)
  const [hudVisible, setHudVisible] = useState(true)
  const hudTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  // Autoscroll — uses a ref that points to whichever container is active
  const scrollRef = useRef<HTMLDivElement>(null)
  const fsScrollRef = useRef<HTMLDivElement>(null)
  const isFullscreenRef = useRef(false)
  isFullscreenRef.current = fullscreen

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
      const el = isFullscreenRef.current ? fsScrollRef.current : scrollRef.current
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

  // Exit fullscreen when browser's native Escape is pressed
  useEffect(() => {
    function onFsChange() {
      if (!document.fullscreenElement) setFullscreen(false)
    }
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  // Cleanup HUD timer on unmount
  useEffect(() => {
    return () => { if (hudTimerRef.current) clearTimeout(hudTimerRef.current) }
  }, [])

  function scheduleHudHide() {
    if (hudTimerRef.current) clearTimeout(hudTimerRef.current)
    hudTimerRef.current = setTimeout(() => setHudVisible(false), 3000)
  }

  function showHud() {
    setHudVisible(true)
    scheduleHudHide()
  }

  function enterFullscreen() {
    setFullscreen(true)
    setHudVisible(true)
    scheduleHudHide()
    document.documentElement.requestFullscreen?.().catch(() => {})
  }

  function exitFullscreen() {
    setFullscreen(false)
    setHudVisible(true)
    if (hudTimerRef.current) clearTimeout(hudTimerRef.current)
    if (document.fullscreenElement) document.exitFullscreen?.()
  }

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
      if (nextSongId) goToPractice(nextSongId, posInSet + 1)
      else if (currentSet) navigate(`/sets/${setId}`)
      else navigate(`/songs/${id}`)
    }, 1000)
  }

  // ── Fullscreen overlay ─────────────────────────────────────────────────────
  if (fullscreen) {
    const hasNotes = !!song.notes
    const availableTabs: FocusTab[] = ['chords', 'lyrics', ...(hasNotes ? ['notes' as FocusTab] : [])]

    return (
      <div
        className="fixed inset-0 z-[100] bg-zinc-950 flex flex-col select-none"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {/* Top HUD */}
        <div className={cn(
          'shrink-0 flex items-center justify-between gap-3 px-4 py-3',
          'bg-gradient-to-b from-zinc-950 via-zinc-950/90 to-transparent',
          'transition-opacity duration-300',
          hudVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}>
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={exitFullscreen}
              className="shrink-0 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            >
              <Minimize2 className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <p className="font-semibold text-zinc-100 text-sm leading-tight truncate">{song.title}</p>
              <p className="text-xs text-zinc-500 truncate">{song.artist}</p>
            </div>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-1 p-0.5 rounded-lg bg-zinc-800/80 shrink-0">
            {availableTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-3 py-1 rounded-md text-xs font-medium transition-colors',
                  activeTab === tab
                    ? 'bg-amber-500 text-zinc-950'
                    : 'text-zinc-400 hover:text-zinc-200',
                )}
              >
                {tab === 'chords' ? t('practice.chordsTab')
                  : tab === 'lyrics' ? t('practice.lyricsTab')
                  : t('practice.notesTab')}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable content — tap to show HUD */}
        <div
          ref={fsScrollRef}
          className="flex-1 min-h-0 overflow-y-auto select-text"
          onClick={showHud}
        >
          {activeTab === 'chords' && (
            song.chords
              ? <ChordSheet content={song.chords} fontSize={fontRem} lineHeight={LINE_HEIGHT} className="p-5 pb-28" />
              : <p className="text-center text-zinc-600 py-12 text-sm">{t('practice.chordsTab')} —</p>
          )}
          {activeTab === 'lyrics' && (
            song.lyrics
              ? <pre className="whitespace-pre-wrap text-zinc-200 p-5 pb-28 leading-relaxed select-text"
                  style={{ fontSize: `${fontRem}rem`, lineHeight: LINE_HEIGHT }}>
                  {song.lyrics}
                </pre>
              : <p className="text-center text-zinc-600 py-12 text-sm">{t('practice.lyricsTab')} —</p>
          )}
          {activeTab === 'notes' && song.notes && (
            <pre className="whitespace-pre-wrap text-zinc-300 p-5 pb-28 leading-relaxed select-text"
              style={{ fontSize: `${fontRem}rem`, lineHeight: LINE_HEIGHT }}>
              {song.notes}
            </pre>
          )}
        </div>

        {/* Bottom HUD */}
        <div className={cn(
          'absolute bottom-0 left-0 right-0',
          'bg-gradient-to-t from-zinc-950 via-zinc-950/90 to-transparent',
          'transition-opacity duration-300',
          hudVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
          style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))' }}
        >
          <div className="px-4 pt-8 pb-2 space-y-3">
            {/* Speed slider when autoscroll active */}
            {autoScroll && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-500 shrink-0 w-24">{t('practice.scrollSpeed')}</span>
                <Slider
                  min={0.2} max={4} step={0.1}
                  value={[linesPerSec]}
                  onValueChange={([v]) => changeSpeed(v)}
                  className="flex-1"
                />
                <span className="text-xs text-zinc-400 w-12 text-right font-mono">{linesPerSec.toFixed(1)} Z/s</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              {/* Font size */}
              <div className="flex items-center gap-1 bg-zinc-800/80 rounded-lg p-1 flex-1">
                <ALargeSmall className="h-3.5 w-3.5 text-zinc-500 ml-1 shrink-0" />
                {FONT_SIZES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => changeFontIdx(i)}
                    className={cn(
                      'flex-1 py-0.5 rounded text-xs font-medium transition-colors',
                      fontIdx === i ? 'bg-amber-500 text-black' : 'text-zinc-400 hover:text-zinc-200',
                    )}
                  >
                    {FONT_LABELS[i]}
                  </button>
                ))}
              </div>

              {/* Auto-scroll */}
              <button
                onClick={() => setAutoScroll((v) => !v)}
                className={cn(
                  'flex items-center gap-1.5 px-3 h-9 rounded-lg border text-sm font-medium transition-colors shrink-0',
                  autoScroll
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                    : 'bg-zinc-800/80 border-zinc-700 text-zinc-400',
                )}
              >
                {autoScroll ? <PauseCircle className="h-4 w-4" /> : <ScrollText className="h-4 w-4" />}
              </button>

              {/* Practiced */}
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
          </div>
        </div>
      </div>
    )
  }

  // ── Normal view ────────────────────────────────────────────────────────────
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

      {/* Tabs + content */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as FocusTab)}
        className="flex-1 flex flex-col min-h-0 gap-2"
      >
        <TabsList className="w-full shrink-0">
          <TabsTrigger value="chords" className="flex-1">{t('practice.chordsTab')}</TabsTrigger>
          <TabsTrigger value="lyrics" className="flex-1">{t('practice.lyricsTab')}</TabsTrigger>
          {song.notes && (
            <TabsTrigger value="notes" className="flex-1">{t('practice.notesTab')}</TabsTrigger>
          )}
        </TabsList>

        {/* Controls: font size + autoscroll + fullscreen */}
        <div className="shrink-0 flex items-center gap-2">
          <div className="flex items-center gap-1 bg-zinc-800 rounded-lg p-1 flex-1">
            <ALargeSmall className="h-3.5 w-3.5 text-zinc-500 ml-1" />
            {FONT_SIZES.map((_, i) => (
              <button
                key={i}
                onClick={() => changeFontIdx(i)}
                className={cn(
                  'flex-1 py-0.5 rounded text-xs font-medium transition-colors',
                  fontIdx === i ? 'bg-amber-500 text-black' : 'text-zinc-400 hover:text-zinc-200',
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
                : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200',
            )}
          >
            {autoScroll ? <PauseCircle className="h-4 w-4" /> : <ScrollText className="h-4 w-4" />}
          </button>

          <button
            onClick={enterFullscreen}
            title={t('practice.fullscreen')}
            className="flex items-center justify-center h-9 w-9 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors shrink-0"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>

        {/* Speed slider */}
        {autoScroll && (
          <div className="shrink-0 flex items-center gap-3 px-1">
            <span className="text-xs text-zinc-500 shrink-0 w-28">{t('practice.scrollSpeed')}</span>
            <Slider
              min={0.2} max={4} step={0.1}
              value={[linesPerSec]}
              onValueChange={([v]) => changeSpeed(v)}
              className="flex-1"
            />
            <span className="text-xs text-zinc-400 w-14 text-right font-mono">
              {linesPerSec.toFixed(1)} Z/s
            </span>
          </div>
        )}

        {/* Scrollable content */}
        <div
          ref={scrollRef}
          className="flex-1 min-h-0 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-900 scroll-smooth"
        >
          <TabsContent value="chords" className="mt-0">
            {song.chords
              ? <ChordSheet content={song.chords} fontSize={fontRem} lineHeight={LINE_HEIGHT} className="p-4" />
              : <p className="text-center text-zinc-600 py-12 text-sm">{t('song.chords')} —</p>
            }
          </TabsContent>

          <TabsContent value="lyrics" className="mt-0">
            {song.lyrics
              ? <pre className="whitespace-pre-wrap text-zinc-200 p-4 leading-relaxed select-text"
                  style={{ fontSize: `${fontRem}rem`, lineHeight: LINE_HEIGHT }}>
                  {song.lyrics}
                </pre>
              : <p className="text-center text-zinc-600 py-12 text-sm">{t('song.lyrics')} —</p>
            }
          </TabsContent>

          {song.notes && (
            <TabsContent value="notes" className="mt-0">
              <pre className="whitespace-pre-wrap text-zinc-300 p-4 leading-relaxed select-text"
                style={{ fontSize: `${fontRem}rem`, lineHeight: LINE_HEIGHT }}>
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
