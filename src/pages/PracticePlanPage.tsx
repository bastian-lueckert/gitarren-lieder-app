import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, CheckCircle2, Circle, Play, Music, Trash2 } from 'lucide-react'
import { YouTubeIcon } from '@/components/YouTubeIcon'
import { usePracticePlanStore } from '@/store/practicePlanStore'
import { useSongStore } from '@/store/songStore'
import { Button } from '@/components/ui/button'
import { formatDurationSec } from '@/lib/utils'

function planDateLabel(dateStr: string, t: ReturnType<typeof useTranslation>['t']): string {
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  if (dateStr === today) return t('plan.today')
  if (dateStr === yesterday) return t('plan.yesterday')
  const days = Math.round((Date.now() - new Date(dateStr).getTime()) / 86400000)
  return t('plan.daysAgo', { n: days })
}

export function PracticePlanPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { plans, toggleCompleted, deletePlan } = usePracticePlanStore()
  const { songs, markPracticed } = useSongStore()

  const plan = plans.find((p) => p.id === id)

  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-zinc-500">
        <Music className="h-16 w-16 opacity-30" />
        <Button onClick={() => navigate('/')} variant="outline"><ArrowLeft className="h-4 w-4" /> Home</Button>
      </div>
    )
  }

  const orderedSongs = plan.songIds
    .map((sid) => songs.find((s) => s.id === sid))
    .filter(Boolean) as typeof songs

  const done = plan.completedIds.length
  const total = plan.songIds.length
  const allDone = done === total && total > 0
  const progress = total > 0 ? Math.round((done / total) * 100) : 0

  async function handleToggle(songId: string) {
    const wasDone = plan!.completedIds.includes(songId)
    await toggleCompleted(plan!.id, songId)
    if (!wasDone) await markPracticed(songId)
  }

  async function handleDelete() {
    await deletePlan(plan!.id)
    navigate('/')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="p-1.5 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-zinc-100">{t('plan.title')}</h1>
          <p className="text-sm text-zinc-500">{planDateLabel(plan.date, t)} · {plan.date}</p>
        </div>
        <button
          onClick={handleDelete}
          className="p-1.5 rounded hover:bg-zinc-800 text-zinc-600 hover:text-red-400 transition-colors"
          title={t('plan.delete')}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Progress */}
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-400">{t('plan.progress', { done, total })}</span>
          {allDone && (
            <span className="text-sm font-semibold text-amber-400">{t('plan.allDone')}</span>
          )}
        </div>
        <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-amber-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Song list */}
      <div className="space-y-2">
        {orderedSongs.map((song, idx) => {
          const isDone = plan.completedIds.includes(song.id)
          return (
            <div
              key={song.id}
              className={`flex items-center gap-3 rounded-xl border p-3 transition-all ${
                isDone
                  ? 'bg-zinc-900/50 border-zinc-800/50 opacity-60'
                  : 'bg-zinc-900 border-zinc-800'
              }`}
            >
              {/* Number */}
              <span className="text-zinc-600 text-sm font-mono w-5 text-center shrink-0">
                {idx + 1}
              </span>

              {/* Done toggle */}
              <button
                onClick={() => handleToggle(song.id)}
                className="shrink-0 text-zinc-500 hover:text-amber-400 transition-colors"
              >
                {isDone
                  ? <CheckCircle2 className="h-5 w-5 text-amber-400" />
                  : <Circle className="h-5 w-5" />
                }
              </button>

              {/* Cover */}
              {song.coverUrl && (
                <img
                  src={song.coverUrl}
                  alt=""
                  className="w-9 h-9 rounded object-cover shrink-0"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                />
              )}

              {/* Song info */}
              <div className="flex-1 min-w-0">
                <p className={`font-semibold truncate ${isDone ? 'line-through text-zinc-500' : 'text-zinc-100'}`}>
                  {song.title}
                </p>
                <p className="text-sm text-zinc-400 truncate">{song.artist}</p>
              </div>

              {/* Duration */}
              {song.durationSec && (
                <span className="text-xs text-zinc-600 shrink-0">
                  {formatDurationSec(song.durationSec)}
                </span>
              )}

              {/* YouTube link */}
              <a
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${song.artist} ${song.title}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                title={t('songOfDay.youtube')}
                onClick={(e) => e.stopPropagation()}
                className="shrink-0 p-1.5 rounded hover:bg-zinc-700 text-zinc-600 hover:text-[#FF0000] transition-colors"
              >
                <YouTubeIcon className="h-4 w-4" />
              </a>

              {/* Practice button */}
              <button
                onClick={() => navigate(`/songs/${song.id}/practice`)}
                className="shrink-0 p-1.5 rounded hover:bg-zinc-700 text-zinc-500 hover:text-amber-400 transition-colors"
                title={t('plan.practiceNow')}
              >
                <Play className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
