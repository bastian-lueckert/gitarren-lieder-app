import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Music, ExternalLink } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { searchMusicBrainz, mbRecordingToSongData, type MBRecording } from '@/lib/musicbrainz'
import { formatDuration } from '@/lib/utils'

interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (data: { title: string; artist: string; mbid?: string }) => void
}

export function ImportDialog({ open, onOpenChange, onImport }: ImportDialogProps) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<MBRecording[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  async function handleSearch() {
    if (!query.trim()) return
    setLoading(true)
    setSearched(true)
    try {
      const res = await searchMusicBrainz(query)
      setResults(res)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  function handleSelect(rec: MBRecording) {
    onImport(mbRecordingToSongData(rec))
    onOpenChange(false)
    setQuery('')
    setResults([])
    setSearched(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="h-5 w-5 text-amber-500" />
            {t('import.title')}
          </DialogTitle>
          <DialogDescription>{t('import.chordsHint')}</DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('import.searchPlaceholder')}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={loading} className="shrink-0">
            <Search className="h-4 w-4" />
            {loading ? t('import.searching') : ''}
          </Button>
        </div>

        {searched && results.length === 0 && !loading && (
          <p className="text-sm text-zinc-500 text-center py-4">{t('import.noResults')}</p>
        )}

        <div className="space-y-1 max-h-80 overflow-y-auto">
          {results.map((rec) => {
            const artist = rec['artist-credit']?.[0]?.name ?? '—'
            const duration = rec.length ? formatDuration(rec.length) : null
            return (
              <button
                key={rec.id}
                onClick={() => handleSelect(rec)}
                className="w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-zinc-800 transition-colors group"
              >
                <div className="min-w-0">
                  <p className="font-medium text-zinc-100 truncate">{rec.title}</p>
                  <p className="text-sm text-zinc-400 truncate">{artist}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 text-zinc-500 text-xs">
                  {duration && <span>{duration}</span>}
                  <span className="opacity-0 group-hover:opacity-100 text-amber-500 font-medium">
                    {t('import.importSelected')}
                  </span>
                  <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                </div>
              </button>
            )
          })}
        </div>

        {results.length > 0 && (
          <p className="text-xs text-zinc-600 text-right">{t('import.source')}</p>
        )}
      </DialogContent>
    </Dialog>
  )
}
