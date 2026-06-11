import { create } from 'zustand'
import { supabase } from '@/lib/supabase/client'
import { User as SupabaseUser, Session } from '@supabase/supabase-js'
import { logWarning, logError } from '@/lib/logger'
import {
  isAuthError as isAuthErrorUtil,
  clearSupabaseAuthStorage,
} from '@/lib/auth-utils'
import { isMasterAdminEmail } from '@/config/master-admin'
import { getAppOrigin } from '@/lib/app-origin'
import { sendUserEmail } from '@/lib/user-email-api'
import { sanitizeAuthProfile } from '@/lib/profile-avatar'

export type UserStatus = 'pending' | 'approved' | 'blocked' | 'in_memoriam' | 'adormecido'

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
  /** Limpa sessão e redireciona para /login (ex.: quando refresh token é inválido) */
  clearSessionAndRedirectToLogin: () => void
}

const PROFILE_TIMEOUT_MS = 3000

export const useAuthStore = create<AuthState>((set) => ({
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
      // 1. Check for current session (pode falhar se refresh token for inválido)
      let session: Session | null = null
      let sessionError: Error | null = null
      try {
        const result = await supabase.auth.getSession()
        session = result.data.session
        sessionError = result.error ?? null
      } catch (err) {
        if (isAuthErrorUtil(err)) {
          logWarning('Sessão inválida (refresh token), limpando e deslogando', err)
          clearSupabaseAuthStorage()
          set({
            session: null,
            user: null,
            isAuthenticated: false,
            loading: false,
          })
          return
        }
        throw err
      }

      if (sessionError) {
        if (isAuthErrorUtil(sessionError)) {
          clearSupabaseAuthStorage()
          set({
            session: null,
            user: null,
            isAuthenticated: false,
            loading: false,
          })
          return
        }
        throw sessionError
      }

      if (session) {
        // 2. Fetch Profile with Timeout Strategy
        let userProfile: Profile | null = null

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

          const rawProfile = (await Promise.race([
            fetchPromise,
            timeoutPromise,
          ])) as Profile
          userProfile = sanitizeAuthProfile(rawProfile)
        } catch (error) {
          logWarning('Auth initialization warning: Profile fetch failed', error)
        }

        const isMasterAdmin = isMasterAdminEmail(session.user.email)
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
          // Token refresh failed, clear session e storage para evitar loop
          logWarning('Token refresh failed, clearing session')
          clearSupabaseAuthStorage()
          set({
            session: null,
            user: null,
            isAuthenticated: false,
            loading: false,
          })
          return
        }

        if (event === 'SIGNED_OUT' || !session) {
          clearSupabaseAuthStorage()
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

            const userProfile = profile
              ? sanitizeAuthProfile(profile as Profile)
              : null
            const isMasterAdmin = isMasterAdminEmail(session.user.email)

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
      if (isAuthErrorUtil(error)) {
        logWarning('Erro de autenticação na inicialização, limpando sessão', error)
        clearSupabaseAuthStorage()
        set({
          session: null,
          user: null,
          isAuthenticated: false,
          loading: false,
        })
        return
      }
      logError('Auth initialization critical error', error)
      set({ loading: false })
    }
  },

  clearSessionAndRedirectToLogin: () => {
    clearSupabaseAuthStorage()
    set({
      session: null,
      user: null,
      isAuthenticated: false,
      loading: false,
    })
    window.location.href = '/login'
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
      const isMasterAdmin = isMasterAdminEmail(data.session.user.email)

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.session.user.id)
        .single()

      const userProfile = profile
        ? sanitizeAuthProfile(profile as Profile)
        : null
      let role = userProfile?.role || 'member'
      let status = userProfile?.status || 'pending'

      if (isMasterAdmin) {
        role = 'admin'
        status = 'approved'
      }

      if (
        !isMasterAdmin &&
        (status === 'pending' ||
          status === 'blocked' ||
          status === 'in_memoriam' ||
          status === 'adormecido')
      ) {
        await supabase.auth.signOut()
        set({
          session: null,
          user: null,
          isAuthenticated: false,
          loading: false,
        })
        const message =
          status === 'pending'
            ? 'Sua conta ainda aguarda aprovação da diretoria ou da administração.'
            : 'Sua conta está bloqueada. Entre em contato com a administração da loja.'
        return {
          error: { message, code: status === 'pending' ? 'pending_approval' : 'blocked' },
        }
      }

      set({
        session: data.session,
        user: {
          ...data.session.user,
          role,
          profile: userProfile || {
            id: data.session.user.id,
            full_name: data.session.user.user_metadata?.name || 'Usuário',
            email: data.session.user.email,
            role: role as Profile['role'],
            status: status as Profile['status'],
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
    const { data, error } = await supabase.auth.signUp({
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

    if (!error && data.user) {
      if (data.session) {
        await sendUserEmail({
          type: 'signup_pending',
          email,
          fullName: name,
        })
      } else {
        void sendUserEmail({
          type: 'signup_pending',
          email,
          fullName: name,
        })
      }
      await supabase.auth.signOut()
    }

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
      redirectTo: `${getAppOrigin()}/reset-password`,
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
