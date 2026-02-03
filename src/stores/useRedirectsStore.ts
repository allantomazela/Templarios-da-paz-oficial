import { create } from 'zustand'
import { logError } from '@/lib/logger'
import { supabase } from '@/lib/supabase/client'
import { isAuthError } from '@/lib/auth-utils'
import useAuthStore from '@/stores/useAuthStore'

function handleAuthError(error: unknown): boolean {
  if (isAuthError(error)) {
    useAuthStore.getState().clearSessionAndRedirectToLogin()
    return true
  }
  return false
}

export interface Redirect {
  id: string
  source_path: string
  target_path: string
  is_permanent: boolean
  created_at: string
}

interface RedirectsState {
  redirects: Redirect[]
  loading: boolean
  fetchRedirects: () => Promise<void>
  addRedirect: (redirect: Omit<Redirect, 'id' | 'created_at'>) => Promise<void>
  updateRedirect: (id: string, redirect: Partial<Redirect>) => Promise<void>
  deleteRedirect: (id: string) => Promise<void>
}

export const useRedirectsStore = create<RedirectsState>((set) => ({
  redirects: [],
  loading: false,

  fetchRedirects: async () => {
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('redirects')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data) {
        set({ redirects: data })
      }
    } catch (error) {
      if (handleAuthError(error)) return
      logError('Error fetching redirects:', error)
    } finally {
      set({ loading: false })
    }
  },

  addRedirect: async (redirect) => {
    try {
      const { data, error } = await supabase
        .from('redirects')
        .insert(redirect)
        .select()
        .single()

      if (error) throw error

      if (data) {
        set((state) => ({
          redirects: [data, ...state.redirects],
        }))
      }
    } catch (error) {
      if (handleAuthError(error)) return
      logError('Error adding redirect:', error)
      throw error
    }
  },

  updateRedirect: async (id, redirect) => {
    try {
      const { data, error } = await supabase
        .from('redirects')
        .update(redirect)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      if (data) {
        set((state) => ({
          redirects: state.redirects.map((r) => (r.id === id ? data : r)),
        }))
      }
    } catch (error) {
      logError('Error updating redirect:', error)
      throw error
    }
  },

  deleteRedirect: async (id) => {
    try {
      const { error } = await supabase.from('redirects').delete().eq('id', id)

      if (error) throw error

      set((state) => ({
        redirects: state.redirects.filter((r) => r.id !== id),
      }))
    } catch (error) {
      if (handleAuthError(error)) return
      logError('Error deleting redirect:', error)
      throw error
    }
  },
}))

export default useRedirectsStore
