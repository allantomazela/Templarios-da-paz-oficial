import type { BankAccount, Transaction } from '@/lib/data'

export type BalanceTransaction = Pick<Transaction, 'accountId' | 'type' | 'amount'>

/** Saldo atual = saldo inicial + receitas − despesas da conta. */
export function computeAccountBalance(
  initialBalance: number,
  accountId: string,
  transactions: BalanceTransaction[],
): number {
  return transactions
    .filter((transaction) => transaction.accountId === accountId)
    .reduce(
      (sum, transaction) =>
        sum + (transaction.type === 'Receita' ? transaction.amount : -transaction.amount),
      initialBalance,
    )
}

export function computeGlobalBalance(
  accounts: Pick<BankAccount, 'id' | 'initialBalance'>[],
  transactions: BalanceTransaction[],
): number {
  return accounts.reduce(
    (total, account) =>
      total + computeAccountBalance(account.initialBalance, account.id, transactions),
    0,
  )
}

const BALANCE_TOLERANCE = 0.01

export interface CashAvailabilitySummary {
  totalInitialBalance: number
  totalIncome: number
  totalExpense: number
  netMovement: number
  availableCash: number
  isBalanced: boolean
  difference: number
}

export function sumTransactionAmounts(
  transactions: Pick<Transaction, 'amount'>[],
): number {
  return transactions.reduce((sum, transaction) => sum + transaction.amount, 0)
}

export function sumTransactionsByType(
  transactions: BalanceTransaction[],
  type: 'Receita' | 'Despesa',
  options?: { accountLinkedOnly?: boolean },
): number {
  const accountLinkedOnly = options?.accountLinkedOnly ?? true

  return transactions
    .filter(
      (transaction) =>
        transaction.type === type &&
        (!accountLinkedOnly || Boolean(transaction.accountId)),
    )
    .reduce((sum, transaction) => sum + transaction.amount, 0)
}

/** Caixa disponível = saldos atuais de todas as contas (receitas − despesas já descontadas). */
export function computeCashAvailability(
  accounts: Pick<BankAccount, 'id' | 'initialBalance'>[],
  allTransactions: BalanceTransaction[],
): CashAvailabilitySummary {
  const totalInitialBalance = accounts.reduce(
    (sum, account) => sum + account.initialBalance,
    0,
  )
  const totalIncome = sumTransactionsByType(allTransactions, 'Receita')
  const totalExpense = sumTransactionsByType(allTransactions, 'Despesa')
  const availableCash = computeGlobalBalance(accounts, allTransactions)
  const expectedCash = totalInitialBalance + totalIncome - totalExpense
  const difference = Math.abs(availableCash - expectedCash)

  return {
    totalInitialBalance,
    totalIncome,
    totalExpense,
    netMovement: totalIncome - totalExpense,
    availableCash,
    isBalanced: difference < BALANCE_TOLERANCE,
    difference,
  }
}
