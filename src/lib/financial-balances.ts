import { supabase } from '@/lib/supabase/client'
import type { BankAccount, Transaction } from '@/lib/data'
import {
  mapBankAccountFromDB,
  mapTransactionFromDB,
} from '@/lib/financial-mappers'
import {
  computeAccountBalance,
  computeGlobalBalance,
  type BalanceTransaction,
} from '@/lib/financial-balance-math'

export type { BalanceTransaction } from '@/lib/financial-balance-math'
export { computeAccountBalance, computeGlobalBalance } from '@/lib/financial-balance-math'

export interface BankAccountWithBalance extends BankAccount {
  currentBalance: number
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
