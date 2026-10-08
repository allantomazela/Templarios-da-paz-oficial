import { supabase } from '@/lib/supabase/client'
import { isMissingRpcError } from '@/lib/supabase-rpc-errors'

export interface OpenCheckinSession {
  session_record_id: string
  event_id: string
  event_date: string
  event_time: string
}

/** RPC get_open_session_for_checkin retorna TABLE → array com 0 ou 1 linha. */
export async function fetchOpenSessionForCheckin(): Promise<{
  session: OpenCheckinSession | null
  error: string | null
}> {
  const { data, error } = await supabase.rpc('get_open_session_for_checkin')

  if (error) {
    if (isMissingRpcError(error)) {
      return {
        session: null,
        error:
          'Função de check-in não configurada no servidor. Contate o administrador.',
      }
    }
    return {
      session: null,
      error:
        error.message ||
        'Não foi possível identificar uma sessão aberta para check-in.',
    }
  }

  const row = Array.isArray(data) ? data[0] : data
  if (!row?.session_record_id) {
    return { session: null, error: null }
  }

  return {
    session: row as OpenCheckinSession,
    error: null,
  }
}
