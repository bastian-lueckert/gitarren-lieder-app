import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Edit, Trash2, Play, Music, Gauge, Hash, BookOpen } from 'lucide-react'
import { useSongStore } from '@/store/songStore'
import { SongForm } from '@/components/SongForm'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { formatDate } from '@/lib/utils'
import type { SongFormData } from '@/types/song'

export function SongDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const { getSong, updateSong, deleteSong } = useSongStore()
  const song = getSong(id!)

  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

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

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('nav.songs')}
        </button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowEditDialog(true)}>
            <Edit className="h-4 w-4" />
            {t('form.edit')}
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => navigate(`/songs/${id}/practice`)}
          >
            <Play className="h-4 w-4" />
            {t('practice.title')}
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="h-4 w-4 text-red-400" />
          </Button>
        </div>
      </div>

      <div>
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

      <Tabs defaultValue="chords">
        <TabsList>
          <TabsTrigger value="chords">{t('practice.chordsTab')}</TabsTrigger>
          <TabsTrigger value="lyrics">{t('practice.lyricsTab')}</TabsTrigger>
          {song.notes && <TabsTrigger value="notes">{t('practice.notesTab')}</TabsTrigger>}
        </TabsList>

        <TabsContent value="chords">
          {song.chords ? (
            <pre className="whitespace-pre-wrap font-mono text-sm text-zinc-300 bg-zinc-900 rounded-xl p-4 border border-zinc-800 leading-relaxed overflow-x-auto">
              {song.chords}
            </pre>
          ) : (
            <EmptyContent onEdit={() => setShowEditDialog(true)} label={t('song.chords')} />
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
