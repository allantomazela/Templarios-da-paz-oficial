export type ForecastRecurrence = 'monthly' | 'annual' | 'once'

export interface ForecastItem {
  id: string
  description: string
  type: 'Receita' | 'Despesa'
  categoryId: string | null
  categoryName?: string
  expectedAmount: number
  dueDay: number
  recurrence: ForecastRecurrence
  recurrenceMonth: number | null
  preferredAccountId: string | null
  preferredAccountName?: string
  isActive: boolean
  notes?: string
  sortOrder: number
}

export interface ForecastMonthOverride {
  id: string
  forecastItemId: string
  year: number
  month: number
  expectedAmountOverride: number
  notes?: string
}

export interface MembershipForecastOverride {
  id: string
  year: number
  month: number
  expectedAmountOverride: number
  notes?: string
}

export type ForecastRowKind = 'item' | 'membership'

export type ForecastLinkStatus = 'pending' | 'ok' | 'over' | 'under'

export interface ForecastComparisonRow {
  id: string
  kind: ForecastRowKind
  type: 'Receita' | 'Despesa'
  year: number
  month: number
  dueDate: string
  description: string
  categoryName: string
  accountId?: string
  expectedAmount: number
  realizedAmount: number
  /** Positivo = abaixo do previsto em despesa (economia) ou acima em receita. */
  variance: number
  linkStatus: ForecastLinkStatus
  forecastItemId?: string
  hasLinkedTransactions: boolean
}

export interface ForecastMonthSummary {
  year: number
  month: number
  label: string
  expectedIncome: number
  expectedExpense: number
  realizedIncome: number
  realizedExpense: number
  netExpected: number
  netRealized: number
  rows: ForecastComparisonRow[]
}

export interface AccountProjectedBalance {
  accountId: string
  accountName: string
  currentBalance: number
  expectedIncomeRemaining: number
  expectedExpenseRemaining: number
  projectedBalance: number
}

export interface ForecastProjectionResult {
  months: ForecastMonthSummary[]
  accountProjections: AccountProjectedBalance[]
  globalProjectedBalance: number
  globalCurrentBalance: number
}
