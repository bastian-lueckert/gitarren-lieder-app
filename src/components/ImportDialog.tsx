import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Music, Loader2, Hand, ChevronRight, Gauge, ExternalLink } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { searchMusicBrainz, mbRecordingToSongData, type MBRecording } from '@/lib/musicbrainz'
import { fetchLyrics } from '@/lib/lyrics'
import { fetchBpmFromDeezer } from '@/lib/deezer'
import { fetchCoverArt } from '@/lib/coverart'
import { formatDuration } from '@/lib/utils'

interface ImportResult {
  title: string
  artist: string
  mbid?: string
  lyrics?: string
  bpm?: number
  durationSec?: number
  coverUrl?: string
}

interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (data: ImportResult) => void
  initialArtist?: string
  initialTitle?: string
}

type Step = 'search' | 'loading' | 'confirm'

export function ImportDialog({ open, onOpenChange, onImport, initialArtist, initialTitle }: ImportDialogProps) {
  const { t } = useTranslation()

  const [artist, setArtist] = useState(initialArtist ?? '')
  const [title, setTitle] = useState(initialTitle ?? '')
  const [results, setResults] = useState<MBRecording[]>([])
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)

  const [step, setStep] = useState<Step>('search')
  const [pending, setPending] = useState<ImportResult | null>(null)
  const [bpm, setBpm] = useState<number>(120)
  const [bpmSource, setBpmSource] = useState<'deezer' | 'tap' | 'manual' | null>(null)
  const tapTimes = useRef<number[]>([])

  // Auto-search when dialog opens with pre-filled artist/title
  useEffect(() => {
    if (open && initialArtist && initialTitle) {
      setArtist(initialArtist)
      setTitle(initialTitle)
      setStep('search')
      setSearched(false)
      setResults([])
      // Small delay so state is flushed before search fires
      const t = setTimeout(() => {
        setSearching(true)
        setSearched(true)
        searchMusicBrainz(initialArtist, initialTitle)
          .then((res) => setResults(res))
          .catch(() => setResults([]))
          .finally(() => setSearching(false))
      }, 50)
      return () => clearTimeout(t)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  async function handleSearch() {
    if (!artist.trim() && !title.trim()) return
    setSearching(true)
    setSearched(true)
    try {
      const res = await searchMusicBrainz(artist, title)
      setResults(res)
    } catch {
      setResults([])
    } finally {
      setSearching(false)
    }
  }

  async function handleSelect(rec: MBRecording) {
    setStep('loading')
    const base = mbRecordingToSongData(rec)

    const [lyrics, deezerBpm, coverUrl] = await Promise.all([
      fetchLyrics(base.artist, base.title),
      fetchBpmFromDeezer(base.artist, base.title),
      fetchCoverArt(base.artist, base.title),
    ])

    setPending({ ...base, lyrics: lyrics ?? undefined, durationSec: base.durationSec, coverUrl: coverUrl ?? undefined })
    setBpm(deezerBpm ?? 120)
    setBpmSource(deezerBpm ? 'deezer' : null)
    tapTimes.current = []
    setStep('confirm')
  }

  function handleTap() {
    const now = Date.now()
    const taps = [...tapTimes.current, now].filter((t) => now - t < 4000)
    tapTimes.current = taps
    if (taps.length >= 2) {
      const intervals = taps.slice(1).map((t, i) => t - taps[i])
      const avg = intervals.reduce((a, b) => a + b) / intervals.length
      const newBpm = Math.max(20, Math.min(300, Math.round(60000 / avg)))
      setBpm(newBpm)
      setBpmSource('tap')
    }
  }

  function handleConfirm() {
    if (!pending) return
    onImport({ ...pending, bpm })
    handleClose()
  }

  function handleSkipBpm() {
    if (!pending) return
    onImport({ ...pending, bpm: undefined })
    handleClose()
  }

  function handleClose() {
    onOpenChange(false)
    setTimeout(() => {
      setArtist('')
      setTitle('')
      setResults([])
      setSearched(false)
      setStep('search')
      setPending(null)
      setBpmSource(null)
      tapTimes.current = []
    }, 200)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">

        {/* ── Step 1: Search ── */}
        {step === 'search' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Music className="h-5 w-5 text-amber-500" />
                {t('import.title')}
              </DialogTitle>
              <DialogDescription>{t('import.chordsHint')}</DialogDescription>
            </DialogHeader>

            <div className="flex flex-col xs:flex-row gap-2">
              <Input
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder={t('song.artist')}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                autoComplete="off"
              />
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('song.title')}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                onFocus={(e) => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                autoComplete="off"
              />
              <Button onClick={handleSearch} disabled={searching} className="xs:shrink-0">
                {searching
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Search className="h-4 w-4" />}
              </Button>
            </div>

            {searched && results.length === 0 && !searching && (
              <p className="text-sm text-zinc-500 text-center py-4">{t('import.noResults')}</p>
            )}

            <div className="space-y-1 max-h-[38vh] xs:max-h-72 overflow-y-auto">
              {results.map((rec) => {
                const recArtist = rec['artist-credit']?.[0]?.name ?? '—'
                const duration = rec.length ? formatDuration(rec.length) : null
                return (
                  <button
                    key={rec.id}
                    onClick={() => handleSelect(rec)}
                    className="w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-zinc-800 transition-colors group"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-zinc-100 truncate">{rec.title}</p>
                      <p className="text-sm text-zinc-400 truncate">{recArtist}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 text-xs text-zinc-500">
                      {duration && <span>{duration}</span>}
                      <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 text-amber-500" />
                    </div>
                  </button>
                )
              })}
            </div>

            {results.length > 0 && (
              <p className="text-xs text-zinc-600 text-right">{t('import.source')}</p>
            )}
          </>
        )}

        {/* ── Step 2: Loading ── */}
        {step === 'loading' && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="h-10 w-10 text-amber-500 animate-spin" />
            <p className="text-zinc-400">{t('import.fetchingData')}</p>
          </div>
        )}

        {/* ── Step 3: Confirm BPM ── */}
        {step === 'confirm' && pending && (
          <>
            <DialogHeader>
              <DialogTitle>
                <div className="flex items-center gap-3">
                  {pending.coverUrl && (
                    <img src={pending.coverUrl} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Gauge className="h-5 w-5 text-amber-500 shrink-0" />
                      <span className="truncate">{pending.title}</span>
                    </div>
                  </div>
                </div>
              </DialogTitle>
              <DialogDescription className="flex items-center gap-3 flex-wrap">
                <span>{pending.artist}</span>
                {pending.lyrics && (
                  <span className="text-green-500 text-xs">✓ {t('import.lyricsLoaded')}</span>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-2">
              {/* BPM display */}
              <div className="text-center space-y-1">
                <p className="text-6xl font-mono font-bold text-amber-400">{bpm}</p>
                <p className="text-sm text-zinc-500">
                  {bpmSource === 'deezer' && t('import.bpmFromDeezer')}
                  {bpmSource === 'tap' && t('import.bpmFromTap')}
                  {!bpmSource && t('import.bpmNotFound')}
                </p>
              </div>

              {/* BPM Slider */}
              <div className="space-y-2">
                <Slider
                  min={40} max={240} step={1}
                  value={[bpm]}
                  onValueChange={([v]) => { setBpm(v); setBpmSource('manual') }}
                />
                <div className="flex justify-between text-xs text-zinc-600">
                  <span>40</span><span>240</span>
                </div>
              </div>

              {/* Tap button */}
              <button
                onClick={handleTap}
                className="w-full py-4 rounded-xl bg-zinc-800 border-2 border-zinc-700 hover:border-amber-500 active:scale-[0.98] transition-all flex items-center justify-center gap-3 select-none"
              >
                <Hand className="h-5 w-5 text-amber-500" />
                <span className="text-zinc-200 font-medium">{t('practice.tapTempo')}</span>
                <span className="text-xs text-zinc-500">{t('import.tapHint')}</span>
              </button>

              {/* Chord search link */}
              <a
                href={`https://www.ultimate-guitar.com/search.php?search_type=title&value=${encodeURIComponent(`${pending.artist} ${pending.title}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors text-sm"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {t('import.findChords')}
              </a>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={handleSkipBpm}>
                  {t('import.skipBpm')}
                </Button>
                <Button className="flex-1" onClick={handleConfirm}>
                  {t('import.importSelected')}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
