import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { db } from '@/db/database'
import type { SongSet } from '@/types/set'
import { pushSet, deleteSetCloud } from '@/lib/sync'
import { useAuthStore } from '@/store/authStore'

function getUserId() {
  return useAuthStore.getState().user?.id
}

function autoSync() {
  useAuthStore.getState().triggerAutoSync()
}

interface SetStore {
  sets: SongSet[]
  loadSets: () => Promise<void>
  addSet: (name: string, description?: string) => Promise<SongSet>
  updateSet: (id: string, data: Partial<Pick<SongSet, 'name' | 'description' | 'songIds'>>) => Promise<void>
  deleteSet: (id: string) => Promise<void>
  addSongToSet: (setId: string, songId: string) => Promise<void>
  removeSongFromSet: (setId: string, songId: string) => Promise<void>
  moveSong: (setId: string, songId: string, dir: 'up' | 'down') => Promise<void>
  toggleSetShare: (id: string) => Promise<string | null>
  getSet: (id: string) => SongSet | undefined
}

export const useSetStore = create<SetStore>((set, get) => ({
  sets: [],

  loadSets: async () => {
    const sets = await db.sets.orderBy('createdAt').toArray()
    set({ sets })
  },

  addSet: async (name, description) => {
    const now = new Date()
    const s: SongSet = { id: uuidv4(), name, description, songIds: [], createdAt: now, updatedAt: now }
    await db.sets.add(s)
    set((state) => ({ sets: [...state.sets, s] }))
    const userId = getUserId()
    if (userId) pushSet(s, userId).catch(() => {})
    autoSync()
    return s
  },

  updateSet: async (id, data) => {
    const updatedAt = new Date()
    await db.sets.update(id, { ...data, updatedAt })
    set((state) => ({ sets: state.sets.map((s) => s.id === id ? { ...s, ...data, updatedAt } : s) }))
    const updated = get().sets.find((s) => s.id === id)
    const userId = getUserId()
    if (updated && userId) pushSet(updated, userId).catch(() => {})
    autoSync()
  },

  deleteSet: async (id) => {
    await db.sets.delete(id)
    set((state) => ({ sets: state.sets.filter((s) => s.id !== id) }))
    const userId = getUserId()
    if (userId) deleteSetCloud(id, userId).catch(() => {})
    autoSync()
  },

  addSongToSet: async (setId, songId) => {
    const s = get().sets.find((s) => s.id === setId)
    if (!s || s.songIds.includes(songId)) return
    const songIds = [...s.songIds, songId]
    await db.sets.update(setId, { songIds, updatedAt: new Date() })
    set((state) => ({ sets: state.sets.map((s) => s.id === setId ? { ...s, songIds } : s) }))
    const updated = get().sets.find((s) => s.id === setId)
    const userId = getUserId()
    if (updated && userId) pushSet(updated, userId).catch(() => {})
    autoSync()
  },

  removeSongFromSet: async (setId, songId) => {
    const s = get().sets.find((s) => s.id === setId)
    if (!s) return
    const songIds = s.songIds.filter((id) => id !== songId)
    await db.sets.update(setId, { songIds, updatedAt: new Date() })
    set((state) => ({ sets: state.sets.map((s) => s.id === setId ? { ...s, songIds } : s) }))
    const updated = get().sets.find((s) => s.id === setId)
    const userId = getUserId()
    if (updated && userId) pushSet(updated, userId).catch(() => {})
    autoSync()
  },

  moveSong: async (setId, songId, dir) => {
    const s = get().sets.find((s) => s.id === setId)
    if (!s) return
    const idx = s.songIds.indexOf(songId)
    if (idx === -1) return
    const newIdx = dir === 'up' ? idx - 1 : idx + 1
    if (newIdx < 0 || newIdx >= s.songIds.length) return
    const songIds = [...s.songIds]
    ;[songIds[idx], songIds[newIdx]] = [songIds[newIdx], songIds[idx]]
    await db.sets.update(setId, { songIds, updatedAt: new Date() })
    set((state) => ({ sets: state.sets.map((s) => s.id === setId ? { ...s, songIds } : s) }))
    const updated = get().sets.find((s) => s.id === setId)
    const userId = getUserId()
    if (updated && userId) pushSet(updated, userId).catch(() => {})
    autoSync()
  },

  toggleSetShare: async (id) => {
    const s = get().sets.find((s) => s.id === id)
    if (!s) return null
    const shareToken = s.shareToken ? null : uuidv4()
    const updatedAt = new Date()
    await db.sets.update(id, { shareToken: shareToken ?? undefined, updatedAt })
    set((state) => ({
      sets: state.sets.map((s) => s.id === id ? { ...s, shareToken: shareToken ?? undefined, updatedAt } : s),
    }))
    const updated = get().sets.find((s) => s.id === id)
    const userId = getUserId()
    if (updated && userId) pushSet(updated, userId).catch(() => {})
    autoSync()
    return shareToken
  },

  getSet: (id) => get().sets.find((s) => s.id === id),
}))
