import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { syncAll } from '@/lib/sync'

interface AuthStore {
  user: User | null
  authLoading: boolean
  syncing: boolean
  lastSync: Date | null
  syncError: string | null
  initAuth: () => void
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  sync: (reload: () => Promise<void>) => Promise<void>
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  authLoading: true,
  syncing: false,
  lastSync: null,
  syncError: null,

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
    set({ syncing: true, syncError: null })
    try {
      await syncAll(user.id)
      await reload()
      set({ syncing: false, lastSync: new Date() })
    } catch (e) {
      set({ syncing: false, syncError: (e as Error).message })
    }
  },
}))
