import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Music, Loader2, ChevronRight, ArrowLeft } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SongForm } from '@/components/SongForm'
import { searchMusicBrainz, mbRecordingToSongData, type MBRecording } from '@/lib/musicbrainz'
import { fetchLyrics } from '@/lib/lyrics'
import { fetchBpmFromDeezer } from '@/lib/deezer'
import { fetchCoverArt } from '@/lib/coverart'
import { formatDuration } from '@/lib/utils'
import type { Song, SongFormData } from '@/types/song'

interface AddSongDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: SongFormData) => void
  initialArtist?: string
  initialTitle?: string
}

type Step = 'search' | 'loading' | 'form'

export function AddSongDialog({ open, onOpenChange, onSave, initialArtist, initialTitle }: AddSongDialogProps) {
  const { t } = useTranslation()

  const [step, setStep] = useState<Step>('search')
  const [artist, setArtist] = useState('')
  const [title, setTitle] = useState('')
  const [results, setResults] = useState<MBRecording[]>([])
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)
  const [prefill, setPrefill] = useState<Partial<Song> | null>(null)
  const [prefillKey, setPrefillKey] = useState(0)

  // Auto-search when opened with initial values (e.g. Song of the Day)
  useEffect(() => {
    if (open && initialArtist && initialTitle) {
      setArtist(initialArtist)
      setTitle(initialTitle)
      setStep('search')
      setSearched(false)
      setResults([])
      const timer = setTimeout(() => {
        setSearching(true)
        setSearched(true)
        searchMusicBrainz(initialArtist, initialTitle)
          .then(setResults)
          .catch(() => setResults([]))
          .finally(() => setSearching(false))
      }, 50)
      return () => clearTimeout(timer)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  async function handleSearch() {
    if (!artist.trim() && !title.trim()) return
    setSearching(true)
    setSearched(true)
    try {
      setResults(await searchMusicBrainz(artist, title))
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
    setPrefill({
      title: base.title,
      artist: base.artist,
      lyrics: lyrics ?? undefined,
      bpm: deezerBpm ?? 120,
      durationSec: base.durationSec,
      coverUrl: coverUrl ?? undefined,
    })
    setPrefillKey((k) => k + 1)
    setStep('form')
  }

  function handleManual() {
    setPrefill(null)
    setPrefillKey((k) => k + 1)
    setStep('form')
  }

  function handleFormSave(data: SongFormData) {
    onSave(data)
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
      setPrefill(null)
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
                {t('songs.addNew')}
              </DialogTitle>
              <DialogDescription>{t('import.searchOrManual')}</DialogDescription>
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
              <p className="text-sm text-zinc-500 text-center py-2">{t('import.noResults')}</p>
            )}

            <div className="space-y-1 max-h-[38vh] xs:max-h-60 overflow-y-auto">
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

            <div className="border-t border-zinc-800 pt-3 space-y-2">
              <button
                onClick={handleManual}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors text-sm"
              >
                {t('import.manualEntry')}
                <ChevronRight className="h-4 w-4" />
              </button>
              {results.length > 0 && (
                <p className="text-xs text-zinc-600 text-right">{t('import.source')}</p>
              )}
            </div>
          </>
        )}

        {/* ── Step 2: Loading ── */}
        {step === 'loading' && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="h-10 w-10 text-amber-500 animate-spin" />
            <p className="text-zinc-400">{t('import.fetchingData')}</p>
          </div>
        )}

        {/* ── Step 3: Form ── */}
        {step === 'form' && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3">
                {prefill?.coverUrl && (
                  <img src={prefill.coverUrl} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <DialogTitle className="truncate">
                    {prefill?.title && prefill?.artist
                      ? `${prefill.title} – ${prefill.artist}`
                      : t('songs.addNew')}
                  </DialogTitle>
                  <button
                    onClick={() => setStep('search')}
                    className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mt-0.5"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    {t('import.backToSearch')}
                  </button>
                </div>
              </div>
            </DialogHeader>

            <SongForm
              key={prefillKey}
              initial={prefill ?? undefined}
              onSave={handleFormSave}
              onCancel={() => setStep('search')}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
