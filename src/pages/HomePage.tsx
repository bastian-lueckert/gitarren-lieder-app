import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, Download, Search, Guitar } from 'lucide-react'
import { useSongStore } from '@/store/songStore'
import { SongCard } from '@/components/SongCard'
import { SongForm } from '@/components/SongForm'
import { ImportDialog } from '@/components/ImportDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import type { SongFormData } from '@/types/song'

type SortKey = 'title' | 'artist' | 'createdAt' | 'lastPracticed'

export function HomePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { songs, addSong } = useSongStore()

  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortKey>('createdAt')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importPrefill, setImportPrefill] = useState<{ title?: string; artist?: string; mbid?: string } | null>(null)

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

  function handleImport(data: { title: string; artist: string; mbid?: string }) {
    setImportPrefill(data)
    setShowAddDialog(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-zinc-100">{t('songs.title')}</h1>
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
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
          {filtered.map((song) => (
            <SongCard key={song.id} song={song} onClick={() => navigate(`/songs/${song.id}`)} />
          ))}
        </div>
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
    </div>
  )
}
