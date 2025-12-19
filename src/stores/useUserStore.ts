import { create } from 'zustand'
import { supabase } from '@/lib/supabase/client'
import { Profile } from './useAuthStore'

interface UserStoreState {
  users: Profile[]
  loading: boolean
  fetchUsers: () => Promise<void>
  updateUserStatus: (id: string, status: Profile['status']) => Promise<void>
  updateUserRole: (id: string, role: Profile['role']) => Promise<void>
  updateUserDegree: (id: string, degree: string) => Promise<void>
}

export const useUserStore = create<UserStoreState>((set) => ({
  users: [],
  loading: false,

  fetchUsers: async () => {
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data) {
        set({ users: data as Profile[] })
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      set({ loading: false })
    }
  },

  updateUserStatus: async (id, status) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status })
        .eq('id', id)

      if (error) throw error

      set((state) => ({
        users: state.users.map((u) => (u.id === id ? { ...u, status } : u)),
      }))
    } catch (error) {
      console.error('Error updating user status:', error)
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
      console.error('Error updating user role:', error)
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
      console.error('Error updating user degree:', error)
      throw error
    }
  },
}))

export default useUserStore
