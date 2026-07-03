import type { Transaction } from '@/lib/data'
import type { AccountReconciliationWithReal } from '@/lib/account-reconciliation'

const MENSALIDADE_CATEGORY = 'Mensalidade'
const BALANCE_TOLERANCE = 0.01

export interface UnlinkedMensalidadeHint {
  transaction: Transaction
  accountName?: string
}

export interface MensalidadeBalanceHint {
  accountId: string
  accountName: string
  systemOverReal: number
  unlinkedTransactions: UnlinkedMensalidadeHint[]
  unlinkedTotal: number
  matchesDifference: boolean
}

export function findUnlinkedMensalidadeReceitas(
  transactions: Transaction[],
  linkedMensalidadeTransactionIds: Set<string>,
): Transaction[] {
  return transactions.filter(
    (transaction) =>
      transaction.type === 'Receita' &&
      transaction.category === MENSALIDADE_CATEGORY &&
      !linkedMensalidadeTransactionIds.has(transaction.id),
  )
}

/** Quando o sistema está acima do extrato, aponta mensalidades sem vínculo no cronograma. */
export function buildMensalidadeBalanceHints(
  accounts: Array<{ accountId: string; accountName: string }>,
  transactions: Transaction[],
  linkedMensalidadeTransactionIds: Set<string>,
  enrichedDetails: AccountReconciliationWithReal[],
): MensalidadeBalanceHint[] {
  const unlinked = findUnlinkedMensalidadeReceitas(
    transactions,
    linkedMensalidadeTransactionIds,
  )

  if (unlinked.length === 0) return []

  const hints: MensalidadeBalanceHint[] = []

  for (const account of accounts) {
    const detail = enrichedDetails.find((item) => item.accountId === account.accountId)
    if (!detail || detail.difference === null || detail.difference <= BALANCE_TOLERANCE) {
      continue
    }

    const accountUnlinked = unlinked.filter(
      (transaction) => transaction.accountId === account.accountId,
    )
    if (accountUnlinked.length === 0) continue

    const unlinkedTotal = accountUnlinked.reduce(
      (sum, transaction) => sum + transaction.amount,
      0,
    )

    hints.push({
      accountId: account.accountId,
      accountName: account.accountName,
      systemOverReal: detail.difference,
      unlinkedTransactions: accountUnlinked.map((transaction) => ({
        transaction,
        accountName: account.accountName,
      })),
      unlinkedTotal,
      matchesDifference:
        Math.abs(unlinkedTotal - detail.difference) <= BALANCE_TOLERANCE ||
        accountUnlinked.some(
          (transaction) =>
            Math.abs(transaction.amount - detail.difference) <= BALANCE_TOLERANCE,
        ),
    })
  }

  return hints
    .filter((hint) => hint.matchesDifference)
    .map((hint) => ({
      ...hint,
      unlinkedTransactions: hint.unlinkedTransactions.filter(({ transaction }) =>
        Math.abs(transaction.amount - hint.systemOverReal) <= BALANCE_TOLERANCE,
      ),
    }))
    .filter((hint) => hint.unlinkedTransactions.length > 0)
    .sort((left, right) => right.systemOverReal - left.systemOverReal)
}

export function canAcknowledgeReconciliationAlert(
  alertType: 'errors' | 'review' | 'info',
): boolean {
  return alertType !== 'errors'
}
