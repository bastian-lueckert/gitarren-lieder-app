import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation, type TFunction } from 'react-i18next'
import { Plus, Download, Search, Guitar, ListMusic, ChevronRight, Clock, CalendarDays, CheckCircle2, Dices, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import { useSongStore } from '@/store/songStore'
import { useSetStore } from '@/store/setStore'
import { usePracticePlanStore } from '@/store/practicePlanStore'
import { getSongOfTheDay } from '@/lib/songOfTheDay'
import { SongCard } from '@/components/SongCard'
import { SongForm } from '@/components/SongForm'
import { ImportDialog } from '@/components/ImportDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import type { SongFormData } from '@/types/song'
import type { PracticePlan } from '@/types/practicePlan'
import { formatTotalDuration } from '@/lib/utils'
import { cn } from '@/lib/utils'

type SortKey = 'title' | 'artist' | 'createdAt' | 'lastPracticed'
type Tab = 'songs' | 'sets' | 'plan'

function planDateLabel(dateStr: string, t: TFunction): string {
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  if (dateStr === today) return t('plan.today')
  if (dateStr === yesterday) return t('plan.yesterday')
  const days = Math.round((Date.now() - new Date(dateStr).getTime()) / 86400000)
  return t('plan.daysAgo', { n: days })
}

export function HomePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { songs, addSong } = useSongStore()
  const { sets } = useSetStore()
  const { plans, todaysPlan, generatePlan } = usePracticePlanStore()

  const [tab, setTab] = useState<Tab>('songs')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortKey>('createdAt')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importPrefill, setImportPrefill] = useState<{ title?: string; artist?: string; mbid?: string; lyrics?: string; bpm?: number; durationSec?: number } | null>(null)
  const [songsExpanded, setSongsExpanded] = useState(false)
  const [sodImportOpen, setSodImportOpen] = useState(false)

  const COLLAPSE_LIMIT = 7
  const dailySong = getSongOfTheDay()
  const alreadyInLibrary = songs.some(
    (s) => s.title.toLowerCase() === dailySong.title.toLowerCase() &&
           s.artist.toLowerCase() === dailySong.artist.toLowerCase()
  )

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return songs
      .filter((s) =>
        s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q)
      )
      .sort((a, b) => {
        if (sort === 'title') return a.title.localeCompare(b.title)
        if (sort === 'artist') return a.artist.localeCompare(b.artist)
        if (sort === 'lastPracticed') {
          const da = a.lastPracticed ? new Date(a.lastPracticed).getTime() : 0
          const db2 = b.lastPracticed ? new Date(b.lastPracticed).getTime() : 0
          return db2 - da
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
  }, [songs, search, sort])

  async function handleAdd(data: SongFormData) {
    const song = await addSong(data)
    setShowAddDialog(false)
    setImportPrefill(null)
    navigate(`/songs/${song.id}`)
  }

  function handleImport(data: { title: string; artist: string; mbid?: string; lyrics?: string; bpm?: number; durationSec?: number }) {
    setImportPrefill(data)
    setShowAddDialog(true)
  }

  function setTotalDuration(songIds: string[]) {
    return songIds.reduce((sum, id) => {
      const song = songs.find((s) => s.id === id)
      return sum + (song?.durationSec ?? 0)
    }, 0)
  }

  return (
    <div className="space-y-6">
      {/* Tab switcher */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1 p-1 rounded-lg bg-zinc-900 border border-zinc-800 overflow-x-auto scrollbar-none min-w-0">
          <button
            onClick={() => setTab('songs')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap',
              tab === 'songs' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            <Guitar className="h-4 w-4 shrink-0" />
            <span className="hidden xs:inline sm:inline">{t('nav.songs')}</span>
            <span className="text-xs opacity-70">({songs.length})</span>
          </button>
          <button
            onClick={() => setTab('sets')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap',
              tab === 'sets' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            <ListMusic className="h-4 w-4 shrink-0" />
            <span className="hidden xs:inline sm:inline">{t('sets.title')}</span>
            <span className="text-xs opacity-70">({sets.length})</span>
          </button>
          <button
            onClick={() => setTab('plan')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap',
              tab === 'plan' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            <CalendarDays className="h-4 w-4 shrink-0" />
            <span className="hidden xs:inline sm:inline">{t('plan.title')}</span>
          </button>
        </div>

        {tab === 'songs' ? (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowImportDialog(true)}>
              <Download className="h-4 w-4" />
              {t('songs.import')}
            </Button>
            <Button size="sm" onClick={() => { setImportPrefill(null); setShowAddDialog(true) }}>
              <Plus className="h-4 w-4" />
              {t('songs.addNew')}
            </Button>
          </div>
        ) : (
          <Button size="sm" onClick={() => navigate('/sets')}>
            <Plus className="h-4 w-4" />
            {t('sets.create')}
          </Button>
        )}
      </div>

      {/* Songs tab */}
      {tab === 'songs' && (
        <>
          {/* Song of the Day */}
          <div className="rounded-xl bg-zinc-900 border border-amber-500/20 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">{t('songOfDay.title')}</span>
              <span className="text-xs text-zinc-500">{t('songOfDay.subtitle')}</span>
            </div>
            <div>
              <p className="font-bold text-zinc-100 text-lg">{dailySong.title}</p>
              <p className="text-zinc-400">{dailySong.artist}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {alreadyInLibrary ? (
                <span className="text-xs text-zinc-500 italic py-1">{t('songOfDay.alreadyInLibrary')}</span>
              ) : (
                <Button size="sm" onClick={() => setSodImportOpen(true)}>
                  <Download className="h-4 w-4" />
                  {t('songOfDay.import')}
                </Button>
              )}
              <a
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(dailySong.artist + ' ' + dailySong.title)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="sm" variant="outline">
                  <ExternalLink className="h-4 w-4" />
                  {t('songOfDay.youtube')}
                </Button>
              </a>
            </div>
          </div>

          {/* Search + Sort */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setSongsExpanded(true) }}
                placeholder={t('songs.search')}
                className="pl-9"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="createdAt">{t('songs.sortDate')}</option>
              <option value="title">{t('songs.sortTitle')}</option>
              <option value="artist">{t('songs.sortArtist')}</option>
              <option value="lastPracticed">{t('songs.sortPracticed')}</option>
            </select>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-zinc-500">
              <Guitar className="h-16 w-16 opacity-30" />
              <p className="text-lg">{t('songs.empty')}</p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4" />
                {t('songs.addNew')}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {(songsExpanded || filtered.length <= COLLAPSE_LIMIT ? filtered : filtered.slice(0, COLLAPSE_LIMIT)).map((song) => (
                <SongCard key={song.id} song={song} onClick={() => navigate(`/songs/${song.id}`)} />
              ))}
              {filtered.length > COLLAPSE_LIMIT && (
                <button
                  onClick={() => setSongsExpanded((e) => !e)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-all text-sm"
                >
                  {songsExpanded
                    ? <><ChevronUp className="h-4 w-4" /> {t('songs.showLess')}</>
                    : <><ChevronDown className="h-4 w-4" /> {t('songs.showAll', { n: filtered.length })}</>
                  }
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* Sets tab */}
      {tab === 'sets' && (
        <>
          {sets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-zinc-500">
              <ListMusic className="h-16 w-16 opacity-30" />
              <p className="text-lg">{t('sets.empty')}</p>
              <Button onClick={() => navigate('/sets')}>
                <Plus className="h-4 w-4" /> {t('sets.create')}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {sets.map((s) => {
                const total = setTotalDuration(s.songIds)
                const known = s.songIds.filter((id) => songs.find((so) => so.id === id && so.durationSec)).length
                const hasPartial = known < s.songIds.length && known > 0
                return (
                  <button
                    key={s.id}
                    onClick={() => navigate(`/sets/${s.id}`)}
                    className="w-full flex items-center gap-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50 transition-all p-4 text-left group"
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center group-hover:bg-amber-500/10 transition-colors">
                      <ListMusic className="h-6 w-6 text-zinc-500 group-hover:text-amber-500 transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-zinc-100 truncate">{s.name}</p>
                      {s.description && <p className="text-sm text-zinc-500 truncate">{s.description}</p>}
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-zinc-500">{s.songIds.length} {t('sets.songs')}</span>
                        {total > 0 && (
                          <span className="flex items-center gap-1 text-xs text-zinc-500">
                            <Clock className="h-3 w-3" />
                            {formatTotalDuration(total)}{hasPartial ? '+' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-zinc-400 transition-colors shrink-0" />
                  </button>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Practice Plan tab */}
      {tab === 'plan' && (
        <PlanTab
          plans={plans}
          songs={songs}
          todaysPlan={todaysPlan()}
          onGenerate={() => generatePlan(songs)}
          onOpen={(id) => navigate(`/practice-plan/${id}`)}
        />
      )}

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {importPrefill ? t('import.title') : t('songs.addNew')}
            </DialogTitle>
          </DialogHeader>
          <SongForm
            initial={importPrefill ?? undefined}
            onSave={handleAdd}
            onCancel={() => setShowAddDialog(false)}
          />
        </DialogContent>
      </Dialog>

      <ImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onImport={handleImport}
      />

      <ImportDialog
        open={sodImportOpen}
        onOpenChange={setSodImportOpen}
        onImport={handleImport}
        initialArtist={dailySong.artist}
        initialTitle={dailySong.title}
      />
    </div>
  )
}

interface PlanTabProps {
  plans: PracticePlan[]
  songs: { id: string }[]
  todaysPlan: PracticePlan | undefined
  onGenerate: () => Promise<PracticePlan>
  onOpen: (id: string) => void
}

function PlanTab({ plans, songs, todaysPlan, onGenerate, onOpen }: PlanTabProps) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)

  async function handleGenerate() {
    setLoading(true)
    try {
      const plan = await onGenerate()
      onOpen(plan.id)
    } finally {
      setLoading(false)
    }
  }

  if (songs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-zinc-500">
        <CalendarDays className="h-16 w-16 opacity-30" />
        <p className="text-center text-sm">{t('plan.noSongs')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Today's plan card */}
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-zinc-100">{t('plan.today')}</span>
          {todaysPlan && (
            <span className="text-xs text-zinc-500">
              {t('plan.progress', { done: todaysPlan.completedIds.length, total: todaysPlan.songIds.length })}
            </span>
          )}
        </div>

        {todaysPlan ? (
          <>
            {todaysPlan.songIds.length > 0 && (
              <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all"
                  style={{ width: `${Math.round((todaysPlan.completedIds.length / todaysPlan.songIds.length) * 100)}%` }}
                />
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">
                {t('plan.songs', { n: todaysPlan.songIds.length })}
              </span>
              <Button size="sm" onClick={() => onOpen(todaysPlan.id)}>
                {t('plan.practiceNow')}
              </Button>
            </div>
          </>
        ) : (
          <Button className="w-full" onClick={handleGenerate} disabled={loading}>
            <Dices className="h-4 w-4" />
            {t('plan.create')}
          </Button>
        )}
      </div>

      {/* History */}
      {plans.filter((p) => p.date !== new Date().toISOString().slice(0, 10)).length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider px-1">
            {t('plan.history')}
          </p>
          {plans
            .filter((p) => p.date !== new Date().toISOString().slice(0, 10))
            .map((plan) => {
              const allDone = plan.completedIds.length === plan.songIds.length && plan.songIds.length > 0
              return (
                <button
                  key={plan.id}
                  onClick={() => onOpen(plan.id)}
                  className="w-full flex items-center gap-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50 transition-all p-4 text-left group"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                    {allDone
                      ? <CheckCircle2 className="h-5 w-5 text-amber-400" />
                      : <CalendarDays className="h-5 w-5 text-zinc-500" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-zinc-100">{planDateLabel(plan.date, t)}</p>
                    <p className="text-xs text-zinc-500">
                      {plan.date} · {t('plan.done', { n: plan.completedIds.length })}{' '}
                      / {t('plan.songs', { n: plan.songIds.length })}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-zinc-400 transition-colors shrink-0" />
                </button>
              )
            })}
        </div>
      )}
    </div>
  )
}
