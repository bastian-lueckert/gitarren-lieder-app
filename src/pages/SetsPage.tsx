import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, ListMusic, Clock, ChevronRight, Trash2 } from 'lucide-react'
import { useSetStore } from '@/store/setStore'
import { useSongStore } from '@/store/songStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { formatTotalDuration } from '@/lib/utils'

export function SetsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { sets, addSet, deleteSet } = useSetStore()
  const { songs } = useSongStore()
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  async function handleCreate() {
    if (!name.trim()) return
    const s = await addSet(name.trim(), desc.trim() || undefined)
    setShowCreate(false)
    setName('')
    setDesc('')
    navigate(`/sets/${s.id}`)
  }

  function totalDuration(songIds: string[]) {
    return songIds.reduce((sum, id) => {
      const song = songs.find((s) => s.id === id)
      return sum + (song?.durationSec ?? 0)
    }, 0)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-100">{t('sets.title')}</h1>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" />
          {t('sets.create')}
        </Button>
      </div>

      {sets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-zinc-500">
          <ListMusic className="h-16 w-16 opacity-30" />
          <p className="text-lg">{t('sets.empty')}</p>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" /> {t('sets.create')}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {sets.map((s) => {
            const total = totalDuration(s.songIds)
            const known = s.songIds.filter((id) => songs.find((so) => so.id === id && so.durationSec)).length
            const hasPartial = known < s.songIds.length && known > 0
            return (
              <div
                key={s.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/sets/${s.id}`)}
                onKeyDown={(e) => e.key === 'Enter' && navigate(`/sets/${s.id}`)}
                className="w-full flex items-center gap-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50 transition-all p-4 text-left group cursor-pointer"
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
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(s.id) }}
                    className="p-1.5 rounded hover:bg-zinc-700 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-zinc-500 hover:text-red-400" />
                  </button>
                  <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('sets.create')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>{t('sets.name')}</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('sets.namePlaceholder')}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('sets.description')}</Label>
              <Input
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder={t('sets.descriptionPlaceholder')}
              />
            </div>
            <div className="flex gap-3 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setShowCreate(false)}>
                {t('form.cancel')}
              </Button>
              <Button className="flex-1" onClick={handleCreate}>{t('form.save')}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('sets.confirmDelete')}</DialogTitle>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteTarget(null)}>
              {t('form.cancel')}
            </Button>
            <Button variant="destructive" className="flex-1" onClick={() => {
              if (deleteTarget) deleteSet(deleteTarget)
              setDeleteTarget(null)
            }}>
              {t('form.delete')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
