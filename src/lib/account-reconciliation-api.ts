import { supabase } from '@/lib/supabase/client'
import {
  buildMensalidadeLinkContext,
  type MensalidadeLinkContext,
} from '@/lib/account-reconciliation-mensalidade-context'

export async function fetchLinkedMensalidadeTransactionIds(): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('contributions')
    .select('transaction_id')
    .not('transaction_id', 'is', null)

  if (error) throw error

  return new Set(
    (data ?? [])
      .map((row) => row.transaction_id)
      .filter((id): id is string => Boolean(id)),
  )
}

export async function fetchMensalidadeLinkContext(): Promise<MensalidadeLinkContext> {
  const { data, error } = await supabase
    .from('contributions')
    .select(`
      transaction_id,
      brother_id,
      month,
      year,
      profiles!contributions_brother_id_fkey ( full_name )
    `)
    .not('transaction_id', 'is', null)

  if (error) throw error

  return buildMensalidadeLinkContext(
    (data ?? []) as Array<{
      transaction_id: string
      brother_id: string
      month: number
      year: number
      profiles?: { full_name: string | null } | null
    }>,
  )
}
