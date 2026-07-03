import type { BankAccount, Transaction } from '@/lib/data'
import type { BrotherMembershipSchedule } from '@/lib/membership-schedule'
import {
  computeAllAccountsCashFlow,
  computePeriodTotals,
  computeTotalsRow,
  filterTransactionsInPeriod,
  type CashFlowPeriod,
} from '@/lib/cash-flow'
import {
  computeAccountBalance,
  computeGlobalBalance,
} from '@/lib/financial-balance-math'
import { endOfMonth, startOfMonth } from 'date-fns'
import type {
  AccountProjectedBalance,
  ForecastComparisonRow,
  ForecastItem,
  ForecastLinkStatus,
  ForecastMonthCashFlow,
  ForecastMonthCashFlowAccount,
  ForecastMonthOverride,
  ForecastMonthSummary,
  ForecastProjectionResult,
  ForecastUnplannedTransaction,
  MembershipForecastOverride,
} from '@/lib/forecast-types'

export const MEMBERSHIP_FORECAST_CATEGORY = 'Mensalidade'
export const FORECAST_HORIZON_MONTHS = 3

const MONTH_LABELS = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
] as const

export interface ForecastProjectionInput {
  referenceDate?: Date
  horizonMonths?: number
  items: ForecastItem[]
  monthOverrides: ForecastMonthOverride[]
  membershipOverrides: MembershipForecastOverride[]
  membershipSchedules: BrotherMembershipSchedule[]
  transactions: Array<
    Pick<
      Transaction,
      | 'id'
      | 'date'
      | 'type'
      | 'amount'
      | 'category'
      | 'accountId'
      | 'forecastItemId'
      | 'description'
    >
  >
  accounts: Pick<BankAccount, 'id' | 'name' | 'initialBalance'>[]
}

export function isMembershipCategory(category: string): boolean {
  return category.trim().toLowerCase() === MEMBERSHIP_FORECAST_CATEGORY.toLowerCase()
}

export function itemAppliesToMonth(
  item: Pick<ForecastItem, 'recurrence' | 'recurrenceMonth' | 'isActive'>,
  _year: number,
  month: number,
): boolean {
  if (!item.isActive) return false

  switch (item.recurrence) {
    case 'monthly':
      return true
    case 'annual':
      return item.recurrenceMonth === month
    case 'once':
      return item.recurrenceMonth === month
    default:
      return false
  }
}

export function getExpectedAmountForItem(
  item: ForecastItem,
  year: number,
  month: number,
  overrides: ForecastMonthOverride[],
): number | null {
  if (!itemAppliesToMonth(item, year, month)) return null

  const override = overrides.find(
    (entry) =>
      entry.forecastItemId === item.id &&
      entry.year === year &&
      entry.month === month,
  )

  return override?.expectedAmountOverride ?? item.expectedAmount
}

export function computeMembershipExpectedForMonth(
  schedules: BrotherMembershipSchedule[],
  year: number,
  month: number,
  membershipOverride?: MembershipForecastOverride,
): number {
  if (membershipOverride) {
    return membershipOverride.expectedAmountOverride
  }

  let total = 0
  for (const schedule of schedules) {
    const entry = schedule.entries.find(
      (candidate) => candidate.year === year && candidate.month === month,
    )
    if (entry) total += entry.expectedAmount
  }
  return total
}

export function transactionInMonth(
  transaction: Pick<Transaction, 'date'>,
  year: number,
  month: number,
): boolean {
  const [txYear, txMonth] = transaction.date.split('-').map(Number)
  return txYear === year && txMonth === month
}

export function buildDueDate(year: number, month: number, dueDay: number): string {
  const safeDay = Math.min(Math.max(dueDay, 1), 28)
  return `${year}-${String(month).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`
}

export function formatForecastMonthLabel(year: number, month: number): string {
  const name = MONTH_LABELS[month - 1] ?? String(month)
  return `${name}/${year}`
}

export function getForecastMonthRange(
  referenceDate: Date = new Date(),
  count: number = FORECAST_HORIZON_MONTHS,
): Array<{ year: number; month: number; label: string }> {
  const months: Array<{ year: number; month: number; label: string }> = []

  for (let offset = 0; offset < count; offset += 1) {
    const date = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth() + offset,
      1,
    )
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    months.push({ year, month, label: formatForecastMonthLabel(year, month) })
  }

  return months
}

export function computeLinkStatus(
  type: 'Receita' | 'Despesa',
  expectedAmount: number,
  realizedAmount: number,
): ForecastLinkStatus {
  if (realizedAmount <= 0) return 'pending'

  const tolerance = 0.01
  const diff = realizedAmount - expectedAmount

  if (Math.abs(diff) <= tolerance) return 'ok'

  if (type === 'Despesa') {
    return diff > 0 ? 'over' : 'under'
  }

  return diff > 0 ? 'over' : 'under'
}

export function computeVariance(
  type: 'Receita' | 'Despesa',
  expectedAmount: number,
  realizedAmount: number,
): number {
  if (type === 'Despesa') {
    return expectedAmount - realizedAmount
  }
  return realizedAmount - expectedAmount
}

function sumLinkedRealized(
  transactions: ForecastProjectionInput['transactions'],
  forecastItemId: string,
  year: number,
  month: number,
): number {
  return transactions
    .filter(
      (transaction) =>
        transaction.forecastItemId === forecastItemId &&
        transactionInMonth(transaction, year, month),
    )
    .reduce((sum, transaction) => sum + transaction.amount, 0)
}

function sumMembershipRealized(
  transactions: ForecastProjectionInput['transactions'],
  year: number,
  month: number,
): number {
  return transactions
    .filter(
      (transaction) =>
        transaction.type === 'Receita' &&
        isMembershipCategory(transaction.category) &&
        transactionInMonth(transaction, year, month),
    )
    .reduce((sum, transaction) => sum + transaction.amount, 0)
}

function getMonthCashFlowPeriod(year: number, month: number): CashFlowPeriod {
  const start = startOfMonth(new Date(year, month - 1, 1))
  return { start, end: endOfMonth(start) }
}

function toCashFlowBankAccounts(
  accounts: ForecastProjectionInput['accounts'],
): BankAccount[] {
  return accounts.map((account) => ({
    ...account,
    type: 'Corrente' as const,
  }))
}

/** Transação já contabilizada no previsto × realizado do planejamento. */
export function isTransactionCountedInForecastPlanning(
  transaction: Pick<Transaction, 'type' | 'category' | 'forecastItemId'>,
): boolean {
  if (transaction.forecastItemId) return true
  if (
    transaction.type === 'Receita' &&
    isMembershipCategory(transaction.category)
  ) {
    return true
  }
  return false
}

function buildUnplannedTransactions(
  transactions: ForecastProjectionInput['transactions'],
  year: number,
  month: number,
  accountNameById: Map<string, string>,
): ForecastUnplannedTransaction[] {
  return transactions
    .filter(
      (transaction) =>
        transactionInMonth(transaction, year, month) &&
        !isTransactionCountedInForecastPlanning(transaction),
    )
    .map((transaction) => ({
      id: transaction.id,
      date: transaction.date,
      description: transaction.description?.trim() || '—',
      category: transaction.category,
      type: transaction.type,
      amount: transaction.amount,
      accountId: transaction.accountId,
      accountName: transaction.accountId
        ? accountNameById.get(transaction.accountId)
        : undefined,
    }))
    .sort((left, right) => left.date.localeCompare(right.date))
}

function mapCashFlowAccountRow(
  summary: {
    accountId: string
    accountName: string
    periodIncome: number
    periodExpense: number
  },
): ForecastMonthCashFlowAccount {
  return {
    accountId: summary.accountId,
    accountName: summary.accountName,
    periodIncome: summary.periodIncome,
    periodExpense: summary.periodExpense,
    netCashFlow: summary.periodIncome - summary.periodExpense,
  }
}

function buildMonthCashFlow(
  input: ForecastProjectionInput,
  year: number,
  month: number,
): ForecastMonthCashFlow {
  const period = getMonthCashFlowPeriod(year, month)
  const bankAccounts = toCashFlowBankAccounts(input.accounts)
  const fullTransactions = input.transactions as Transaction[]
  const periodTransactions = filterTransactionsInPeriod(
    fullTransactions,
    period,
    'all',
  )
  const periodTotals = computePeriodTotals(periodTransactions)
  const accountSummaries = computeAllAccountsCashFlow(
    bankAccounts,
    fullTransactions,
    period,
  )
  const totalsRow = computeTotalsRow(accountSummaries)
  const accountNameById = new Map(
    input.accounts.map((account) => [account.id, account.name]),
  )
  const unplannedTransactions = buildUnplannedTransactions(
    input.transactions,
    year,
    month,
    accountNameById,
  )

  const unplannedIncome = unplannedTransactions
    .filter((transaction) => transaction.type === 'Receita')
    .reduce((sum, transaction) => sum + transaction.amount, 0)
  const unplannedExpense = unplannedTransactions
    .filter((transaction) => transaction.type === 'Despesa')
    .reduce((sum, transaction) => sum + transaction.amount, 0)

  return {
    accounts: accountSummaries.map(mapCashFlowAccountRow),
    totals: mapCashFlowAccountRow(totalsRow),
    cashFlowIncome: periodTotals.totalIncome,
    cashFlowExpense: periodTotals.totalExpense,
    cashFlowNet: periodTotals.netCashFlow,
    unplannedIncome,
    unplannedExpense,
    unplannedNet: unplannedIncome - unplannedExpense,
    unplannedTransactions,
  }
}

function computeAccountProjectionsTotals(
  projections: AccountProjectedBalance[],
): AccountProjectedBalance {
  return projections.reduce<AccountProjectedBalance>(
    (accumulator, row) => ({
      accountId: 'total',
      accountName: 'TOTAL GERAL',
      currentBalance: accumulator.currentBalance + row.currentBalance,
      expectedIncomeRemaining:
        accumulator.expectedIncomeRemaining + row.expectedIncomeRemaining,
      expectedExpenseRemaining:
        accumulator.expectedExpenseRemaining + row.expectedExpenseRemaining,
      projectedBalance: accumulator.projectedBalance + row.projectedBalance,
    }),
    {
      accountId: 'total',
      accountName: 'TOTAL GERAL',
      currentBalance: 0,
      expectedIncomeRemaining: 0,
      expectedExpenseRemaining: 0,
      projectedBalance: 0,
    },
  )
}

function buildItemRows(
  input: ForecastProjectionInput,
  year: number,
  month: number,
): ForecastComparisonRow[] {
  const rows: ForecastComparisonRow[] = []

  for (const item of input.items) {
    const expectedAmount = getExpectedAmountForItem(
      item,
      year,
      month,
      input.monthOverrides,
    )
    if (expectedAmount == null) continue

    const realizedAmount = sumLinkedRealized(
      input.transactions,
      item.id,
      year,
      month,
    )
    const hasLinkedTransactions = input.transactions.some(
      (transaction) =>
        transaction.forecastItemId === item.id &&
        transactionInMonth(transaction, year, month),
    )

    rows.push({
      id: `item-${item.id}-${year}-${month}`,
      kind: 'item',
      type: item.type,
      year,
      month,
      dueDate: buildDueDate(year, month, item.dueDay),
      description: item.description,
      categoryName: item.categoryName ?? 'Sem categoria',
      accountId: item.preferredAccountId ?? undefined,
      expectedAmount,
      realizedAmount,
      variance: computeVariance(item.type, expectedAmount, realizedAmount),
      linkStatus: computeLinkStatus(item.type, expectedAmount, realizedAmount),
      forecastItemId: item.id,
      hasLinkedTransactions,
    })
  }

  return rows.sort((a, b) => a.dueDate.localeCompare(b.dueDate))
}

function buildMembershipRow(
  input: ForecastProjectionInput,
  year: number,
  month: number,
): ForecastComparisonRow {
  const membershipOverride = input.membershipOverrides.find(
    (entry) => entry.year === year && entry.month === month,
  )
  const expectedAmount = computeMembershipExpectedForMonth(
    input.membershipSchedules,
    year,
    month,
    membershipOverride,
  )
  const realizedAmount = sumMembershipRealized(input.transactions, year, month)

  return {
    id: `membership-${year}-${month}`,
    kind: 'membership',
    type: 'Receita',
    year,
    month,
    dueDate: buildDueDate(year, month, 10),
    description: 'Mensalidades (cronograma)',
    categoryName: MEMBERSHIP_FORECAST_CATEGORY,
    expectedAmount,
    realizedAmount,
    variance: computeVariance('Receita', expectedAmount, realizedAmount),
    linkStatus: computeLinkStatus('Receita', expectedAmount, realizedAmount),
    hasLinkedTransactions: realizedAmount > 0,
  }
}

function summarizeMonth(rows: ForecastComparisonRow[]): {
  expectedIncome: number
  expectedExpense: number
  realizedIncome: number
  realizedExpense: number
} {
  let expectedIncome = 0
  let expectedExpense = 0
  let realizedIncome = 0
  let realizedExpense = 0

  for (const row of rows) {
    if (row.type === 'Receita') {
      expectedIncome += row.expectedAmount
      realizedIncome += row.realizedAmount
    } else {
      expectedExpense += row.expectedAmount
      realizedExpense += row.realizedAmount
    }
  }

  return {
    expectedIncome,
    expectedExpense,
    realizedIncome,
    realizedExpense,
  }
}

function computeRemainingNet(rows: ForecastComparisonRow[]): number {
  let remaining = 0

  for (const row of rows) {
    if (row.type === 'Receita') {
      remaining += Math.max(0, row.expectedAmount - row.realizedAmount)
    } else {
      remaining -= Math.max(0, row.expectedAmount - row.realizedAmount)
    }
  }

  return remaining
}

function buildAccountProjections(
  input: ForecastProjectionInput,
  months: ForecastMonthSummary[],
): AccountProjectedBalance[] {
  const currentBalances = new Map<string, number>()
  for (const account of input.accounts) {
    currentBalances.set(
      account.id,
      computeAccountBalance(account.initialBalance, account.id, input.transactions),
    )
  }

  const incomeRemaining = new Map<string, number>()
  const expenseRemaining = new Map<string, number>()

  for (const account of input.accounts) {
    incomeRemaining.set(account.id, 0)
    expenseRemaining.set(account.id, 0)
  }

  for (const monthSummary of months) {
    for (const row of monthSummary.rows) {
      const accountId = row.accountId
      if (!accountId) continue

      const remaining =
        row.type === 'Receita'
          ? Math.max(0, row.expectedAmount - row.realizedAmount)
          : Math.max(0, row.expectedAmount - row.realizedAmount)

      if (row.type === 'Receita') {
        incomeRemaining.set(
          accountId,
          (incomeRemaining.get(accountId) ?? 0) + remaining,
        )
      } else {
        expenseRemaining.set(
          accountId,
          (expenseRemaining.get(accountId) ?? 0) + remaining,
        )
      }
    }
  }

  return input.accounts.map((account) => {
    const currentBalance = currentBalances.get(account.id) ?? 0
    const expectedIncomeRemaining = incomeRemaining.get(account.id) ?? 0
    const expectedExpenseRemaining = expenseRemaining.get(account.id) ?? 0

    return {
      accountId: account.id,
      accountName: account.name,
      currentBalance,
      expectedIncomeRemaining,
      expectedExpenseRemaining,
      projectedBalance:
        currentBalance + expectedIncomeRemaining - expectedExpenseRemaining,
    }
  })
}

export function buildForecastProjection(
  input: ForecastProjectionInput,
): ForecastProjectionResult {
  const referenceDate = input.referenceDate ?? new Date()
  const horizonMonths = input.horizonMonths ?? FORECAST_HORIZON_MONTHS
  const monthRange = getForecastMonthRange(referenceDate, horizonMonths)

  const months: ForecastMonthSummary[] = monthRange.map(({ year, month, label }) => {
    const itemRows = buildItemRows(input, year, month)
    const membershipRow = buildMembershipRow(input, year, month)
    const rows = [...itemRows, membershipRow].sort((a, b) =>
      a.dueDate.localeCompare(b.dueDate),
    )
    const totals = summarizeMonth(rows)
    const cashFlow = buildMonthCashFlow(input, year, month)

    return {
      year,
      month,
      label,
      expectedIncome: totals.expectedIncome,
      expectedExpense: totals.expectedExpense,
      realizedIncome: totals.realizedIncome,
      realizedExpense: totals.realizedExpense,
      netExpected: totals.expectedIncome - totals.expectedExpense,
      netRealized: totals.realizedIncome - totals.realizedExpense,
      cashFlow,
      rows,
    }
  })

  const globalCurrentBalance = computeGlobalBalance(
    input.accounts,
    input.transactions,
  )
  const globalRemainingNet = months.reduce(
    (sum, monthSummary) => sum + computeRemainingNet(monthSummary.rows),
    0,
  )
  const accountProjections = buildAccountProjections(input, months)
  const accountProjectionsTotals = computeAccountProjectionsTotals(accountProjections)

  return {
    months,
    accountProjections,
    accountProjectionsTotals,
    globalCurrentBalance,
    globalProjectedBalance: globalCurrentBalance + globalRemainingNet,
  }
}

export function filterForecastRows(
  rows: ForecastComparisonRow[],
  options: {
    search?: string
    type?: 'all' | 'Receita' | 'Despesa'
    status?: 'all' | ForecastLinkStatus | 'economy'
  },
): ForecastComparisonRow[] {
  const search = options.search?.trim().toLowerCase() ?? ''

  return rows.filter((row) => {
    if (options.type && options.type !== 'all' && row.type !== options.type) {
      return false
    }
    if (options.status === 'economy' && !isForecastEconomyRow(row)) {
      return false
    }
    if (
      options.status &&
      options.status !== 'all' &&
      options.status !== 'economy' &&
      row.linkStatus !== options.status
    ) {
      return false
    }
    if (!search) return true

    return (
      row.description.toLowerCase().includes(search) ||
      row.categoryName.toLowerCase().includes(search)
    )
  })
}

/** Despesa realizada abaixo do previsto (economia). */
export function isForecastEconomyRow(row: ForecastComparisonRow): boolean {
  return row.type === 'Despesa' && row.variance > 0.01 && row.realizedAmount > 0
}

export function computeMonthEconomyTotal(rows: ForecastComparisonRow[]): number {
  return rows
    .filter(isForecastEconomyRow)
    .reduce((sum, row) => sum + row.variance, 0)
}

export function getForecastRowStatusLabel(row: ForecastComparisonRow): string {
  if (isForecastEconomyRow(row)) return 'Economia'

  switch (row.linkStatus) {
    case 'pending':
      return 'Pendente'
    case 'ok':
      return 'OK'
    case 'over':
      return row.type === 'Despesa' ? 'Acima do previsto' : 'Acima do previsto'
    case 'under':
      return row.type === 'Receita' ? 'Abaixo do previsto' : 'Abaixo do previsto'
    default:
      return row.linkStatus
  }
}

export function paginateRows<T>(rows: T[], page: number, pageSize: number): T[] {
  const safePage = Math.max(1, page)
  const start = (safePage - 1) * pageSize
  return rows.slice(start, start + pageSize)
}

export function totalPages(rowCount: number, pageSize: number): number {
  if (rowCount <= 0) return 1
  return Math.ceil(rowCount / pageSize)
}
