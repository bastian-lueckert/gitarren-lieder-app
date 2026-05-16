import { useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft, ChevronUp, ChevronDown, Trash2, Plus, Search,
  Clock, ListMusic, Timer, Pencil, Share2, FileDown, Link, Unlink,
} from 'lucide-react'
import { useSetStore } from '@/store/setStore'
import { useSongStore } from '@/store/songStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { formatDurationSec, formatTotalDuration } from '@/lib/utils'
import { exportSetPdf } from '@/lib/exportPdf'

export function SetDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { sets, moveSong, addSongToSet, removeSongFromSet, updateSet, toggleSetShare } = useSetStore()
  const { songs } = useSongStore()

  const [showAddSong, setShowAddSong] = useState(false)
  const [search, setSearch] = useState('')
  const [showRename, setShowRename] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [shareCopied, setShareCopied] = useState(false)
  const [showShareAppDialog, setShowShareAppDialog] = useState(false)
  const [appLinkCopied, setAppLinkCopied] = useState(false)

  const set = sets.find((s) => s.id === id)

  const orderedSongs = useMemo(() => {
    if (!set) return []
    return set.songIds.map((sid) => songs.find((s) => s.id === sid)).filter(Boolean) as typeof songs
  }, [set, songs])

  const availableSongs = useMemo(() => {
    if (!set) return []
    const q = search.toLowerCase()
    return songs
      .filter((s) => !set.songIds.includes(s.id))
      .filter((s) => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q))
  }, [songs, set, search])

  const totalDuration = useMemo(() => {
    return orderedSongs.reduce((sum, s) => sum + (s.durationSec ?? 0), 0)
  }, [orderedSongs])

  const knownCount = useMemo(() => {
    return orderedSongs.filter((s) => s.durationSec).length
  }, [orderedSongs])

  function openRename() {
    setEditName(set?.name ?? '')
    setEditDesc(set?.description ?? '')
    setShowRename(true)
  }

  async function handleRename() {
    if (!editName.trim() || !set) return
    await updateSet(set.id, { name: editName.trim(), description: editDesc.trim() || undefined })
    setShowRename(false)
  }

  function handleShare() {
    if (!set) return
    const durationLine = totalDuration > 0
      ? ` (${formatTotalDuration(totalDuration)}${knownCount < orderedSongs.length ? '+' : ''})`
      : ''
    const lines = [
      `🎸 ${set.name}${durationLine}`,
      '',
      ...orderedSongs.map((s, i) => {
        const dur = s.durationSec ? ` (${formatDurationSec(s.durationSec)})` : ''
        return `${i + 1}. ${s.title} – ${s.artist}${dur}`
      }),
    ]
    const text = lines.join('\n')
    if (navigator.share) {
      navigator.share({ title: set.name, text }).catch(() => {})
    } else {
      navigator.clipboard.writeText(text).then(() => {
        setShareCopied(true)
        setTimeout(() => setShareCopied(false), 2000)
      })
    }
  }

  if (!set) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-zinc-500">
        <ListMusic className="h-16 w-16 opacity-30" />
        <p>{t('sets.notFound')}</p>
        <Button onClick={() => navigate('/sets')}>{t('sets.title')}</Button>
      </div>
    )
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
          <h1 className="text-2xl font-bold text-zinc-100 truncate">{set.name}</h1>
          {set.description && <p className="text-sm text-zinc-500">{set.description}</p>}
        </div>
        <button
          onClick={openRename}
          className="p-1.5 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
          title={t('sets.rename')}
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={handleShare}
          className="p-1.5 rounded hover:bg-zinc-800 text-zinc-500 hover:text-amber-400 transition-colors"
          title={t('share.setlist')}
        >
          {shareCopied
            ? <span className="text-xs text-amber-400 font-medium px-1">{t('share.copied')}</span>
            : <Share2 className="h-4 w-4" />
          }
        </button>
        <button
          onClick={() => exportSetPdf(set, songs)}
          className="p-1.5 rounded hover:bg-zinc-800 text-zinc-500 hover:text-amber-400 transition-colors"
          title={t('share.exportPdf')}
        >
          <FileDown className="h-4 w-4" />
        </button>
        <button
          onClick={() => setShowShareAppDialog(true)}
          className="p-1.5 rounded hover:bg-zinc-800 transition-colors"
          title={t('share.setLink')}
        >
          <Link className={`h-4 w-4 ${set.shareToken ? 'text-amber-400' : 'text-zinc-500 hover:text-amber-400'}`} />
        </button>
        <Button size="sm" onClick={() => setShowAddSong(true)}>
          <Plus className="h-4 w-4" />
          {t('sets.addSong')}
        </Button>
      </div>

      {/* Duration summary */}
      {orderedSongs.length > 0 && (
        <div className="flex items-center gap-4 px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800">
          <span className="text-sm text-zinc-400">
            {orderedSongs.length} {t('sets.songs')}
          </span>
          {totalDuration > 0 && (
            <span className="flex items-center gap-1.5 text-sm text-zinc-400">
              <Clock className="h-4 w-4 text-amber-500" />
              <span className="font-mono font-semibold text-amber-400">
                {formatTotalDuration(totalDuration)}
              </span>
              {knownCount < orderedSongs.length && (
                <span className="text-zinc-600 text-xs">+</span>
              )}
            </span>
          )}
        </div>
      )}

      {/* Song list */}
      {orderedSongs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-zinc-500">
          <ListMusic className="h-16 w-16 opacity-30" />
          <p>{t('sets.emptySongs')}</p>
          <Button onClick={() => setShowAddSong(true)}>
            <Plus className="h-4 w-4" /> {t('sets.addSong')}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {orderedSongs.map((song, idx) => (
            <div
              key={song.id}
              className="flex items-center gap-3 rounded-xl bg-zinc-900 border border-zinc-800 p-3 group"
            >
              {/* Position */}
              <span className="text-zinc-600 text-sm font-mono w-5 text-center shrink-0">
                {idx + 1}
              </span>

              {/* Reorder */}
              <div className="flex flex-col gap-0.5 shrink-0">
                <button
                  onClick={() => moveSong(set.id, song.id, 'up')}
                  disabled={idx === 0}
                  className="p-0.5 rounded hover:bg-zinc-700 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronUp className="h-3.5 w-3.5 text-zinc-500" />
                </button>
                <button
                  onClick={() => moveSong(set.id, song.id, 'down')}
                  disabled={idx === orderedSongs.length - 1}
                  className="p-0.5 rounded hover:bg-zinc-700 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />
                </button>
              </div>

              {/* Cover thumbnail */}
              {song.coverUrl && (
                <img
                  src={song.coverUrl}
                  alt=""
                  className="w-9 h-9 rounded object-cover shrink-0"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                />
              )}

              {/* Song info */}
              <button
                className="flex-1 min-w-0 text-left"
                onClick={() => navigate(`/songs/${song.id}`, { state: { setId: set.id, songIndex: idx } })}
              >
                <p className="font-semibold text-zinc-100 truncate">{song.title}</p>
                <p className="text-sm text-zinc-400 truncate">{song.artist}</p>
              </button>

              {/* Duration */}
              {song.durationSec ? (
                <span className="flex items-center gap-1 text-xs text-zinc-500 shrink-0">
                  <Timer className="h-3 w-3" />
                  {formatDurationSec(song.durationSec)}
                </span>
              ) : (
                <span className="text-xs text-zinc-700 shrink-0">—</span>
              )}

              {/* Remove */}
              <button
                onClick={() => removeSongFromSet(set.id, song.id)}
                className="p-1.5 rounded hover:bg-zinc-700 opacity-0 group-hover:opacity-100 transition-all shrink-0"
              >
                <Trash2 className="h-3.5 w-3.5 text-zinc-500 hover:text-red-400" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* App link share dialog */}
      <Dialog open={showShareAppDialog} onOpenChange={setShowShareAppDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('share.setLink')}</DialogTitle>
            <DialogDescription>{t('share.setLinkHint')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {set.shareToken ? (() => {
              const url = `${window.location.origin}/share/set/${set.shareToken}`
              return (
                <>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-zinc-900 border border-zinc-700">
                    <span className="text-xs text-zinc-400 flex-1 truncate font-mono">{url}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button className="flex-1" onClick={() => {
                      navigator.clipboard.writeText(url).then(() => {
                        setAppLinkCopied(true)
                        setTimeout(() => setAppLinkCopied(false), 2000)
                      })
                    }}>
                      <Link className="h-4 w-4" />
                      {appLinkCopied ? t('share.linkCopied') : t('share.setLink')}
                    </Button>
                    <Button variant="outline" onClick={() => toggleSetShare(set.id)}>
                      <Unlink className="h-4 w-4" />
                      {t('share.disableShare')}
                    </Button>
                  </div>
                </>
              )
            })() : (
              <Button className="w-full" onClick={() => toggleSetShare(set.id)}>
                <Link className="h-4 w-4" />
                {t('share.enableShare')}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Rename dialog */}
      <Dialog open={showRename} onOpenChange={setShowRename}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('sets.rename')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>{t('sets.name')}</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('sets.description')}</Label>
              <Input
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                placeholder={t('sets.descriptionPlaceholder')}
              />
            </div>
            <div className="flex gap-3 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setShowRename(false)}>
                {t('form.cancel')}
              </Button>
              <Button className="flex-1" onClick={handleRename}>{t('form.save')}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add song dialog */}
      <Dialog open={showAddSong} onOpenChange={(open) => { setShowAddSong(open); if (!open) setSearch('') }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('sets.addSong')}</DialogTitle>
          </DialogHeader>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('songs.search')}
              className="pl-9"
              autoFocus
            />
          </div>
          <div className="space-y-1 max-h-72 overflow-y-auto mt-1">
            {availableSongs.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-6">{t('sets.noAvailableSongs')}</p>
            ) : (
              availableSongs.map((song) => (
                <button
                  key={song.id}
                  onClick={() => { addSongToSet(set.id, song.id); setSearch('') }}
                  className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-zinc-800 transition-colors"
                >
                  {song.coverUrl && (
                    <img src={song.coverUrl} alt="" className="w-8 h-8 rounded object-cover shrink-0"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-zinc-100 truncate">{song.title}</p>
                    <p className="text-sm text-zinc-400 truncate">{song.artist}</p>
                  </div>
                  {song.durationSec && (
                    <span className="text-xs text-zinc-500 shrink-0">{formatDurationSec(song.durationSec)}</span>
                  )}
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
