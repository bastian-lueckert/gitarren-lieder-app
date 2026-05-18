import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Star } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Song, SongFormData, DrumPattern, TimeSignature } from '@/types/song'
import { parseDurationInput, formatDurationSec } from '@/lib/utils'
import { cn } from '@/lib/utils'

const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
  'Am', 'Bm', 'Cm', 'Dm', 'Em', 'Fm', 'Gm']
const TIME_SIGS: TimeSignature[] = ['4/4', '3/4', '6/8', '2/4']
const DRUM_PATTERNS: DrumPattern[] = ['none', 'rock', 'pop', 'folk', 'waltz', 'bossanova', 'blues', 'country']

interface SongFormProps {
  initial?: Partial<Song>
  onSave: (data: SongFormData) => void
  onCancel: () => void
}

export function SongForm({ initial, onSave, onCancel }: SongFormProps) {
  const { t } = useTranslation()
  const [form, setForm] = useState<SongFormData>({
    title: initial?.title ?? '',
    artist: initial?.artist ?? '',
    lyrics: initial?.lyrics ?? '',
    chords: initial?.chords ?? '',
    bpm: initial?.bpm ?? 120,
    durationSec: initial?.durationSec,
    timeSignature: initial?.timeSignature ?? '4/4',
    drumPattern: initial?.drumPattern ?? 'rock',
    musicalKey: initial?.musicalKey ?? '',
    capo: initial?.capo ?? 0,
    notes: initial?.notes ?? '',
    tags: initial?.tags ?? [],
    coverUrl: initial?.coverUrl,
    difficulty: initial?.difficulty,
  })
  const [durationInput, setDurationInput] = useState(
    initial?.durationSec ? formatDurationSec(initial.durationSec) : ''
  )
  const [tagInput, setTagInput] = useState('')

  function set<K extends keyof SongFormData>(key: K, value: SongFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function addTag(tag: string) {
    const trimmed = tag.trim()
    if (!trimmed || form.tags?.includes(trimmed)) return
    set('tags', [...(form.tags ?? []), trimmed])
    setTagInput('')
  }

  function removeTag(tag: string) {
    set('tags', (form.tags ?? []).filter((t) => t !== tag))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.artist.trim()) return
    onSave(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="title">{t('song.title')} *</Label>
          <Input
            id="title"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder={t('form.placeholderTitle')}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="artist">{t('song.artist')} *</Label>
          <Input
            id="artist"
            value={form.artist}
            onChange={(e) => set('artist', e.target.value)}
            placeholder={t('form.placeholderArtist')}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="bpm">{t('song.bpm')}</Label>
          <Input
            id="bpm"
            type="number"
            min={20}
            max={300}
            value={form.bpm}
            onChange={(e) => set('bpm', parseInt(e.target.value) || 120)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>{t('song.timeSignature')}</Label>
          <Select value={form.timeSignature} onValueChange={(v) => set('timeSignature', v as TimeSignature)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TIME_SIGS.map((ts) => (
                <SelectItem key={ts} value={ts}>
                  {t(`timeSignatures.${ts}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>{t('song.drumPattern')}</Label>
          <Select value={form.drumPattern} onValueChange={(v) => set('drumPattern', v as DrumPattern)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {DRUM_PATTERNS.map((p) => (
                <SelectItem key={p} value={p}>{t(`drumPatterns.${p}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="duration">{t('song.duration')}</Label>
        <Input
          id="duration"
          value={durationInput}
          onChange={(e) => {
            setDurationInput(e.target.value)
            set('durationSec', parseDurationInput(e.target.value))
          }}
          placeholder="3:45"
          className="w-32"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>{t('song.key')}</Label>
          <Select
            value={form.musicalKey || '_none_'}
            onValueChange={(v) => set('musicalKey', v === '_none_' ? '' : v)}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_none_">—</SelectItem>
              {KEYS.map((k) => (
                <SelectItem key={k} value={k}>{k}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>{t('song.capo')}</Label>
          <Select value={String(form.capo ?? 0)} onValueChange={(v) => set('capo', parseInt(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="0">{t('song.noCapo')}</SelectItem>
              {Array.from({ length: 11 }, (_, i) => i + 1).map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {t('song.capoFret', { n })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="chords">{t('song.chords')}</Label>
        <Textarea
          id="chords"
          value={form.chords}
          onChange={(e) => set('chords', e.target.value)}
          placeholder={t('form.placeholderChords')}
          className="min-h-[150px] text-xs leading-relaxed"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="lyrics">{t('song.lyrics')}</Label>
        <Textarea
          id="lyrics"
          value={form.lyrics}
          onChange={(e) => set('lyrics', e.target.value)}
          placeholder={t('form.placeholderLyrics')}
          className="min-h-[200px]"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">{t('song.notes')}</Label>
        <Textarea
          id="notes"
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          placeholder={t('form.placeholderNotes')}
          className="min-h-[80px]"
        />
      </div>

      <div className="space-y-1.5">
        <Label>{t('song.tags')}</Label>
        <div className="flex flex-wrap gap-1.5 mb-1.5">
          {form.tags?.map((tag) => (
            <span key={tag} className="flex items-center gap-1 bg-zinc-800 text-zinc-300 rounded-full px-2.5 py-0.5 text-xs">
              {tag}
              <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-400">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <Input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          placeholder={t('form.placeholderTags')}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput) }
          }}
        />
      </div>

      {/* Difficulty */}
      <div className="space-y-1.5">
        <Label>{t('song.difficulty')}</Label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => set('difficulty', form.difficulty === n ? undefined : n)}
              className="p-0.5 transition-transform hover:scale-110"
            >
              <Star
                className={cn(
                  'h-6 w-6 transition-colors',
                  (form.difficulty ?? 0) >= n
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-zinc-700',
                )}
              />
            </button>
          ))}
          {form.difficulty && (
            <button
              type="button"
              onClick={() => set('difficulty', undefined)}
              className="ml-1 text-xs text-zinc-600 hover:text-zinc-400"
            >
              ×
            </button>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>{t('form.cancel')}</Button>
        <Button type="submit">{t('form.save')}</Button>
      </div>
    </form>
  )
}
