import {
  deleteFinancialTransactionWithDependencies,
  deleteFinancialTransactionsWithDependencies,
  fetchTransactionDeleteDependencies,
  type TransactionDeleteDependency,
} from '@/lib/financial-transaction-delete'
import { notifyFinancialDataChanged } from '@/stores/useFinancialStore'

export interface TransactionDependencyWarning {
  source: 'mensalidade' | 'cerimonia' | 'agape'
  label: string
}

export async function fetchTransactionDependencyWarnings(
  transactionId: string,
): Promise<TransactionDependencyWarning[]> {
  const dependencies = await fetchTransactionDeleteDependencies(transactionId)
  return dependencies.map((item: TransactionDeleteDependency) => ({
    source: item.source,
    label: item.label,
  }))
}

export async function deleteReconciliationTransaction(
  transactionId: string,
): Promise<void> {
  await deleteFinancialTransactionWithDependencies(transactionId)
  notifyFinancialDataChanged()
}

export async function deleteReconciliationTransactions(
  transactionIds: string[],
): Promise<void> {
  await deleteFinancialTransactionsWithDependencies(transactionIds)
  notifyFinancialDataChanged()
}
