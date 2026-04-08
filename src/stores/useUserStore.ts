import { create } from 'zustand'
import { supabase } from '@/lib/supabase/client'
import { Profile } from './useAuthStore'
import { logError } from '@/lib/logger'
import { createRequestSequence } from '@/lib/request-sequence'
import { isAuthError } from '@/lib/auth-utils'
import useAuthStore from '@/stores/useAuthStore'

function handleAuthError(error: unknown): boolean {
  if (isAuthError(error)) {
    useAuthStore.getState().clearSessionAndRedirectToLogin()
    return true
  }
  return false
}

interface UserStoreState {
  users: Profile[]
  loading: boolean
  fetchUsers: () => Promise<void>
  updateUserStatus: (id: string, status: Profile['status']) => Promise<void>
  updateUserRole: (id: string, role: Profile['role']) => Promise<void>
  updateUserDegree: (id: string, degree: string) => Promise<void>
}

const fetchUsersSeq = createRequestSequence()

export const useUserStore = create<UserStoreState>((set) => ({
  users: [],
  loading: false,

  fetchUsers: async () => {
    const id = fetchUsersSeq.next()
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data && fetchUsersSeq.isCurrent(id)) {
        set({ users: data as Profile[] })
      }
    } catch (error) {
      if (handleAuthError(error)) return
      logError('Error fetching users', error)
    } finally {
      if (fetchUsersSeq.isCurrent(id)) {
        set({ loading: false })
      }
    }
  },

  updateUserStatus: async (id, status) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ status })
        .eq('id', id)
        .select()

      if (error) {
        logError('Error updating user status:', error)
        // Log detalhes do erro para debug
        console.error('Status update error details:', {
          id,
          status,
          errorCode: error.code,
          errorMessage: error.message,
          errorDetails: error.details,
          errorHint: error.hint,
        })
        throw error
      }

      // Atualizar estado apenas se a atualização foi bem-sucedida
      if (data && data.length > 0) {
        set((state) => ({
          users: state.users.map((u) => (u.id === id ? { ...u, status } : u)),
        }))
      }
    } catch (error) {
      if (handleAuthError(error)) return
      logError('Error updating user status:', error)
      throw error
    }
  },

  updateUserRole: async (id, role) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', id)

      if (error) throw error

      set((state) => ({
        users: state.users.map((u) => (u.id === id ? { ...u, role } : u)),
      }))
    } catch (error) {
      if (handleAuthError(error)) return
      logError('Error updating user role:', error)
      throw error
    }
  },

  updateUserDegree: async (id, degree) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ masonic_degree: degree })
        .eq('id', id)

      if (error) throw error

      set((state) => ({
        users: state.users.map((u) =>
          u.id === id ? { ...u, masonic_degree: degree } : u,
        ),
      }))
    } catch (error) {
      if (handleAuthError(error)) return
      logError('Error updating user degree:', error)
      throw error
    }
  },
}))

export default useUserStore
