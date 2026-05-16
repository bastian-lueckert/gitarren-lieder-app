import Dexie, { type Table } from 'dexie'
import type { Song } from '@/types/song'

class GuitarSongsDB extends Dexie {
  songs!: Table<Song>

  constructor() {
    super('GuitarSongsDB')
    this.version(1).stores({
      songs: 'id, title, artist, createdAt, updatedAt, lastPracticed, supabaseId',
    })
  }
}

export const db = new GuitarSongsDB()
