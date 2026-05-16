import Dexie, { type Table } from 'dexie'
import type { Song } from '@/types/song'
import type { SongSet } from '@/types/set'
import type { PracticePlan } from '@/types/practicePlan'

class GuitarSongsDB extends Dexie {
  songs!: Table<Song>
  sets!: Table<SongSet>
  plans!: Table<PracticePlan>

  constructor() {
    super('GuitarSongsDB')
    this.version(1).stores({
      songs: 'id, title, artist, createdAt, updatedAt, lastPracticed, supabaseId',
    })
    this.version(2).stores({
      songs: 'id, title, artist, createdAt, updatedAt, lastPracticed, supabaseId',
      sets: 'id, name, createdAt, updatedAt',
    })
    this.version(3).stores({
      songs: 'id, title, artist, createdAt, updatedAt, lastPracticed, supabaseId',
      sets: 'id, name, createdAt, updatedAt',
      plans: 'id, date, createdAt',
    })
  }
}

export const db = new GuitarSongsDB()
