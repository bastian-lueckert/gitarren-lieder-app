import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { db } from '@/db/database'
import type { Song, SongFormData } from '@/types/song'
import { pushSong, deleteSongCloud, deleteSongsCloud } from '@/lib/sync'
import { useAuthStore } from '@/store/authStore'
import { recordPracticeToday, getStreak } from '@/lib/streak'

function getUserId() {
  return useAuthStore.getState().user?.id
}

function autoSync() {
  useAuthStore.getState().triggerAutoSync()
}

interface SongStore {
  songs: Song[]
  loading: boolean
  streak: number
  loadSongs: () => Promise<void>
  addSong: (data: SongFormData) => Promise<Song>
  updateSong: (id: string, data: Partial<SongFormData>) => Promise<void>
  deleteSong: (id: string) => Promise<void>
  deleteSongs: (ids: string[]) => Promise<void>
  markPracticed: (id: string) => Promise<void>
  toggleSongShare: (id: string) => Promise<string | null>
  getSong: (id: string) => Song | undefined
}

export const useSongStore = create<SongStore>((set, get) => ({
  songs: [],
  loading: false,
  streak: getStreak(),

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
    autoSync()
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
    autoSync()
  },

  deleteSong: async (id) => {
    await db.songs.delete(id)
    set((state) => ({ songs: state.songs.filter((s) => s.id !== id) }))
    const userId = getUserId()
    if (userId) deleteSongCloud(id, userId).catch(() => {})
    autoSync()
  },

  deleteSongs: async (ids) => {
    await db.songs.bulkDelete(ids)
    set((state) => ({ songs: state.songs.filter((s) => !ids.includes(s.id)) }))
    const userId = getUserId()
    if (userId) deleteSongsCloud(ids, userId).catch(() => {})
    autoSync()
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
    recordPracticeToday()
    set({ streak: getStreak() })
    autoSync()
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
    autoSync()
    return shareToken
  },

  getSong: (id) => get().songs.find((s) => s.id === id),
}))
