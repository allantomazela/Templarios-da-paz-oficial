import { create } from 'zustand'
import { logError } from '@/lib/logger'
import { supabase } from '@/lib/supabase/client'

export interface AuditLog {
  id: string
  profile_id: string
  action: string
  entity_type: string
  entity_id: string
  details: any
  created_at: string
  profiles?: {
    full_name: string
    email: string
  }
}

interface AuditState {
  logs: AuditLog[]
  loading: boolean
  fetchLogs: () => Promise<void>
}

export const useAuditStore = create<AuditState>((set) => ({
  logs: [],
  loading: false,

  fetchLogs: async () => {
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select(
          `
          *,
          profiles (
            full_name,
            email
          )
        `,
        )
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error

      if (data) {
        set({ logs: data as unknown as AuditLog[] })
      }
    } catch (error) {
      logError('Error fetching audit logs:', error)
    } finally {
      set({ loading: false })
    }
  },
}))

export default useAuditStore
