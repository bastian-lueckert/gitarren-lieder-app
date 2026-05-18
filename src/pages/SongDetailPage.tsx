import { useState, useMemo } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Edit, Trash2, Play, Music, Gauge, Hash, BookOpen, ExternalLink, ChevronLeft, ChevronRight, FileDown, Share2, Link, Unlink, Download, Loader2 } from 'lucide-react'
import { YouTubeIcon } from '@/components/YouTubeIcon'
import { useSongStore } from '@/store/songStore'
import { useSetStore } from '@/store/setStore'
import { SongForm } from '@/components/SongForm'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { formatDate } from '@/lib/utils'
import { extractChordsFromText, lookupChord } from '@/lib/chords'
import { ChordDiagram } from '@/components/ChordDiagram'
import { exportSongPdf } from '@/lib/exportPdf'
import { fetchUGChords } from '@/lib/ugChords'
import { ChordSheet } from '@/components/ChordSheet'
import type { SongFormData } from '@/types/song'

export function SongDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { t, i18n } = useTranslation()
  const { getSong, updateSong, deleteSong, toggleSongShare } = useSongStore()
  const { sets } = useSetStore()
  const song = getSong(id!)

  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [shareLinkCopied, setShareLinkCopied] = useState(false)
  const [coverFailed, setCoverFailed] = useState(false)
  const [loadingChords, setLoadingChords] = useState(false)
  const [chordsLoadError, setChordsLoadError] = useState(false)

  // Set navigation context (passed via location.state from SetDetailPage)
  const setId = (location.state as { setId?: string; songIndex?: number } | null)?.setId
  const currentSet = setId ? sets.find((s) => s.id === setId) : undefined
  const posInSet = currentSet ? currentSet.songIds.indexOf(id!) : -1
  const prevSongId = posInSet > 0 ? currentSet!.songIds[posInSet - 1] : undefined
  const nextSongId = currentSet && posInSet < currentSet.songIds.length - 1 ? currentSet.songIds[posInSet + 1] : undefined

  function goToSong(targetId: string, targetIdx: number) {
    navigate(`/songs/${targetId}`, { state: { setId, songIndex: targetIdx } })
  }

  if (!song) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-zinc-500">
        <Music className="h-16 w-16 opacity-30" />
        <p>Song not found</p>
        <Button onClick={() => navigate('/')} variant="outline">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </div>
    )
  }

  async function handleUpdate(data: SongFormData) {
    await updateSong(id!, data)
    setShowEditDialog(false)
  }

  async function handleDelete() {
    await deleteSong(id!)
    navigate('/')
  }

  async function handleLoadChords() {
    setLoadingChords(true)
    setChordsLoadError(false)
    try {
      const chords = await fetchUGChords(song!.artist, song!.title)
      if (chords) {
        await updateSong(id!, { chords })
      } else {
        setChordsLoadError(true)
        setTimeout(() => setChordsLoadError(false), 4000)
      }
    } finally {
      setLoadingChords(false)
    }
  }

  const chordNames = useMemo(() => extractChordsFromText(song.chords ?? ''), [song.chords])
  const chordPositions = useMemo(
    () => chordNames.map((name) => ({ name, position: lookupChord(name) })),
    [chordNames],
  )

  const shareUrl = song.shareToken ? `${window.location.origin}/share/song/${song.shareToken}` : null

  function copyShareLink() {
    if (!shareUrl) return
    navigator.clipboard.writeText(shareUrl).then(() => {
      setShareLinkCopied(true)
      setTimeout(() => setShareLinkCopied(false), 2000)
    })
  }

  const ugUrl = `https://www.ultimate-guitar.com/search.php?search_type=title&value=${encodeURIComponent(`${song.artist} ${song.title}`)}`
  const ytUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${song.artist} ${song.title}`)}`

  return (
    <div className="space-y-6">
      {/* Top nav */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => currentSet ? navigate(`/sets/${setId}`) : navigate('/')}
            className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            {currentSet ? currentSet.name : t('nav.songs')}
          </button>
          {currentSet && (
            <span className="text-xs text-zinc-600">
              {posInSet + 1} / {currentSet.songIds.length}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowEditDialog(true)}>
            <Edit className="h-4 w-4" />
            {t('form.edit')}
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => navigate(`/songs/${id}/practice`, { state: location.state })}
          >
            <Play className="h-4 w-4" />
            {t('practice.title')}
          </Button>
          <a
            href={ytUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={t('songOfDay.youtube')}
            className="inline-flex items-center justify-center h-8 w-8 rounded-md text-zinc-600 hover:text-[#FF0000] hover:bg-zinc-800 transition-colors"
          >
            <YouTubeIcon className="h-4 w-4" />
          </a>
          <Button variant="ghost" size="icon-sm" onClick={() => exportSongPdf(song)} title={t('share.exportPdf')}>
            <FileDown className="h-4 w-4 text-zinc-400" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setShowShareDialog(true)}
            title={t('share.songLink')}
          >
            <Share2 className={`h-4 w-4 ${song.shareToken ? 'text-amber-400' : 'text-zinc-400'}`} />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="h-4 w-4 text-red-400" />
          </Button>
        </div>
      </div>

      {/* Title area with cover */}
      <div className="flex items-start gap-4">
        {song.coverUrl && !coverFailed && (
          <img
            src={song.coverUrl}
            alt=""
            className="w-20 h-20 rounded-xl object-cover shrink-0 shadow-lg"
            onError={() => setCoverFailed(true)}
          />
        )}
        <div className="min-w-0">
          <h1 className="text-3xl font-bold text-zinc-100">{song.title}</h1>
          <p className="text-xl text-zinc-400 mt-1">{song.artist}</p>

          <div className="flex flex-wrap gap-3 mt-4">
            {song.bpm && (
              <span className="flex items-center gap-1.5 text-sm text-zinc-400 bg-zinc-800 rounded-full px-3 py-1">
                <Gauge className="h-3.5 w-3.5 text-amber-500" />
                {song.bpm} BPM
              </span>
            )}
            {song.timeSignature && (
              <span className="text-sm text-zinc-400 bg-zinc-800 rounded-full px-3 py-1">
                {song.timeSignature}
              </span>
            )}
            {song.musicalKey && (
              <span className="flex items-center gap-1.5 text-sm text-zinc-400 bg-zinc-800 rounded-full px-3 py-1">
                <Hash className="h-3.5 w-3.5" />
                {song.musicalKey}
              </span>
            )}
            {song.capo != null && song.capo > 0 && (
              <span className="text-sm text-zinc-400 bg-zinc-800 rounded-full px-3 py-1">
                {t('song.capoFret', { n: song.capo })}
              </span>
            )}
            {song.drumPattern && song.drumPattern !== 'none' && (
              <span className="text-sm text-zinc-400 bg-zinc-800 rounded-full px-3 py-1">
                {t(`drumPatterns.${song.drumPattern}`)}
              </span>
            )}
            {song.tags?.map((tag) => (
              <span key={tag} className="text-xs text-zinc-500 bg-zinc-800 rounded-full px-2.5 py-1">
                {tag}
              </span>
            ))}
          </div>

          {(song.practiceCount != null && song.practiceCount > 0) && (
            <div className="flex items-center gap-4 mt-4 text-sm text-zinc-500">
              <span className="flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" />
                {song.practiceCount} × {t('song.practiceCount')}
              </span>
              {song.lastPracticed && (
                <span>
                  {t('song.lastPracticed')}: {formatDate(song.lastPracticed, i18n.language)}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Ultimate Guitar link */}
      <a
        href={ugUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-amber-500/50 hover:text-amber-400 hover:bg-amber-500/5 transition-all text-sm font-medium"
      >
        <ExternalLink className="h-4 w-4" />
        {t('song.findTabs')}
      </a>

      <Tabs defaultValue="chords">
        <TabsList>
          <TabsTrigger value="chords">{t('practice.chordsTab')}</TabsTrigger>
          <TabsTrigger value="lyrics">{t('practice.lyricsTab')}</TabsTrigger>
          {song.notes && <TabsTrigger value="notes">{t('practice.notesTab')}</TabsTrigger>}
        </TabsList>

        <TabsContent value="chords" className="space-y-4">
          {chordPositions.length > 0 && (
            <div className="flex flex-wrap gap-4 px-1">
              {chordPositions.map(({ name, position }) => (
                <ChordDiagram key={name} name={name} position={position} />
              ))}
            </div>
          )}
          {chordsLoadError && (
            <p className="text-sm text-red-400 text-center py-1">{t('song.chordsNotFound')}</p>
          )}
          {song.chords ? (
            <>
              <ChordSheet
                content={song.chords}
                fontSize={0.875}
                className="bg-zinc-900 rounded-xl border border-zinc-800 p-4"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadChords}
                disabled={loadingChords}
                className="w-full"
              >
                {loadingChords
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <Download className="h-3.5 w-3.5" />}
                {t('song.reloadChords')}
              </Button>
            </>
          ) : (
            <div className="space-y-2">
              <Button
                onClick={handleLoadChords}
                disabled={loadingChords}
                className="w-full"
              >
                {loadingChords
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Download className="h-4 w-4" />}
                {t('song.loadChords')}
              </Button>
              <EmptyContent onEdit={() => setShowEditDialog(true)} label={t('song.chords')} />
            </div>
          )}
        </TabsContent>

        <TabsContent value="lyrics">
          {song.lyrics ? (
            <pre className="whitespace-pre-wrap text-sm text-zinc-300 bg-zinc-900 rounded-xl p-4 border border-zinc-800 leading-relaxed">
              {song.lyrics}
            </pre>
          ) : (
            <EmptyContent onEdit={() => setShowEditDialog(true)} label={t('song.lyrics')} />
          )}
        </TabsContent>

        {song.notes && (
          <TabsContent value="notes">
            <pre className="whitespace-pre-wrap text-sm text-zinc-300 bg-zinc-900 rounded-xl p-4 border border-zinc-800 leading-relaxed">
              {song.notes}
            </pre>
          </TabsContent>
        )}
      </Tabs>

      {/* Set prev/next navigation */}
      {currentSet && (prevSongId || nextSongId) && (
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            className="flex-1"
            disabled={!prevSongId}
            onClick={() => prevSongId && goToSong(prevSongId, posInSet - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
            {t('sets.prevSong')}
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            disabled={!nextSongId}
            onClick={() => nextSongId && goToSong(nextSongId, posInSet + 1)}
          >
            {t('sets.nextSong')}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Share dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('share.songLink')}</DialogTitle>
            <DialogDescription>{t('share.linkHint')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {shareUrl ? (
              <>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-zinc-900 border border-zinc-700">
                  <span className="text-xs text-zinc-400 flex-1 truncate font-mono">{shareUrl}</span>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={copyShareLink}>
                    <Link className="h-4 w-4" />
                    {shareLinkCopied ? t('share.linkCopied') : t('share.songLink')}
                  </Button>
                  <Button variant="outline" onClick={() => toggleSongShare(id!)}>
                    <Unlink className="h-4 w-4" />
                    {t('share.disableShare')}
                  </Button>
                </div>
              </>
            ) : (
              <Button className="w-full" onClick={() => toggleSongShare(id!)}>
                <Link className="h-4 w-4" />
                {t('share.enableShare')}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('form.edit')}: {song.title}</DialogTitle>
          </DialogHeader>
          <SongForm initial={song} onSave={handleUpdate} onCancel={() => setShowEditDialog(false)} />
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('form.confirmDelete')}</DialogTitle>
            <DialogDescription>{t('form.confirmDeleteDesc')}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              {t('form.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              {t('form.delete')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function EmptyContent({ onEdit, label }: { onEdit: () => void; label: string }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-3 text-zinc-600 bg-zinc-900 rounded-xl border border-zinc-800">
      <p className="text-sm">Noch kein {label} vorhanden.</p>
      <Button variant="outline" size="sm" onClick={onEdit}>
        <Edit className="h-3.5 w-3.5" />
        {t('form.edit')}
      </Button>
    </div>
  )
}
