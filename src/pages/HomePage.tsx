import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, Download, Search, Guitar, ListMusic, ChevronRight, Clock, CalendarDays, CheckCircle2, Dices, ChevronDown, ChevronUp, Trash2, X, TrendingUp } from 'lucide-react'
import { YouTubeIcon } from '@/components/YouTubeIcon'
import { useSongStore } from '@/store/songStore'
import { useSetStore } from '@/store/setStore'
import { usePracticePlanStore } from '@/store/practicePlanStore'
import { getSongOfTheDay } from '@/lib/songOfTheDay'
import { SongCard } from '@/components/SongCard'
import { AddSongDialog } from '@/components/ImportDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { fetchUGPopular, type UGTab } from '@/lib/ugPopular'
import type { SongFormData } from '@/types/song'
import type { PracticePlan } from '@/types/practicePlan'
import { formatTotalDuration } from '@/lib/utils'
import { cn } from '@/lib/utils'

type SortKey = 'title' | 'artist' | 'createdAt' | 'lastPracticed'
type Tab = 'songs' | 'sets' | 'plan'

function planDateLabel(dateStr: string, t: ReturnType<typeof useTranslation>['t']): string {
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
  const { songs, addSong, deleteSongs } = useSongStore()
  const { sets } = useSetStore()
  const { plans, todaysPlan, generatePlan, planSize, setPlanSize } = usePracticePlanStore()

  const [tab, setTab] = useState<Tab>('songs')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortKey>('createdAt')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [addDialogInitial, setAddDialogInitial] = useState<{ artist?: string; title?: string } | undefined>()
  const [songsExpanded, setSongsExpanded] = useState(false)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [chartsPreview, setChartsPreview] = useState<UGTab[]>([])

  useEffect(() => {
    fetchUGPopular().then((data) => setChartsPreview(data.slice(0, 5)))
  }, [])

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
    navigate(`/songs/${song.id}`)
  }

  function toggleSelection(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setConfirmDelete(false)
  }

  function exitSelectionMode() {
    setSelectionMode(false)
    setSelectedIds(new Set())
    setConfirmDelete(false)
  }

  function selectAll() {
    setSelectedIds(new Set(filtered.map((s) => s.id)))
    setConfirmDelete(false)
  }

  async function handleDeleteSelected() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    await deleteSongs([...selectedIds])
    exitSelectionMode()
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

        {tab === 'songs' && !selectionMode && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => { setSelectionMode(true); setSongsExpanded(true) }} className="text-zinc-400">
              {t('songs.select')}
            </Button>
            <Button size="sm" onClick={() => { setAddDialogInitial(undefined); setShowAddDialog(true) }}>
              <Plus className="h-4 w-4" />
              {t('songs.addNew')}
            </Button>
          </div>
        )}
        {tab === 'songs' && selectionMode && (
          <Button size="sm" variant="outline" onClick={exitSelectionMode} className="text-zinc-400">
            <X className="h-4 w-4" />
            {t('songs.cancelSelect')}
          </Button>
        )}
        {tab !== 'songs' && (
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
                <Button size="sm" onClick={() => { setAddDialogInitial({ artist: dailySong.artist, title: dailySong.title }); setShowAddDialog(true) }}>
                  <Download className="h-4 w-4" />
                  {t('songOfDay.import')}
                </Button>
              )}
              <a
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(dailySong.artist + ' ' + dailySong.title)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="sm" variant="outline" className="hover:text-[#FF0000] hover:border-red-500/40">
                  <YouTubeIcon className="h-4 w-4" />
                  {t('songOfDay.youtube')}
                </Button>
              </a>
            </div>
          </div>

          {/* UG Charts Preview */}
          {chartsPreview.length > 0 && (
            <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-amber-400" />
                  <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">{t('charts.title')}</span>
                </div>
                <button
                  onClick={() => navigate('/charts')}
                  className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1"
                >
                  {t('charts.viewAll')}
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="space-y-1">
                {chartsPreview.map((tab, i) => {
                  const inLibrary = songs.some(
                    (s) =>
                      s.title.toLowerCase() === tab.song.toLowerCase() &&
                      s.artist.toLowerCase() === tab.artist.toLowerCase(),
                  )
                  return (
                    <div key={tab.id} className="flex items-center gap-2.5 py-1.5">
                      <span className={cn('w-5 text-xs font-mono font-bold shrink-0 text-center', i < 3 ? 'text-amber-400' : 'text-zinc-600')}>
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-zinc-200 truncate block">{tab.song}</span>
                        <span className="text-xs text-zinc-500 truncate block">{tab.artist}</span>
                      </div>
                      {inLibrary ? (
                        <span className="text-xs text-amber-400 font-medium shrink-0">{t('charts.inLibrary')}</span>
                      ) : (
                        <button
                          onClick={() => { setAddDialogInitial({ artist: tab.artist, title: tab.song }); setShowAddDialog(true) }}
                          className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors"
                        >
                          <Download className="h-3 w-3" />
                          {t('charts.import')}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

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
            <div className={cn('space-y-2', selectionMode && selectedIds.size > 0 && 'pb-24')}>
              {selectionMode && filtered.length > 0 && (
                <div className="flex items-center gap-2 px-1">
                  <button
                    onClick={selectAll}
                    className="text-xs text-amber-500 hover:text-amber-400 transition-colors"
                  >
                    {t('songs.selectAll')}
                  </button>
                  <span className="text-zinc-700">·</span>
                  <button
                    onClick={() => { setSelectedIds(new Set()); setConfirmDelete(false) }}
                    className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {t('songs.deselectAll')}
                  </button>
                  {selectedIds.size > 0 && (
                    <span className="ml-auto text-xs text-zinc-500">{selectedIds.size} ausgewählt</span>
                  )}
                </div>
              )}
              {(songsExpanded || selectionMode || filtered.length <= COLLAPSE_LIMIT ? filtered : filtered.slice(0, COLLAPSE_LIMIT)).map((song) => (
                <SongCard
                  key={song.id}
                  song={song}
                  onClick={() => navigate(`/songs/${song.id}`)}
                  selectionMode={selectionMode}
                  selected={selectedIds.has(song.id)}
                  onSelect={() => toggleSelection(song.id)}
                />
              ))}
              {!selectionMode && filtered.length > COLLAPSE_LIMIT && (
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
              {selectionMode && selectedIds.size > 0 && (
                <div className="fixed bottom-4 left-4 right-4 z-50 max-w-2xl mx-auto">
                  <button
                    onClick={handleDeleteSelected}
                    className={cn(
                      'w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all shadow-2xl',
                      confirmDelete
                        ? 'bg-red-600 hover:bg-red-500 text-white'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-red-400 border border-red-500/30',
                    )}
                  >
                    <Trash2 className="h-4 w-4" />
                    {confirmDelete
                      ? t('songs.confirmDeleteSelected', { n: selectedIds.size })
                      : t('songs.deleteSelected', { n: selectedIds.size })
                    }
                  </button>
                </div>
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
          planSize={planSize}
          onPlanSizeChange={setPlanSize}
          onGenerate={() => generatePlan(songs)}
          onOpen={(id) => navigate(`/practice-plan/${id}`)}
        />
      )}

      <AddSongDialog
        open={showAddDialog}
        onOpenChange={(open) => { setShowAddDialog(open); if (!open) setAddDialogInitial(undefined) }}
        onSave={handleAdd}
        initialArtist={addDialogInitial?.artist}
        initialTitle={addDialogInitial?.title}
      />
    </div>
  )
}

interface PlanTabProps {
  plans: PracticePlan[]
  songs: { id: string }[]
  todaysPlan: PracticePlan | undefined
  planSize: number
  onPlanSizeChange: (n: number) => void
  onGenerate: () => Promise<PracticePlan>
  onOpen: (id: string) => void
}

function PlanTab({ plans, songs, todaysPlan, planSize, onPlanSizeChange, onGenerate, onOpen }: PlanTabProps) {
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

        {/* Plan size stepper — only before a plan is created */}
        {!todaysPlan && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">{t('plan.planSize')}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onPlanSizeChange(planSize - 1)}
                className="w-7 h-7 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold flex items-center justify-center transition-colors"
              >−</button>
              <span className="text-sm font-mono font-bold text-amber-400 w-6 text-center">{planSize}</span>
              <button
                onClick={() => onPlanSizeChange(planSize + 1)}
                className="w-7 h-7 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold flex items-center justify-center transition-colors"
              >+</button>
            </div>
          </div>
        )}

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
