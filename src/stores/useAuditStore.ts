import { create } from 'zustand'
import { logError } from '@/lib/logger'
import { supabase } from '@/lib/supabase/client'
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

const fetchLogsSeq = createRequestSequence()

export const useAuditStore = create<AuditState>((set) => ({
  logs: [],
  loading: false,

  fetchLogs: async () => {
    const id = fetchLogsSeq.next()
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

      if (data && fetchLogsSeq.isCurrent(id)) {
        set({ logs: data as unknown as AuditLog[] })
      }
    } catch (error) {
      if (handleAuthError(error)) return
      logError('Error fetching audit logs:', error)
    } finally {
      if (fetchLogsSeq.isCurrent(id)) {
        set({ loading: false })
      }
    }
  },
}))

export default useAuditStore
