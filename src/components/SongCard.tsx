import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Music, Timer, ChevronRight, Check } from 'lucide-react'
import { YouTubeIcon } from '@/components/YouTubeIcon'
import type { Song } from '@/types/song'
import { formatDurationSec } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface SongCardProps {
  song: Song
  onClick: () => void
  selectionMode?: boolean
  selected?: boolean
  onSelect?: () => void
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

export function SongCard({ song, onClick, selectionMode, selected, onSelect }: SongCardProps) {
  const { t } = useTranslation()
  const ytUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${song.artist} ${song.title}`)}`

  function handleClick() {
    if (selectionMode) {
      onSelect?.()
    } else {
      onClick()
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      className={cn(
        'w-full flex items-center gap-4 rounded-xl border transition-all p-4 text-left group cursor-pointer',
        selected
          ? 'bg-amber-500/10 border-amber-500/50'
          : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50',
      )}
    >
      {/* Checkbox in selection mode, cover art otherwise */}
      <div className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden transition-colors"
        style={{ background: selected ? 'rgba(245,158,11,0.15)' : undefined }}
      >
        {selectionMode ? (
          <div className={cn(
            'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
            selected
              ? 'bg-amber-500 border-amber-500'
              : 'border-zinc-600 bg-zinc-800',
          )}>
            {selected && <Check className="h-3.5 w-3.5 text-zinc-950" strokeWidth={3} />}
          </div>
        ) : (
          <div className={cn(
            'w-full h-full rounded-lg bg-zinc-800 flex items-center justify-center group-hover:bg-amber-500/10 transition-colors overflow-hidden',
          )}>
            {song.coverUrl
              ? <CoverArt url={song.coverUrl} />
              : <Music className="h-6 w-6 text-zinc-500 group-hover:text-amber-500 transition-colors" />
            }
          </div>
        )}
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
          {song.musicalKey && (
            <span className="text-xs text-zinc-500">{song.musicalKey}</span>
          )}
          {song.difficulty != null && (
            <span className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <span
                  key={n}
                  className={cn('w-1.5 h-1.5 rounded-full', n <= song.difficulty! ? 'bg-amber-400' : 'bg-zinc-700')}
                />
              ))}
            </span>
          )}
          {song.tags?.map((tag) => (
            <span key={tag} className="text-xs px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-500">{tag}</span>
          ))}
        </div>
      </div>

      {!selectionMode && (
        <a
          href={ytUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          title={t('songOfDay.youtube')}
          className="flex-shrink-0 p-1.5 rounded-lg text-zinc-600 hover:text-[#FF0000] hover:bg-zinc-700 transition-colors"
        >
          <YouTubeIcon className="h-4 w-4" />
        </a>
      )}

      {!selectionMode && (
        <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-zinc-400 transition-colors flex-shrink-0" />
      )}
    </div>
  )
}
