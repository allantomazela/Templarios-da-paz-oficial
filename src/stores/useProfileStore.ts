import { create } from 'zustand'
import { supabase } from '@/lib/supabase/client'
import { Profile } from './useAuthStore'
import { logError } from '@/lib/logger'
import { createRequestSequence } from '@/lib/request-sequence'
import { isAuthError } from '@/lib/auth-utils'
import useAuthStore from '@/stores/useAuthStore'

interface UserPreferences {
  notifications: {
    push: boolean
    email: boolean
    events: boolean
    messages: boolean
  }
  privacy: {
    profileVisibility: 'public' | 'members' | 'private'
    showEmail: boolean
    showPhone: boolean
  }
  interface: {
    language: 'pt-BR' | 'en-US'
    theme: 'light' | 'dark' | 'auto'
  }
}

interface ProfileState {
  profile: Profile | null
  preferences: UserPreferences
  loading: boolean

  fetchProfile: (userId: string) => Promise<void>
  updateProfile: (data: Partial<Profile>) => Promise<void>
  updateAvatar: (avatarUrl: string) => Promise<void>
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<void>
  refreshProfile: () => Promise<void>
}

const defaultPreferences: UserPreferences = {
  notifications: {
    push: true,
    email: true,
    events: true,
    messages: true,
  },
  privacy: {
    profileVisibility: 'members',
    showEmail: false,
    showPhone: false,
  },
  interface: {
    language: 'pt-BR',
    theme: 'auto',
  },
}

const profileFetchSeq = createRequestSequence()

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  preferences: defaultPreferences,
  loading: false,

  fetchProfile: async (userId: string) => {
    const id = profileFetchSeq.next()
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error

      if (!profileFetchSeq.isCurrent(id)) return

      if (data) {
        const profile: Profile = {
          id: data.id,
          full_name: data.full_name || '',
          email: data.email || undefined,
          role: (data.role as 'admin' | 'editor' | 'member') || 'member',
          status: (data.status as 'pending' | 'approved' | 'blocked') || 'pending',
          masonic_degree: data.masonic_degree || undefined,
          avatar_url: data.avatar_url || undefined,
        }
        set({ profile })
      }
    } catch (error) {
      if (isAuthError(error)) {
        useAuthStore.getState().clearSessionAndRedirectToLogin()
        return
      }
      logError('Error fetching profile', error)
      throw error
    } finally {
      if (profileFetchSeq.isCurrent(id)) {
        set({ loading: false })
      }
    }
  },

  updateProfile: async (data: Partial<Profile>) => {
    const { profile } = get()
    if (!profile) throw new Error('No profile loaded')

    try {
      const updates: any = {}
      const sessionRole = useAuthStore.getState().user?.role

      if (data.full_name !== undefined) updates.full_name = data.full_name
      if (
        data.masonic_degree !== undefined &&
        sessionRole !== 'member'
      ) {
        updates.masonic_degree = data.masonic_degree
      }
      if (data.email !== undefined) updates.email = data.email

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profile.id)

      if (error) throw error

      // Atualizar email no auth se necessário
      if (data.email && data.email !== profile.email) {
        const { error: authError } = await supabase.auth.updateUser({
          email: data.email,
        })
        if (authError) {
          logError('Error updating auth email', authError)
          // Não falhar a operação se apenas o email do auth falhar
        }
      }

      const patch: Partial<Profile> = { ...data }
      if (sessionRole === 'member') {
        delete patch.masonic_degree
      }

      set((state) => ({
        profile: state.profile ? { ...state.profile, ...patch } : null,
      }))
    } catch (error) {
      if (isAuthError(error)) {
        useAuthStore.getState().clearSessionAndRedirectToLogin()
        return
      }
      logError('Error updating profile', error)
      throw error
    }
  },

  updateAvatar: async (avatarUrl: string) => {
    const { profile } = get()
    if (!profile) throw new Error('No profile loaded')

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', profile.id)

      if (error) throw error

      set((state) => ({
        profile: state.profile
          ? { ...state.profile, avatar_url: avatarUrl }
          : null,
      }))
    } catch (error) {
      if (isAuthError(error)) {
        useAuthStore.getState().clearSessionAndRedirectToLogin()
        return
      }
      logError('Error updating avatar', error)
      throw error
    }
  },

  updatePreferences: async (newPreferences: Partial<UserPreferences>) => {
    const { preferences } = get()
    const updated = { ...preferences, ...newPreferences }

    // Salvar preferências no localStorage (poderia ser no banco também)
    try {
      localStorage.setItem('user_preferences', JSON.stringify(updated))
      set({ preferences: updated })
    } catch (error) {
      logError('Error saving preferences', error)
      throw error
    }
  },

  refreshProfile: async () => {
    const { profile } = get()
    if (profile) {
      await get().fetchProfile(profile.id)
    }
  },
}))

// Carregar preferências do localStorage na inicialização
if (typeof window !== 'undefined') {
  try {
    const saved = localStorage.getItem('user_preferences')
    if (saved) {
      const parsed = JSON.parse(saved)
      useProfileStore.setState({ preferences: parsed })
    }
  } catch (error) {
    logError('Error loading preferences from localStorage', error)
  }
}

export default useProfileStore

