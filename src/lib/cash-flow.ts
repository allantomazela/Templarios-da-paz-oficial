import type { BankAccount, Transaction } from '@/lib/data'
import { getCalendarDateTimestamp } from '@/lib/format-utils'
import {
  computeAccountBalance,
  computeGlobalBalance,
} from '@/lib/financial-balance-math'
import { isWithinInterval } from 'date-fns'

export interface CashFlowPeriod {
  start: Date
  end: Date
}

export interface PeriodTotals {
  totalIncome: number
  totalExpense: number
  netCashFlow: number
}

export interface AccountCashFlowSummary {
  accountId: string
  accountName: string
  accountType: string
  openingBalance: number
  periodIncome: number
  periodExpense: number
  closingBalance: number
}

export interface CashFlowReconciliation {
  isBalanced: boolean
  globalClosingBalance: number
  sumOfAccountClosingBalances: number
  difference: number
  orphanTransactions: Transaction[]
  orphanPeriodTransactions: Transaction[]
  orphanPeriodIncome: number
  orphanPeriodExpense: number
  periodIncomeMatchesAccounts: boolean
  periodExpenseMatchesAccounts: boolean
}

export interface CashFlowReportData {
  periodTotals: PeriodTotals
  accountSummaries: AccountCashFlowSummary[]
  totalsRow: AccountCashFlowSummary
  reconciliation: CashFlowReconciliation
  periodTransactions: Transaction[]
  incomeByCategory: Record<string, number>
  expenseByCategory: Record<string, number>
}

const BALANCE_TOLERANCE = 0.01

export function isTransactionBeforePeriod(
  date: string,
  periodStart: Date,
): boolean {
  return getCalendarDateTimestamp(date) < getCalendarDateTimestamp(periodStart)
}

export function isTransactionInPeriod(
  date: string,
  period: CashFlowPeriod,
): boolean {
  const timestamp = getCalendarDateTimestamp(date)
  if (!timestamp) return false
  const day = new Date(timestamp)
  return isWithinInterval(day, { start: period.start, end: period.end })
}

function sumByType(
  transactions: Pick<Transaction, 'type' | 'amount'>[],
  type: 'Receita' | 'Despesa',
): number {
  return transactions
    .filter((transaction) => transaction.type === type)
    .reduce((sum, transaction) => sum + transaction.amount, 0)
}

export function filterTransactionsInPeriod(
  transactions: Transaction[],
  period: CashFlowPeriod,
  accountId?: string | null,
): Transaction[] {
  return transactions
    .filter((transaction) => {
      if (accountId && accountId !== 'all' && transaction.accountId !== accountId) {
        return false
      }
      return isTransactionInPeriod(transaction.date, period)
    })
    .sort(
      (left, right) =>
        getCalendarDateTimestamp(left.date) - getCalendarDateTimestamp(right.date),
    )
}

export function computePeriodTotals(transactions: Transaction[]): PeriodTotals {
  const totalIncome = sumByType(transactions, 'Receita')
  const totalExpense = sumByType(transactions, 'Despesa')

  return {
    totalIncome,
    totalExpense,
    netCashFlow: totalIncome - totalExpense,
  }
}

export function computeAccountCashFlowSummary(
  account: BankAccount,
  allTransactions: Transaction[],
  period: CashFlowPeriod,
): AccountCashFlowSummary {
  const accountTransactions = allTransactions.filter(
    (transaction) => transaction.accountId === account.id,
  )
  const beforePeriod = accountTransactions.filter((transaction) =>
    isTransactionBeforePeriod(transaction.date, period.start),
  )
  const inPeriod = accountTransactions.filter((transaction) =>
    isTransactionInPeriod(transaction.date, period),
  )

  const openingBalance = computeAccountBalance(
    account.initialBalance,
    account.id,
    beforePeriod,
  )
  const periodIncome = sumByType(inPeriod, 'Receita')
  const periodExpense = sumByType(inPeriod, 'Despesa')

  return {
    accountId: account.id,
    accountName: account.name,
    accountType: account.type,
    openingBalance,
    periodIncome,
    periodExpense,
    closingBalance: openingBalance + periodIncome - periodExpense,
  }
}

export function computeAllAccountsCashFlow(
  accounts: BankAccount[],
  allTransactions: Transaction[],
  period: CashFlowPeriod,
): AccountCashFlowSummary[] {
  return accounts.map((account) =>
    computeAccountCashFlowSummary(account, allTransactions, period),
  )
}

export function computeTotalsRow(
  summaries: AccountCashFlowSummary[],
): AccountCashFlowSummary {
  return summaries.reduce<AccountCashFlowSummary>(
    (accumulator, row) => ({
      accountId: 'total',
      accountName: 'TOTAL GERAL',
      accountType: '',
      openingBalance: accumulator.openingBalance + row.openingBalance,
      periodIncome: accumulator.periodIncome + row.periodIncome,
      periodExpense: accumulator.periodExpense + row.periodExpense,
      closingBalance: accumulator.closingBalance + row.closingBalance,
    }),
    {
      accountId: 'total',
      accountName: 'TOTAL GERAL',
      accountType: '',
      openingBalance: 0,
      periodIncome: 0,
      periodExpense: 0,
      closingBalance: 0,
    },
  )
}

export function detectOrphanTransactions(transactions: Transaction[]): Transaction[] {
  return transactions.filter((transaction) => !transaction.accountId)
}

export function computeReconciliation(
  accounts: BankAccount[],
  allTransactions: Transaction[],
  period: CashFlowPeriod,
  accountSummaries: AccountCashFlowSummary[],
  periodTotals: PeriodTotals,
): CashFlowReconciliation {
  const globalClosingBalance = computeGlobalBalance(accounts, allTransactions)
  const sumOfAccountClosingBalances = accountSummaries.reduce(
    (sum, row) => sum + row.closingBalance,
    0,
  )
  const difference = Math.abs(globalClosingBalance - sumOfAccountClosingBalances)

  const orphans = detectOrphanTransactions(allTransactions)
  const orphanPeriodTransactions = orphans.filter((transaction) =>
    isTransactionInPeriod(transaction.date, period),
  )
  const orphanPeriodIncome = sumByType(orphanPeriodTransactions, 'Receita')
  const orphanPeriodExpense = sumByType(orphanPeriodTransactions, 'Despesa')

  const accountsPeriodIncome = accountSummaries.reduce(
    (sum, row) => sum + row.periodIncome,
    0,
  )
  const accountsPeriodExpense = accountSummaries.reduce(
    (sum, row) => sum + row.periodExpense,
    0,
  )

  return {
    isBalanced: difference < BALANCE_TOLERANCE,
    globalClosingBalance,
    sumOfAccountClosingBalances,
    difference,
    orphanTransactions: orphans,
    orphanPeriodTransactions,
    orphanPeriodIncome,
    orphanPeriodExpense,
    periodIncomeMatchesAccounts:
      Math.abs(
        periodTotals.totalIncome - accountsPeriodIncome - orphanPeriodIncome,
      ) < BALANCE_TOLERANCE,
    periodExpenseMatchesAccounts:
      Math.abs(
        periodTotals.totalExpense - accountsPeriodExpense - orphanPeriodExpense,
      ) < BALANCE_TOLERANCE,
  }
}

export function groupByCategory(
  transactions: Transaction[],
  type: 'Receita' | 'Despesa',
): Record<string, number> {
  return transactions
    .filter((transaction) => transaction.type === type)
    .reduce<Record<string, number>>((accumulator, transaction) => {
      accumulator[transaction.category] =
        (accumulator[transaction.category] || 0) + transaction.amount
      return accumulator
    }, {})
}

export function buildCashFlowReport(
  accounts: BankAccount[],
  allTransactions: Transaction[],
  period: CashFlowPeriod,
  accountFilter: string = 'all',
): CashFlowReportData {
  const periodTransactions = filterTransactionsInPeriod(
    allTransactions,
    period,
    accountFilter,
  )
  const periodTotals = computePeriodTotals(periodTransactions)

  const filteredAccounts =
    accountFilter !== 'all'
      ? accounts.filter((account) => account.id === accountFilter)
      : accounts

  const allAccountSummaries = computeAllAccountsCashFlow(
    accounts,
    allTransactions,
    period,
  )
  const accountSummaries =
    accountFilter === 'all'
      ? allAccountSummaries
      : allAccountSummaries.filter((row) => row.accountId === accountFilter)

  const totalsRow = computeTotalsRow(accountSummaries)
  const reconciliation = computeReconciliation(
    accounts,
    allTransactions,
    period,
    allAccountSummaries,
    computePeriodTotals(
      filterTransactionsInPeriod(allTransactions, period, 'all'),
    ),
  )

  return {
    periodTotals,
    accountSummaries,
    totalsRow,
    reconciliation,
    periodTransactions,
    incomeByCategory: groupByCategory(periodTransactions, 'Receita'),
    expenseByCategory: groupByCategory(periodTransactions, 'Despesa'),
  }
}
