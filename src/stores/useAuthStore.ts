import { create } from 'zustand'
import { supabase } from '@/lib/supabase/client'
import { User as SupabaseUser, Session } from '@supabase/supabase-js'
import { logWarning, logError } from '@/lib/logger'

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
  sendPasswordResetEmail: (email: string) => Promise<{ error: any }>
  updatePassword: (password: string) => Promise<{ error: any }>
}

const MASTER_ADMIN_EMAIL = 'allantomazela@gmail.com'
const PROFILE_TIMEOUT_MS = 3000

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  loading: true,
  isAuthenticated: false,

  /**
   * Inicializa o estado de autenticação verificando a sessão atual
   * e configurando os listeners de mudança de estado de autenticação.
   * 
   * @throws {Error} Se houver erro crítico na inicialização
   */
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
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error('Profile fetch timeout')),
              PROFILE_TIMEOUT_MS,
            ),
          )

          const fetchPromise = supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
            .then(({ data, error }) => {
              if (error) throw error
              return data
            })

          userProfile = (await Promise.race([
            fetchPromise,
            timeoutPromise,
          ])) as Profile
        } catch (error) {
          fetchError = error
          logWarning('Auth initialization warning: Profile fetch failed', error)
        }

        const isMasterAdmin = session.user.email === MASTER_ADMIN_EMAIL
        let role = userProfile?.role || 'member'
        let status = userProfile?.status || 'pending'

        if (isMasterAdmin) {
          role = 'admin'
          status = 'approved'
        }

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

      supabase.auth.onAuthStateChange(async (event, session) => {
        // Handle token refresh errors
        if (event === 'TOKEN_REFRESHED' && !session) {
          // Token refresh failed, clear session
          logWarning('Token refresh failed, signing out')
          await supabase.auth.signOut()
          set({
            session: null,
            user: null,
            isAuthenticated: false,
            loading: false,
          })
          return
        }

        if (event === 'SIGNED_OUT' || !session) {
          set({
            session: null,
            user: null,
            isAuthenticated: false,
            loading: false,
          })
          return
        }

        if (session) {
          try {
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
          } catch (error) {
            logError('Error updating auth state', error)
            // Don't sign out on profile fetch error, just log it
          }
        }
      })
    } catch (error) {
      logError('Auth initialization critical error', error)
      set({ loading: false })
    }
  },

  /**
   * Realiza login usando OTP (One-Time Password) via email
   * 
   * @param email - Email do usuário
   * @returns Promise com objeto contendo error (se houver)
   */
  signIn: async (email) => {
    const { error } = await supabase.auth.signInWithOtp({ email })
    return { error }
  },

  /**
   * Realiza login usando email e senha
   * 
   * @param email - Email do usuário
   * @param password - Senha do usuário
   * @returns Promise com objeto contendo error (se houver)
   */
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
      const isMasterAdmin = data.session.user.email === MASTER_ADMIN_EMAIL

      set({
        session: data.session,
        user: {
          ...data.session.user,
          role: isMasterAdmin ? 'admin' : 'member',
          profile: {
            id: data.session.user.id,
            full_name: data.session.user.user_metadata?.name || 'Usuário',
            role: isMasterAdmin ? 'admin' : 'member',
            status: isMasterAdmin ? 'approved' : 'pending',
          },
        },
        isAuthenticated: true,
        loading: true,
      })

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
    try {
      // Limpar estado primeiro para garantir que a UI seja atualizada
      set({ user: null, session: null, isAuthenticated: false, loading: false })
      
      // Fazer logout no Supabase
      const { error } = await supabase.auth.signOut()
      
      // Garantir que o estado esteja limpo mesmo se houver erro
      if (error) {
        console.error('Erro ao fazer logout:', error)
      }
      
      // Garantir que o estado esteja limpo
      set({ user: null, session: null, isAuthenticated: false, loading: false })
      
      return { error }
    } catch (err) {
      console.error('Erro ao fazer logout:', err)
      // Garantir que o estado esteja limpo mesmo em caso de erro
      set({ user: null, session: null, isAuthenticated: false, loading: false })
      return { error: err }
    }
  },

  sendPasswordResetEmail: async (email: string) => {
    set({ loading: true })
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password',
    })
    set({ loading: false })
    return { error }
  },

  updatePassword: async (password: string) => {
    set({ loading: true })
    const { error } = await supabase.auth.updateUser({ password })
    set({ loading: false })
    return { error }
  },
}))

export default useAuthStore
