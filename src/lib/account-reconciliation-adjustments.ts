import { supabase } from '@/lib/supabase/client'
import { deleteFinancialTransaction } from '@/lib/financial-transaction-api'
import { notifyFinancialDataChanged } from '@/stores/useFinancialStore'

export interface TransactionDependencyWarning {
  source: 'mensalidade' | 'cerimonia' | 'agape'
  label: string
}

export async function fetchTransactionDependencyWarnings(
  transactionId: string,
): Promise<TransactionDependencyWarning[]> {
  const supabaseAny = supabase as any
  const warnings: TransactionDependencyWarning[] = []

  const [contributionsRes, ceremonyRes, agapeRes] = await Promise.all([
    supabaseAny
      .from('contributions')
      .select('id, month, year, status')
      .eq('transaction_id', transactionId)
      .limit(3),
    supabaseAny
      .from('brother_ceremony_payment_installments')
      .select('id, installment_number, status')
      .eq('transaction_id', transactionId)
      .limit(3),
    supabaseAny
      .from('agape_brother_charges')
      .select('id, month, year')
      .eq('transaction_id', transactionId)
      .limit(3),
  ])

  for (const row of contributionsRes.data ?? []) {
    warnings.push({
      source: 'mensalidade',
      label: `Mensalidade ${row.month}/${row.year} (${row.status})`,
    })
  }

  for (const row of ceremonyRes.data ?? []) {
    warnings.push({
      source: 'cerimonia',
      label: `Parcela de cerimônia #${row.installment_number} (${row.status})`,
    })
  }

  for (const row of agapeRes.data ?? []) {
    warnings.push({
      source: 'agape',
      label: `Cobrança ágape ${row.month}/${row.year}`,
    })
  }

  return warnings
}

export async function deleteReconciliationTransaction(
  transactionId: string,
): Promise<void> {
  await deleteFinancialTransaction(transactionId)
  notifyFinancialDataChanged()
}

export async function deleteReconciliationTransactions(
  transactionIds: string[],
): Promise<void> {
  for (const id of transactionIds) {
    await deleteFinancialTransaction(id)
  }
  notifyFinancialDataChanged()
}
