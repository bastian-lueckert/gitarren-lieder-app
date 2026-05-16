import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { db } from '@/db/database'
import type { Song, SongFormData } from '@/types/song'
import { pushSong, deleteSongCloud } from '@/lib/sync'
import { useAuthStore } from '@/store/authStore'

function getUserId() {
  return useAuthStore.getState().user?.id
}

interface SongStore {
  songs: Song[]
  loading: boolean
  loadSongs: () => Promise<void>
  addSong: (data: SongFormData) => Promise<Song>
  updateSong: (id: string, data: Partial<SongFormData>) => Promise<void>
  deleteSong: (id: string) => Promise<void>
  markPracticed: (id: string) => Promise<void>
  toggleSongShare: (id: string) => Promise<string | null>
  getSong: (id: string) => Song | undefined
}

export const useSongStore = create<SongStore>((set, get) => ({
  songs: [],
  loading: false,

  loadSongs: async () => {
    set({ loading: true })
    const songs = await db.songs.orderBy('updatedAt').reverse().toArray()
    set({ songs, loading: false })
  },

  addSong: async (data) => {
    const now = new Date()
    const song: Song = { ...data, id: uuidv4(), createdAt: now, updatedAt: now, practiceCount: 0 }
    await db.songs.add(song)
    set((state) => ({ songs: [song, ...state.songs] }))
    const userId = getUserId()
    if (userId) pushSong(song, userId).catch(() => {})
    return song
  },

  updateSong: async (id, data) => {
    const updatedAt = new Date()
    await db.songs.update(id, { ...data, updatedAt })
    set((state) => ({
      songs: state.songs.map((s) => s.id === id ? { ...s, ...data, updatedAt } : s),
    }))
    const updated = get().songs.find((s) => s.id === id)
    const userId = getUserId()
    if (updated && userId) pushSong(updated, userId).catch(() => {})
  },

  deleteSong: async (id) => {
    await db.songs.delete(id)
    set((state) => ({ songs: state.songs.filter((s) => s.id !== id) }))
    const userId = getUserId()
    if (userId) deleteSongCloud(id, userId).catch(() => {})
  },

  markPracticed: async (id) => {
    const song = get().songs.find((s) => s.id === id)
    if (!song) return
    const updates = { lastPracticed: new Date(), practiceCount: (song.practiceCount ?? 0) + 1, updatedAt: new Date() }
    await db.songs.update(id, updates)
    set((state) => ({ songs: state.songs.map((s) => s.id === id ? { ...s, ...updates } : s) }))
    const updated = get().songs.find((s) => s.id === id)
    const userId = getUserId()
    if (updated && userId) pushSong(updated, userId).catch(() => {})
  },

  toggleSongShare: async (id) => {
    const song = get().songs.find((s) => s.id === id)
    if (!song) return null
    const shareToken = song.shareToken ? null : uuidv4()
    const updatedAt = new Date()
    await db.songs.update(id, { shareToken: shareToken ?? undefined, updatedAt })
    set((state) => ({
      songs: state.songs.map((s) => s.id === id ? { ...s, shareToken: shareToken ?? undefined, updatedAt } : s),
    }))
    const updated = get().songs.find((s) => s.id === id)
    const userId = getUserId()
    if (updated && userId) pushSong(updated, userId).catch(() => {})
    return shareToken
  },

  getSong: (id) => get().songs.find((s) => s.id === id),
}))
