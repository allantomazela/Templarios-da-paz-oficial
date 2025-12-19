import { create } from 'zustand'
import { supabase } from '@/lib/supabase/client'
import { User as SupabaseUser, Session } from '@supabase/supabase-js'

interface Profile {
  id: string
  full_name: string
  role: 'admin' | 'editor' | 'member'
  avatar_url?: string
}

interface AuthState {
  user: (SupabaseUser & { role?: string; profile?: Profile }) | null
  session: Session | null
  loading: boolean
  isAuthenticated: boolean

  initialize: () => Promise<void>
  signIn: (email: string) => Promise<{ error: any }>
  signInWithPassword: (
    email: string,
    password: string,
  ) => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>
  signUp: (
    email: string,
    password: string,
    name: string,
  ) => Promise<{ error: any }>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  loading: true,
  isAuthenticated: false,

  initialize: async () => {
    set({ loading: true })

    // Get initial session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (session) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      set({
        session,
        user: { ...session.user, role: profile?.role || 'member', profile },
        isAuthenticated: true,
        loading: false,
      })
    } else {
      set({ session: null, user: null, isAuthenticated: false, loading: false })
    }

    // Listen for changes
    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        set({
          session,
          user: { ...session.user, role: profile?.role || 'member', profile },
          isAuthenticated: true,
          loading: false,
        })
      } else {
        set({
          session: null,
          user: null,
          isAuthenticated: false,
          loading: false,
        })
      }
    })
  },

  signIn: async (email) => {
    // Magic link sign in example if needed, but we usually use password
    const { error } = await supabase.auth.signInWithOtp({ email })
    return { error }
  },

  signInWithPassword: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  },

  signUp: async (email, password, name) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role: 'member', // Default role
        },
      },
    })
    return { error }
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    set({ user: null, session: null, isAuthenticated: false })
    return { error }
  },
}))

export default useAuthStore
