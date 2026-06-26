import type { BankAccount, Transaction } from '@/lib/data'
import {
  computeAccountBalance,
  sumTransactionsByType,
} from '@/lib/financial-balance-math'

const MENSALIDADE_CATEGORY = 'Mensalidade'

const BALANCE_TOLERANCE = 0.01

export interface AccountReconciliationDetail {
  accountId: string
  accountName: string
  accountType: string
  initialBalance: number
  systemBalance: number
  totalIncome: number
  totalExpense: number
  netMovement: number
}

export interface AccountReconciliationWithReal extends AccountReconciliationDetail {
  realBalance: number | null
  difference: number | null
  suggestedInitialBalance: number | null
  canApplySuggestedInitial: boolean
}

export interface DuplicateTransactionGroup {
  key: string
  accountId: string | undefined
  date: string
  amount: number
  type: Transaction['type']
  transactions: Transaction[]
}

export interface MensalidadeAuditItem {
  transaction: Transaction
  reason: 'sem_vinculo_mensalidade' | 'possivel_duplicata'
}

export interface AccountReconciliationAudit {
  unlinkedMensalidade: MensalidadeAuditItem[]
  duplicateGroups: DuplicateTransactionGroup[]
  sameMonthMensalidadeGroups: SameMonthMensalidadeGroup[]
  orphanTransactions: Transaction[]
}

export interface SameMonthMensalidadeGroup {
  key: string
  accountId: string
  monthKey: string
  amount: number
  transactions: Transaction[]
}

/** Impacto no saldo da conta ao remover o lançamento (positivo = saldo sobe). */
export function computeTransactionBalanceImpact(transaction: Transaction): number {
  const signed = transaction.type === 'Receita' ? transaction.amount : -transaction.amount
  return Math.round(-signed * 100) / 100
}

export function buildAccountReconciliationDetails(
  accounts: BankAccount[],
  transactions: Transaction[],
): AccountReconciliationDetail[] {
  return accounts.map((account) => {
    const accountTransactions = transactions.filter(
      (transaction) => transaction.accountId === account.id,
    )
    const totalIncome = sumTransactionsByType(accountTransactions, 'Receita', {
      accountLinkedOnly: false,
    })
    const totalExpense = sumTransactionsByType(accountTransactions, 'Despesa', {
      accountLinkedOnly: false,
    })
    const systemBalance = computeAccountBalance(
      account.initialBalance,
      account.id,
      transactions,
    )

    return {
      accountId: account.id,
      accountName: account.name,
      accountType: account.type,
      initialBalance: account.initialBalance,
      systemBalance,
      totalIncome,
      totalExpense,
      netMovement: totalIncome - totalExpense,
    }
  })
}

/** Saldo inicial que faria o saldo do sistema igual ao extrato bancário. */
export function computeSuggestedInitialBalance(
  realBalance: number,
  detail: Pick<AccountReconciliationDetail, 'initialBalance' | 'systemBalance'>,
): number {
  const netMovement = detail.systemBalance - detail.initialBalance
  return Math.round((realBalance - netMovement) * 100) / 100
}

export function enrichWithRealBalance(
  detail: AccountReconciliationDetail,
  realBalance: number | null,
): AccountReconciliationWithReal {
  if (realBalance === null || Number.isNaN(realBalance)) {
    return {
      ...detail,
      realBalance: null,
      difference: null,
      suggestedInitialBalance: null,
      canApplySuggestedInitial: false,
    }
  }

  const difference = detail.systemBalance - realBalance
  const suggestedInitialBalance = computeSuggestedInitialBalance(realBalance, detail)
  const canApplySuggestedInitial =
    Math.abs(difference) >= BALANCE_TOLERANCE &&
    suggestedInitialBalance >= 0 &&
    Math.abs(suggestedInitialBalance - detail.initialBalance) >= BALANCE_TOLERANCE

  return {
    ...detail,
    realBalance,
    difference,
    suggestedInitialBalance,
    canApplySuggestedInitial,
  }
}

export function findDuplicateTransactionGroups(
  transactions: Transaction[],
): DuplicateTransactionGroup[] {
  const groups = new Map<string, Transaction[]>()

  for (const transaction of transactions) {
    if (!transaction.accountId) continue
    const key = [
      transaction.accountId,
      transaction.date,
      transaction.type,
      transaction.amount.toFixed(2),
    ].join('|')
    const current = groups.get(key) ?? []
    current.push(transaction)
    groups.set(key, current)
  }

  return [...groups.entries()]
    .filter(([, items]) => items.length > 1)
    .map(([key, items]) => ({
      key,
      accountId: items[0].accountId,
      date: items[0].date,
      amount: items[0].amount,
      type: items[0].type,
      transactions: items,
    }))
    .sort((left, right) => right.transactions.length - left.transactions.length)
}

/**
 * Mensalidades com mesmo valor na mesma conta e mês (ex.: atraso do mês anterior
 * pago junto com a mensalidade corrente).
 */
export function findSameMonthMensalidadeGroups(
  transactions: Transaction[],
): SameMonthMensalidadeGroup[] {
  const groups = new Map<string, Transaction[]>()

  for (const transaction of transactions) {
    if (
      transaction.type !== 'Receita' ||
      transaction.category !== MENSALIDADE_CATEGORY ||
      !transaction.accountId
    ) {
      continue
    }

    const monthKey = transaction.date.slice(0, 7)
    const key = [
      transaction.accountId,
      monthKey,
      transaction.amount.toFixed(2),
    ].join('|')

    const current = groups.get(key) ?? []
    current.push(transaction)
    groups.set(key, current)
  }

  return [...groups.entries()]
    .filter(([, items]) => items.length > 1)
    .map(([key, items]) => ({
      key,
      accountId: items[0].accountId!,
      monthKey: items[0].date.slice(0, 7),
      amount: items[0].amount,
      transactions: items.sort((left, right) => left.date.localeCompare(right.date)),
    }))
    .sort((left, right) => right.transactions.length - left.transactions.length)
}

export function auditMensalidadeTransactions(
  transactions: Transaction[],
  linkedMensalidadeTransactionIds: Set<string>,
): MensalidadeAuditItem[] {
  const mensalidadeReceitas = transactions.filter(
    (transaction) =>
      transaction.type === 'Receita' &&
      transaction.category === MENSALIDADE_CATEGORY,
  )

  const items: MensalidadeAuditItem[] = []

  for (const transaction of mensalidadeReceitas) {
    if (!linkedMensalidadeTransactionIds.has(transaction.id)) {
      items.push({ transaction, reason: 'sem_vinculo_mensalidade' })
    }
  }

  const linkedByAccountDateAmount = new Map<string, string>()

  for (const transaction of mensalidadeReceitas) {
    if (!transaction.accountId) continue
    const key = `${transaction.accountId}|${transaction.date}|${transaction.amount.toFixed(2)}`
    if (linkedByAccountDateAmount.has(key)) {
      items.push({ transaction, reason: 'possivel_duplicata' })
    } else if (linkedMensalidadeTransactionIds.has(transaction.id)) {
      linkedByAccountDateAmount.set(key, transaction.id)
    }
  }

  return items
}

export function buildReconciliationAudit(
  transactions: Transaction[],
  linkedMensalidadeTransactionIds: Set<string>,
): AccountReconciliationAudit {
  return {
    unlinkedMensalidade: auditMensalidadeTransactions(
      transactions,
      linkedMensalidadeTransactionIds,
    ),
    duplicateGroups: findDuplicateTransactionGroups(transactions),
    sameMonthMensalidadeGroups: findSameMonthMensalidadeGroups(transactions),
    orphanTransactions: transactions.filter((transaction) => !transaction.accountId),
  }
}
