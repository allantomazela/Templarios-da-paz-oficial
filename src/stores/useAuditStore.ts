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
  error: string | null
  fetchLogs: () => Promise<void>
}

const fetchLogsSeq = createRequestSequence()

export const useAuditStore = create<AuditState>((set) => ({
  logs: [],
  loading: false,
  error: null,

  fetchLogs: async () => {
    const id = fetchLogsSeq.next()
    set({ loading: true, error: null })
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

      if (fetchLogsSeq.isCurrent(id)) {
        set({ logs: (data ?? []) as unknown as AuditLog[], error: null })
      }
    } catch (error) {
      if (handleAuthError(error)) return
      logError('Error fetching audit logs:', error)
      if (fetchLogsSeq.isCurrent(id)) {
        set({
          error:
            error instanceof Error
              ? error.message
              : 'Não foi possível carregar o histórico de auditoria.',
        })
      }
    } finally {
      if (fetchLogsSeq.isCurrent(id)) {
        set({ loading: false })
      }
    }
  },
}))

export default useAuditStore
