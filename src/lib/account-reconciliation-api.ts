import { supabase } from '@/lib/supabase/client'

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
