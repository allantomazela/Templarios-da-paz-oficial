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

const MASTER_ADMIN_EMAIL = 'allantomazela@gmail.com'
const PROFILE_TIMEOUT_MS = 3000

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  loading: true,
  isAuthenticated: false,

  initialize: async () => {
    try {
      // 1. Check for current session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) throw sessionError

      if (session) {
        // 2. Fetch Profile with Timeout Strategy
        let userProfile: Profile | null = null
        let fetchError: any = null

        try {
          // Create a timeout promise
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error('Profile fetch timeout')),
              PROFILE_TIMEOUT_MS,
            ),
          )

          // Actual fetch promise
          const fetchPromise = supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
            .then(({ data, error }) => {
              if (error) throw error
              return data
            })

          // Race between fetch and timeout
          userProfile = (await Promise.race([
            fetchPromise,
            timeoutPromise,
          ])) as Profile
        } catch (error) {
          fetchError = error
          console.warn('Auth initialization warning:', error)
        }

        // 3. Construct User Object with Fail-safes
        const isMasterAdmin = session.user.email === MASTER_ADMIN_EMAIL
        let role = userProfile?.role || 'member'
        let status = userProfile?.status || 'pending'

        // Force Admin permissions for master email regardless of DB state or timeout
        if (isMasterAdmin) {
          role = 'admin'
          status = 'approved'
        }

        // If we have a session but profile failed (and not master),
        // we essentially treat them as a minimal user to allow UI to render (RoleGuard will handle access)
        const constructedProfile = userProfile || {
          id: session.user.id,
          full_name: session.user.user_metadata?.name || 'Usuário',
          email: session.user.email,
          role: role as any,
          status: status as any,
        }

        set({
          session,
          user: {
            ...session.user,
            role,
            profile: constructedProfile,
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

      // 4. Set up Auth Listener
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          set({
            session: null,
            user: null,
            isAuthenticated: false,
            loading: false,
          })
          return
        }

        // For other events (SIGNED_IN, TOKEN_REFRESHED), ensure user state is updated
        if (session) {
          // We don't block with timeout here to ensure responsiveness,
          // but we still attempt to get fresh profile data
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          const userProfile = profile as Profile
          const isMasterAdmin = session.user.email === MASTER_ADMIN_EMAIL

          let role = userProfile?.role || 'member'
          let status = userProfile?.status || 'pending'

          if (isMasterAdmin) {
            role = 'admin'
            status = 'approved'
          }

          set({
            session,
            user: {
              ...session.user,
              role,
              profile: userProfile || {
                id: session.user.id,
                full_name: session.user.user_metadata?.name || 'Usuário',
                role: role as any,
                status: status as any,
              },
            },
            isAuthenticated: true,
            loading: false,
          })
        }
      })
    } catch (error) {
      console.error('Auth initialization critical error:', error)
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
      // Immediate partial update to improve perceived speed
      const isMasterAdmin = data.session.user.email === MASTER_ADMIN_EMAIL

      set({
        session: data.session,
        user: {
          ...data.session.user,
          role: isMasterAdmin ? 'admin' : 'member', // Optimistic role
          profile: {
            id: data.session.user.id,
            full_name: data.session.user.user_metadata?.name || 'Usuário',
            role: isMasterAdmin ? 'admin' : 'member',
            status: isMasterAdmin ? 'approved' : 'pending',
          },
        },
        isAuthenticated: true,
        loading: true, // Keep loading until profile fetch
      })

      // Fetch full profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.session.user.id)
        .single()

      const userProfile = profile as Profile
      let role = userProfile?.role || 'member'
      let status = userProfile?.status || 'pending'

      if (isMasterAdmin) {
        role = 'admin'
        status = 'approved'
      }

      set({
        session: data.session,
        user: {
          ...data.session.user,
          role,
          profile: userProfile || {
            id: data.session.user.id,
            full_name: data.session.user.user_metadata?.name || 'Usuário',
            role: role as any,
            status: status as any,
          },
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
          role: 'member',
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
