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
