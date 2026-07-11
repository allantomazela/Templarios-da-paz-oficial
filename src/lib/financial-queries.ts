import { supabase } from '@/lib/supabase/client'

function formatSupabaseError(prefix: string, err: { message?: string; details?: string; hint?: string }) {
  const parts = [err.message, err.details, err.hint].filter(Boolean)
  const tail = parts.length ? `: ${parts.join(' — ')}` : ''
  return `${prefix}${tail}`
}

export type FinancialTransactionRow = {
  id: string
  date: string
  description: string
  category: string
  type: 'Receita' | 'Despesa'
  amount: number | string
  account_id: string | null
  attachment_notes?: string | null
  is_control_only?: boolean | null
}

/**
 * Carrega transações por tipo e nomes de contas em duas consultas simples.
 * Evita embed `resource!fk` que pode retornar 400 se o hint da FK no PostgREST divergir do banco.
 */
export async function fetchTransactionsWithAccountNames(
  type: 'Receita' | 'Despesa',
): Promise<{
  transactions: FinancialTransactionRow[]
  accountNames: Record<string, string>
}> {
  const [txRes, accRes] = await Promise.all([
    supabase
      .from('financial_transactions')
      .select('*')
      .eq('type', type)
      .order('date', { ascending: false }),
    supabase.from('financial_accounts').select('id, name'),
  ])

  if (txRes.error) {
    throw new Error(
      formatSupabaseError('Falha ao carregar transações', txRes.error),
    )
  }
  if (accRes.error) {
    throw new Error(
      formatSupabaseError('Falha ao carregar contas bancárias', accRes.error),
    )
  }

  const accountNames: Record<string, string> = {}
  for (const row of accRes.data ?? []) {
    accountNames[row.id] = row.name
  }

  return {
    transactions: (txRes.data ?? []) as FinancialTransactionRow[],
    accountNames,
  }
}
