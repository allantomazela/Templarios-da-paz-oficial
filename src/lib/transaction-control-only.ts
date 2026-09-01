import type { Transaction } from '@/lib/data'

export function isControlOnlyTransaction(
  transaction: Pick<Transaction, 'controlOnly'>,
): boolean {
  return Boolean(transaction.controlOnly)
}

/** Transações que entram no cálculo de caixa e saldos de conta. */
export function isTreasuryTransaction(
  transaction: Pick<Transaction, 'type' | 'controlOnly'>,
): boolean {
  return !isControlOnlyTransaction(transaction)
}
