import { create } from 'zustand'
import { supabase } from '@/lib/supabase/client'
import { User as SupabaseUser, Session } from '@supabase/supabase-js'

export type UserStatus = 'pending' | 'approved' | 'blocked'

export interface Profile {
  id: string
  full_name: string
  email?: string
  role: 'admin' | 'editor' | 'member'
  status: UserStatus
  masonic_degree?: string
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
    degree: string,
  ) => Promise<{ error: any }>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  loading: true,
  isAuthenticated: false,

  initialize: async () => {
    try {
      // Check for current session
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        const userProfile = profile as Profile

        set({
          session,
          user: {
            ...session.user,
            role: userProfile?.role || 'member',
            profile: userProfile,
          },
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

      // Set up listener
      supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session) {
          // Fetch profile again to ensure fresh data on state change (e.g. login)
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          const userProfile = profile as Profile

          set({
            session,
            user: {
              ...session.user,
              role: userProfile?.role || 'member',
              profile: userProfile,
            },
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
    } catch (error) {
      console.error('Auth initialization error:', error)
      set({ loading: false })
    }
  },

  signIn: async (email) => {
    const { error } = await supabase.auth.signInWithOtp({ email })
    return { error }
  },

  signInWithPassword: async (email, password) => {
    set({ loading: true })
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      set({ loading: false })
      return { error }
    }

    if (data.session) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.session.user.id)
        .single()

      if (profileError || !profile) {
        await supabase.auth.signOut()
        set({ loading: false })
        return {
          error: {
            message: 'Perfil não encontrado.',
            status: 404,
          },
        }
      }

      const userProfile = profile as Profile

      // State update
      set({
        session: data.session,
        user: {
          ...data.session.user,
          role: userProfile?.role || 'member',
          profile: userProfile,
        },
        isAuthenticated: true,
        loading: false,
      })
    } else {
      set({ loading: false })
    }

    return { error: null }
  },

  signUp: async (email, password, name, degree) => {
    set({ loading: true })
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          masonic_degree: degree,
          role: 'member', // Default role, trigger will handle defaults logic
        },
      },
    })
    set({ loading: false })
    return { error }
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    set({ user: null, session: null, isAuthenticated: false })
    return { error }
  },
}))

export default useAuthStore
