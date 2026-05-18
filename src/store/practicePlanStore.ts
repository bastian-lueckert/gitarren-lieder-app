import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { db } from '@/db/database'
import { pushPlan, deletePlanCloud } from '@/lib/sync'
import { useAuthStore } from '@/store/authStore'
import type { PracticePlan } from '@/types/practicePlan'
import type { Song } from '@/types/song'

function autoSync() {
  useAuthStore.getState().triggerAutoSync()
}

const DEFAULT_PLAN_SIZE = 10

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Pick songs prioritising those least recently included in any plan
function pickSongs(songs: Song[], plans: PracticePlan[], size: number): string[] {
  if (songs.length === 0) return []

  const lastPlanned = new Map<string, number>()
  for (const plan of plans) {
    const t = new Date(plan.date).getTime()
    for (const id of plan.songIds) {
      if ((lastPlanned.get(id) ?? 0) < t) lastPlanned.set(id, t)
    }
  }

  const sorted = [...songs].sort((a, b) => {
    const ta = lastPlanned.get(a.id) ?? 0
    const tb = lastPlanned.get(b.id) ?? 0
    return ta - tb
  })

  const pool = sorted.slice(0, Math.min(size, songs.length))
  return shuffle(pool.map((s) => s.id))
}

interface PracticePlanStore {
  plans: PracticePlan[]
  planSize: number
  setPlanSize: (n: number) => void
  loadPlans: () => Promise<void>
  todaysPlan: () => PracticePlan | undefined
  generatePlan: (songs: Song[]) => Promise<PracticePlan>
  toggleCompleted: (planId: string, songId: string) => Promise<void>
  deletePlan: (id: string) => Promise<void>
}

export const usePracticePlanStore = create<PracticePlanStore>((set, get) => ({
  plans: [],
  planSize: parseInt(localStorage.getItem('planSize') ?? String(DEFAULT_PLAN_SIZE), 10) || DEFAULT_PLAN_SIZE,

  setPlanSize: (n) => {
    const clamped = Math.max(1, Math.min(50, n))
    localStorage.setItem('planSize', String(clamped))
    set({ planSize: clamped })
  },

  loadPlans: async () => {
    const plans = await db.plans.orderBy('date').reverse().toArray()
    set({ plans })
  },

  todaysPlan: () => {
    const today = todayStr()
    return get().plans.find((p) => p.date === today)
  },

  generatePlan: async (songs) => {
    const today = todayStr()
    const existing = get().plans.find((p) => p.date === today)
    if (existing) return existing

    const songIds = pickSongs(songs, get().plans, get().planSize)
    const now = new Date()
    const plan: PracticePlan = {
      id: uuidv4(),
      date: today,
      songIds,
      completedIds: [],
      createdAt: now,
      updatedAt: now,
    }
    await db.plans.add(plan)
    set((state) => ({ plans: [plan, ...state.plans] }))
    const userId = useAuthStore.getState().user?.id
    if (userId) pushPlan(plan, userId).catch(() => {})
    autoSync()
    return plan
  },

  toggleCompleted: async (planId, songId) => {
    const plan = get().plans.find((p) => p.id === planId)
    if (!plan) return
    const already = plan.completedIds.includes(songId)
    const completedIds = already
      ? plan.completedIds.filter((id) => id !== songId)
      : [...plan.completedIds, songId]
    const updatedAt = new Date()
    await db.plans.update(planId, { completedIds, updatedAt })
    const updated = { ...plan, completedIds, updatedAt }
    set((state) => ({
      plans: state.plans.map((p) => p.id === planId ? updated : p),
    }))
    const userId = useAuthStore.getState().user?.id
    if (userId) pushPlan(updated, userId).catch(() => {})
    autoSync()
  },

  deletePlan: async (id) => {
    await db.plans.delete(id)
    set((state) => ({ plans: state.plans.filter((p) => p.id !== id) }))
    const userId = useAuthStore.getState().user?.id
    if (userId) deletePlanCloud(id, userId).catch(() => {})
    autoSync()
  },
}))
