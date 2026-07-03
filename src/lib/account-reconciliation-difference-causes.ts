import type { Transaction } from '@/lib/data'
import type {
  AccountReconciliationAudit,
  AccountReconciliationWithReal,
  DuplicateTransactionGroup,
} from '@/lib/account-reconciliation'

const BALANCE_TOLERANCE = 0.01

export interface CashReconciliationSummary {
  totalSystemBalance: number
  totalRealBalance: number | null
  totalDifference: number | null
  accountsWithExtrato: number
  accountsMatched: number
  accountsWithDifference: number
  allInformedMatched: boolean
}

/** Impacto no saldo da conta ao remover o lançamento. */
export function transactionRemovalImpact(transaction: Transaction): number {
  return transaction.type === 'Receita' ? -transaction.amount : transaction.amount
}

export function transactionExplainsDifference(
  transaction: Transaction,
  difference: number,
  accountId: string,
): boolean {
  if (transaction.accountId !== accountId) return false
  const impact = transactionRemovalImpact(transaction)
  return Math.abs(impact + difference) <= BALANCE_TOLERANCE
}

export function duplicateGroupExplainsDifference(
  group: DuplicateTransactionGroup,
  difference: number,
): boolean {
  if (!group.accountId) return false
  const extraCount = group.transactions.length - 1
  if (extraCount <= 0) return false

  const perRemoval =
    group.type === 'Receita' ? -group.amount : group.amount
  const impact = perRemoval * extraCount
  return Math.abs(impact + difference) <= BALANCE_TOLERANCE
}

export function buildCashReconciliationSummary(
  enrichedDetails: AccountReconciliationWithReal[],
): CashReconciliationSummary {
  const totalSystemBalance = enrichedDetails.reduce(
    (sum, detail) => sum + detail.systemBalance,
    0,
  )

  const withExtrato = enrichedDetails.filter(
    (detail) => detail.realBalance !== null,
  )

  const totalRealBalance =
    withExtrato.length > 0
      ? withExtrato.reduce((sum, detail) => sum + (detail.realBalance ?? 0), 0)
      : null

  const totalDifference =
    totalRealBalance !== null ? totalSystemBalance - totalRealBalance : null

  const accountsMatched = withExtrato.filter(
    (detail) => Math.abs(detail.difference ?? 0) < BALANCE_TOLERANCE,
  ).length

  const accountsWithDifference = withExtrato.filter(
    (detail) => Math.abs(detail.difference ?? 0) >= BALANCE_TOLERANCE,
  ).length

  const allInformedMatched =
    withExtrato.length > 0 && accountsWithDifference === 0

  return {
    totalSystemBalance,
    totalRealBalance,
    totalDifference,
    accountsWithExtrato: withExtrato.length,
    accountsMatched,
    accountsWithDifference,
    allInformedMatched,
  }
}

/** Mantém apenas alertas que podem explicar a diferença sistema × extrato. */
export function filterAuditForDifferenceExplaining(
  audit: AccountReconciliationAudit,
  enrichedDetails: AccountReconciliationWithReal[],
): AccountReconciliationAudit {
  const differenceByAccount = new Map<string, number>()

  for (const detail of enrichedDetails) {
    if (detail.difference === null) continue
    if (Math.abs(detail.difference) < BALANCE_TOLERANCE) continue
    differenceByAccount.set(detail.accountId, detail.difference)
  }

  if (differenceByAccount.size === 0) {
    return {
      unlinkedMensalidade: [],
      duplicateGroups: [],
      sameMonthMensalidadeGroups: [],
      sameMonthMensalidadeInformative: [],
      orphanTransactions: [],
    }
  }

  const unlinkedMensalidade = audit.unlinkedMensalidade.filter((item) => {
    const accountId = item.transaction.accountId
    if (!accountId) return false
    const difference = differenceByAccount.get(accountId)
    if (difference === undefined) return false
    return transactionExplainsDifference(item.transaction, difference, accountId)
  })

  const duplicateGroups = audit.duplicateGroups.filter((group) => {
    if (!group.accountId) return false
    const difference = differenceByAccount.get(group.accountId)
    if (difference === undefined) return false
    return duplicateGroupExplainsDifference(group, difference)
  })

  const sameMonthMensalidadeGroups = audit.sameMonthMensalidadeGroups.filter(
    (group) => {
      const difference = differenceByAccount.get(group.accountId)
      if (difference === undefined) return false
      if (group.kind !== 'duplicate_same_reference') return false
      const extra = group.transactions.length - 1
      if (extra <= 0) return false
      const impact = -group.amount * extra
      return Math.abs(impact + difference) <= BALANCE_TOLERANCE
    },
  )

  return {
    unlinkedMensalidade,
    duplicateGroups,
    sameMonthMensalidadeGroups,
    sameMonthMensalidadeInformative: [],
    orphanTransactions: [],
  }
}
