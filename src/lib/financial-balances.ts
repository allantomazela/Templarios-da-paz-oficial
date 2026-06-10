import { supabase } from '@/lib/supabase/client'
import type { BankAccount, Transaction } from '@/lib/data'
import {
  mapBankAccountFromDB,
  mapTransactionFromDB,
} from '@/lib/financial-mappers'

export type BalanceTransaction = Pick<Transaction, 'accountId' | 'type' | 'amount'>

export interface BankAccountWithBalance extends BankAccount {
  currentBalance: number
}

/** Saldo atual = saldo inicial + receitas − despesas da conta. */
export function computeAccountBalance(
  initialBalance: number,
  accountId: string,
  transactions: BalanceTransaction[],
): number {
  return transactions
    .filter((t) => t.accountId === accountId)
    .reduce(
      (sum, t) => sum + (t.type === 'Receita' ? t.amount : -t.amount),
      initialBalance,
    )
}

export function attachBalancesToAccounts(
  accounts: BankAccount[],
  transactions: BalanceTransaction[],
): BankAccountWithBalance[] {
  return accounts.map((account) => ({
    ...account,
    currentBalance: computeAccountBalance(
      account.initialBalance,
      account.id,
      transactions,
    ),
  }))
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

export async function fetchAccountsWithBalances(): Promise<BankAccountWithBalance[]> {
  const { accounts, transactions } = await fetchFinancialAccountsAndTransactions()
  return attachBalancesToAccounts(accounts, transactions)
}

export async function fetchFinancialAccountsAndTransactions(): Promise<{
  accounts: BankAccount[]
  transactions: Transaction[]
}> {
  const [accountsRes, transactionsRes] = await Promise.all([
    supabase.from('financial_accounts').select('*').order('name', { ascending: true }),
    supabase
      .from('financial_transactions')
      .select('*')
      .order('date', { ascending: false }),
  ])

  if (accountsRes.error) throw accountsRes.error
  if (transactionsRes.error) throw transactionsRes.error

  return {
    accounts: (accountsRes.data ?? []).map(mapBankAccountFromDB),
    transactions: (transactionsRes.data ?? []).map(mapTransactionFromDB),
  }
}
