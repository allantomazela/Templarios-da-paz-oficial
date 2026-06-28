import type { BankAccount, Transaction } from '@/lib/data'
import { computeAccountBalance } from '@/lib/financial-balances'

/** Limite padrão para alerta de saldo baixo em contas já utilizadas. */
export const LOW_BALANCE_ALERT_THRESHOLD = 100

/**
 * Contas que merecem alerta de saldo baixo no dashboard.
 * Contas sem nenhum lançamento (ex.: recém-criadas, saldo ainda não informado) são ignoradas.
 */
export function findLowBalanceAccountsForAlert(
  accounts: BankAccount[],
  transactions: Transaction[],
  threshold = LOW_BALANCE_ALERT_THRESHOLD,
): BankAccount[] {
  return accounts.filter((account) => {
    const hasAccountMovement = transactions.some(
      (transaction) => transaction.accountId === account.id,
    )
    if (!hasAccountMovement) return false

    const balance = computeAccountBalance(
      account.initialBalance,
      account.id,
      transactions,
    )
    return balance < threshold
  })
}

export function accountHasFinancialMovement(
  accountId: string,
  transactions: Transaction[],
): boolean {
  return transactions.some((transaction) => transaction.accountId === accountId)
}
