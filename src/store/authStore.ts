import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { syncAll } from '@/lib/sync'

let autoSyncTimer: ReturnType<typeof setTimeout> | null = null

interface AuthStore {
  user: User | null
  authLoading: boolean
  syncing: boolean
  lastSync: Date | null
  syncError: string | null
  autoSync: boolean
  autoSyncPending: boolean
  _reload: (() => Promise<void>) | null
  initAuth: () => void
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  sync: (reload: () => Promise<void>) => Promise<void>
  setAutoSync: (val: boolean) => void
  setReload: (fn: () => Promise<void>) => void
  triggerAutoSync: () => void
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  authLoading: true,
  syncing: false,
  lastSync: null,
  syncError: null,
  autoSync: localStorage.getItem('autoSync') !== 'false',
  autoSyncPending: false,
  _reload: null,

  initAuth: () => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ user: session?.user ?? null, authLoading: false })
    })
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: session?.user ?? null })
    })
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  },

  signUp: async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, lastSync: null, syncError: null })
  },

  sync: async (reload) => {
    const { user } = get()
    if (!user) return
    if (autoSyncTimer) { clearTimeout(autoSyncTimer); autoSyncTimer = null }
    set({ syncing: true, syncError: null, autoSyncPending: false })
    try {
      await syncAll(user.id)
      await reload()
      set({ syncing: false, lastSync: new Date() })
    } catch (e) {
      set({ syncing: false, syncError: (e as Error).message })
    }
  },

  setAutoSync: (val) => {
    localStorage.setItem('autoSync', String(val))
    set({ autoSync: val })
    if (!val && autoSyncTimer) {
      clearTimeout(autoSyncTimer)
      autoSyncTimer = null
      set({ autoSyncPending: false })
    }
  },

  setReload: (fn) => set({ _reload: fn }),

  triggerAutoSync: () => {
    const { autoSync, user, syncing, _reload } = get()
    if (!autoSync || !user || syncing || !_reload) return
    if (autoSyncTimer) clearTimeout(autoSyncTimer)
    set({ autoSyncPending: true })
    autoSyncTimer = setTimeout(() => {
      autoSyncTimer = null
      set({ autoSyncPending: false })
      get().sync(get()._reload!)
    }, 3000)
  },
}))
