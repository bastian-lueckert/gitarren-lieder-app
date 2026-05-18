export type TimeSignature = '4/4' | '3/4' | '6/8' | '2/4'
export type DrumPattern = 'rock' | 'pop' | 'folk' | 'waltz' | 'bossanova' | 'blues' | 'country' | 'none'

export interface Song {
  id: string
  title: string
  artist: string
  lyrics?: string
  chords?: string
  bpm?: number
  durationSec?: number
  timeSignature?: TimeSignature
  drumPattern?: DrumPattern
  musicalKey?: string
  capo?: number
  notes?: string
  tags?: string[]
  lastPracticed?: Date
  practiceCount?: number
  createdAt: Date
  updatedAt: Date
  supabaseId?: string
  mbid?: string
  coverUrl?: string
  shareToken?: string
  difficulty?: number  // 1–5
}

export interface SongFormData {
  title: string
  artist: string
  lyrics?: string
  chords?: string
  bpm?: number
  durationSec?: number
  timeSignature?: TimeSignature
  drumPattern?: DrumPattern
  musicalKey?: string
  capo?: number
  notes?: string
  tags?: string[]
  coverUrl?: string
  difficulty?: number  // 1–5
}
