import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Download, ExternalLink, Star, TrendingUp, ArrowLeft } from 'lucide-react'
import { YouTubeIcon } from '@/components/YouTubeIcon'
import { Button } from '@/components/ui/button'
import { AddSongDialog } from '@/components/ImportDialog'
import { useSongStore } from '@/store/songStore'
import { fetchUGPopular, type UGTab } from '@/lib/ugPopular'
import type { SongFormData } from '@/types/song'
import { cn } from '@/lib/utils'

export function ChartsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { songs, addSong } = useSongStore()

  const [tabs, setTabs] = useState<UGTab[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [importTarget, setImportTarget] = useState<{ artist: string; title: string } | null>(null)

  useEffect(() => {
    fetchUGPopular()
      .then((data) => {
        if (data.length === 0) setError(true)
        else setTabs(data)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  async function handleSave(data: SongFormData) {
    const song = await addSong(data)
    navigate(`/songs/${song.id}`)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-amber-400" />
          <h1 className="text-xl font-bold text-zinc-100">{t('charts.title')}</h1>
        </div>
      </div>
      <p className="text-sm text-zinc-500 pl-10">{t('charts.subtitle')}</p>

      {/* Loading */}
      {loading && (
        <div className="space-y-2 pt-2">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="h-16 rounded-xl bg-zinc-900 border border-zinc-800 animate-pulse" />
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-500">
          <TrendingUp className="h-12 w-12 opacity-30" />
          <p>{t('charts.error')}</p>
          <a
            href="https://www.ultimate-guitar.com/explore?type[]=Chords&order=hitstotal_filtered_aggregate"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4" />
              {t('charts.openUG')}
            </Button>
          </a>
        </div>
      )}

      {/* Chart list */}
      {!loading && !error && (
        <div className="space-y-2">
          {tabs.map((tab, index) => {
            const inLibrary = songs.some(
              (s) =>
                s.title.toLowerCase() === tab.song.toLowerCase() &&
                s.artist.toLowerCase() === tab.artist.toLowerCase(),
            )
            return (
              <ChartRow
                key={tab.id}
                rank={index + 1}
                tab={tab}
                inLibrary={inLibrary}
                onImport={() => setImportTarget({ artist: tab.artist, title: tab.song })}
              />
            )
          })}
          <p className="text-center text-xs text-zinc-600 pt-2">{t('charts.source')}</p>
        </div>
      )}

      <AddSongDialog
        open={importTarget !== null}
        onOpenChange={(open) => { if (!open) setImportTarget(null) }}
        onSave={handleSave}
        initialArtist={importTarget?.artist}
        initialTitle={importTarget?.title}
      />
    </div>
  )
}

interface ChartRowProps {
  rank: number
  tab: UGTab
  inLibrary: boolean
  onImport: () => void
}

function ChartRow({ rank, tab, inLibrary, onImport }: ChartRowProps) {
  const { t } = useTranslation()
  const stars = Math.round(tab.rating)

  return (
    <div className={cn(
      'flex items-center gap-3 rounded-xl border p-3 transition-colors',
      inLibrary
        ? 'bg-amber-500/5 border-amber-500/20'
        : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700',
    )}>
      {/* Rank */}
      <span className={cn(
        'w-7 text-center text-sm font-mono font-bold shrink-0',
        rank <= 3 ? 'text-amber-400' : 'text-zinc-600',
      )}>
        {rank}
      </span>

      {/* Title + meta */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-zinc-100 truncate text-sm">{tab.song}</p>
        <p className="text-xs text-zinc-400 truncate">{tab.artist}</p>
        {tab.rating > 0 && (
          <div className="flex items-center gap-1 mt-0.5">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                className={cn('h-3 w-3', i < stars ? 'text-amber-400 fill-amber-400' : 'text-zinc-700')}
              />
            ))}
            {tab.votes > 0 && (
              <span className="text-xs text-zinc-600 ml-1">({tab.votes.toLocaleString()})</span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        <a
          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(tab.artist + ' ' + tab.song)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded-lg text-zinc-500 hover:text-[#FF0000] hover:bg-zinc-800 transition-colors"
          title="YouTube"
        >
          <YouTubeIcon className="h-4 w-4" />
        </a>
        <a
          href={tab.url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
          title="Ultimate Guitar"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
        {inLibrary ? (
          <span className="text-xs text-amber-400 font-medium px-2">{t('charts.inLibrary')}</span>
        ) : (
          <button
            onClick={onImport}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-semibold transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            {t('charts.import')}
          </button>
        )}
      </div>
    </div>
  )
}
