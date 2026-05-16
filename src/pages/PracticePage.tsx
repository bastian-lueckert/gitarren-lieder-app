import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, CheckCircle2, Music } from 'lucide-react'
import { useSongStore } from '@/store/songStore'
import { Metronome } from '@/components/Metronome'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import type { DrumPattern, TimeSignature } from '@/types/song'

export function PracticePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { getSong, updateSong, markPracticed } = useSongStore()
  const song = getSong(id!)

  const [localBpm, setLocalBpm] = useState(song?.bpm ?? 120)
  const [practiced, setPracticed] = useState(false)

  if (!song) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-zinc-500">
        <Music className="h-16 w-16 opacity-30" />
        <Button onClick={() => navigate('/')} variant="outline">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </div>
    )
  }

  async function handleMarkPracticed() {
    await markPracticed(id!)
    if (localBpm !== song!.bpm) {
      await updateSong(id!, { bpm: localBpm })
    }
    setPracticed(true)
    setTimeout(() => navigate(`/songs/${id}`), 1200)
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => navigate(`/songs/${id}`)}
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          {song.title}
        </button>
        <Button
          onClick={handleMarkPracticed}
          variant={practiced ? 'secondary' : 'default'}
          size="sm"
          disabled={practiced}
        >
          <CheckCircle2 className="h-4 w-4" />
          {practiced ? t('practice.practiced') : t('practice.markPracticed')}
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-zinc-100">{song.title}</h1>
        <p className="text-zinc-400">{song.artist}</p>
      </div>

      {/* Metronome */}
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-5">
        <Metronome
          bpm={localBpm}
          drumPattern={(song.drumPattern ?? 'rock') as DrumPattern}
          timeSignature={(song.timeSignature ?? '4/4') as TimeSignature}
          onBpmChange={setLocalBpm}
        />
      </div>

      {/* Content tabs */}
      <Tabs defaultValue="chords">
        <TabsList className="w-full">
          <TabsTrigger value="chords" className="flex-1">{t('practice.chordsTab')}</TabsTrigger>
          <TabsTrigger value="lyrics" className="flex-1">{t('practice.lyricsTab')}</TabsTrigger>
          {song.notes && (
            <TabsTrigger value="notes" className="flex-1">{t('practice.notesTab')}</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="chords">
          {song.chords ? (
            <pre className="whitespace-pre-wrap font-mono text-sm text-zinc-200 bg-zinc-900 rounded-xl p-4 border border-zinc-800 leading-relaxed text-base overflow-x-auto select-text">
              {song.chords}
            </pre>
          ) : (
            <p className="text-center text-zinc-600 py-8">{t('song.chords')} —</p>
          )}
        </TabsContent>

        <TabsContent value="lyrics">
          {song.lyrics ? (
            <pre className="whitespace-pre-wrap text-zinc-200 bg-zinc-900 rounded-xl p-4 border border-zinc-800 leading-relaxed text-base select-text">
              {song.lyrics}
            </pre>
          ) : (
            <p className="text-center text-zinc-600 py-8">{t('song.lyrics')} —</p>
          )}
        </TabsContent>

        {song.notes && (
          <TabsContent value="notes">
            <pre className="whitespace-pre-wrap text-zinc-300 bg-zinc-900 rounded-xl p-4 border border-zinc-800 leading-relaxed text-sm select-text">
              {song.notes}
            </pre>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
