import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Music, Clock, Gauge, Timer, ChevronRight } from 'lucide-react'
import type { Song } from '@/types/song'
import { formatDate, formatDurationSec } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface SongCardProps {
  song: Song
  onClick: () => void
}

function CoverArt({ url }: { url: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) return <Music className="h-6 w-6 text-zinc-500 group-hover:text-amber-500 transition-colors" />
  return (
    <img
      src={url}
      alt=""
      className="w-full h-full object-cover rounded-lg"
      onError={() => setFailed(true)}
    />
  )
}

export function SongCard({ song, onClick }: SongCardProps) {
  const { t, i18n } = useTranslation()

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50 transition-all p-4 text-left group"
    >
      <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center group-hover:bg-amber-500/10 transition-colors overflow-hidden">
        {song.coverUrl
          ? <CoverArt url={song.coverUrl} />
          : <Music className="h-6 w-6 text-zinc-500 group-hover:text-amber-500 transition-colors" />
        }
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-zinc-100 truncate">{song.title}</p>
        <p className="text-sm text-zinc-400 truncate">{song.artist}</p>
        <div className="flex items-center gap-3 mt-1">
          {song.durationSec && (
            <span className="flex items-center gap-1 text-xs text-zinc-500">
              <Timer className="h-3 w-3" />
              {formatDurationSec(song.durationSec)}
            </span>
          )}
          {song.bpm && (
            <span className="flex items-center gap-1 text-xs text-zinc-500">
              <Gauge className="h-3 w-3" />
              {song.bpm} BPM
            </span>
          )}
          {song.musicalKey && (
            <span className="text-xs text-zinc-500">{song.musicalKey}</span>
          )}
          {song.lastPracticed && (
            <span className="flex items-center gap-1 text-xs text-zinc-600">
              <Clock className="h-3 w-3" />
              {formatDate(song.lastPracticed, i18n.language)}
            </span>
          )}
          {song.tags?.map((tag) => (
            <span key={tag} className={cn(
              'text-xs px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-500',
            )}>{tag}</span>
          ))}
        </div>
      </div>

      {song.practiceCount != null && song.practiceCount > 0 && (
        <div className="flex-shrink-0 text-center">
          <p className="text-lg font-bold text-amber-500">{song.practiceCount}</p>
          <p className="text-xs text-zinc-600">{t('song.practiceCount')}</p>
        </div>
      )}

      <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-zinc-400 transition-colors flex-shrink-0" />
    </button>
  )
}
