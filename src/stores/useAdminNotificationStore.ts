import { create } from 'zustand'
import { supabase } from '@/lib/supabase/client'

export interface AppNotification {
  id: string
  profile_id: string
  title: string
  message: string
  link?: string
  is_read: boolean
  created_at: string
}

interface AdminNotificationState {
  notifications: AppNotification[]
  loading: boolean
  unreadCount: number
  fetchNotifications: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
}

export const useAdminNotificationStore = create<AdminNotificationState>(
  (set, get) => ({
    notifications: [],
    loading: false,
    unreadCount: 0,

    fetchNotifications: async () => {
      set({ loading: true })
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('profile_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20)

        if (error) throw error

        if (data) {
          const unread = data.filter((n: AppNotification) => !n.is_read).length
          set({ notifications: data, unreadCount: unread })
        }
      } catch (error) {
        console.error('Error fetching notifications:', error)
      } finally {
        set({ loading: false })
      }
    },

    markAsRead: async (id) => {
      try {
        const { error } = await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', id)

        if (error) throw error

        set((state) => {
          const updated = state.notifications.map((n) =>
            n.id === id ? { ...n, is_read: true } : n,
          )
          const unread = updated.filter((n) => !n.is_read).length
          return { notifications: updated, unreadCount: unread }
        })
      } catch (error) {
        console.error('Error marking notification as read:', error)
      }
    },

    markAllAsRead: async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        const { error } = await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('profile_id', user.id)
          .eq('is_read', false)

        if (error) throw error

        set((state) => ({
          notifications: state.notifications.map((n) => ({
            ...n,
            is_read: true,
          })),
          unreadCount: 0,
        }))
      } catch (error) {
        console.error('Error marking all as read:', error)
      }
    },
  }),
)

export default useAdminNotificationStore
