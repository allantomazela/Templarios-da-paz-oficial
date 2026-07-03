import type { Transaction } from '@/lib/data'

export type TransactionPeriodMode = 'all' | 'day' | 'month' | 'year'

export interface TransactionListFilterState {
  searchTerm: string
  periodMode: TransactionPeriodMode
  filterDate: string
  filterMonth: number
  filterYear: number
  category: string
  accountId: string
  brotherName: string
}

export function createDefaultTransactionListFilters(
  referenceDate = new Date(),
): TransactionListFilterState {
  return {
    searchTerm: '',
    periodMode: 'all',
    filterDate: referenceDate.toISOString().slice(0, 10),
    filterMonth: referenceDate.getMonth() + 1,
    filterYear: referenceDate.getFullYear(),
    category: 'all',
    accountId: 'all',
    brotherName: 'all',
  }
}

export const DEFAULT_TRANSACTION_LIST_FILTERS = createDefaultTransactionListFilters()

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function matchesTransactionSearch(
  transaction: Transaction,
  searchTerm: string,
  accountNames: Record<string, string>,
): boolean {
  const query = normalizeText(searchTerm)
  if (!query) return true

  const accountName = transaction.accountId
    ? accountNames[transaction.accountId] ?? ''
    : ''

  return (
    normalizeText(transaction.description).includes(query) ||
    normalizeText(transaction.category).includes(query) ||
    normalizeText(accountName).includes(query) ||
    String(transaction.amount).includes(query.replace(',', '.'))
  )
}

export function matchesTransactionPeriod(
  dateValue: string,
  filters: Pick<
    TransactionListFilterState,
    'periodMode' | 'filterDate' | 'filterMonth' | 'filterYear'
  >,
): boolean {
  if (filters.periodMode === 'all') return true
  if (!dateValue) return false

  const [year, month, day] = dateValue.split('-').map(Number)
  if (!year || !month) return false

  switch (filters.periodMode) {
    case 'day':
      return dateValue === filters.filterDate
    case 'month':
      return month === filters.filterMonth && year === filters.filterYear
    case 'year':
      return year === filters.filterYear
    default:
      return true
  }
}

export function matchesTransactionBrother(
  description: string,
  brotherName: string,
): boolean {
  if (brotherName === 'all') return true
  return normalizeText(description).includes(normalizeText(brotherName))
}

export function filterTransactions(
  transactions: Transaction[],
  filters: TransactionListFilterState,
  accountNames: Record<string, string>,
): Transaction[] {
  return transactions.filter((transaction) => {
    if (!matchesTransactionSearch(transaction, filters.searchTerm, accountNames)) {
      return false
    }

    if (!matchesTransactionPeriod(transaction.date, filters)) {
      return false
    }

    if (filters.category !== 'all' && transaction.category !== filters.category) {
      return false
    }

    if (filters.accountId !== 'all' && transaction.accountId !== filters.accountId) {
      return false
    }

    if (
      !matchesTransactionBrother(transaction.description, filters.brotherName)
    ) {
      return false
    }

    return true
  })
}

export function collectTransactionCategories(transactions: Transaction[]): string[] {
  return [...new Set(transactions.map((item) => item.category || 'Sem categoria'))].sort(
    (left, right) => left.localeCompare(right, 'pt-BR'),
  )
}

export function hasActiveTransactionFilters(
  filters: TransactionListFilterState,
): boolean {
  return (
    filters.searchTerm.trim().length > 0 ||
    filters.periodMode !== 'all' ||
    filters.category !== 'all' ||
    filters.accountId !== 'all' ||
    filters.brotherName !== 'all'
  )
}

export function countActiveTransactionFilters(
  filters: TransactionListFilterState,
): number {
  let count = 0
  if (filters.searchTerm.trim()) count++
  if (filters.periodMode !== 'all') count++
  if (filters.category !== 'all') count++
  if (filters.accountId !== 'all') count++
  if (filters.brotherName !== 'all') count++
  return count
}

export function buildTransactionFilterSummary(
  filters: TransactionListFilterState,
  accountNames: Record<string, string>,
): string {
  const parts: string[] = []

  if (filters.periodMode === 'day' && filters.filterDate) {
    parts.push(`dia ${filters.filterDate.split('-').reverse().join('/')}`)
  } else if (filters.periodMode === 'month') {
    parts.push(
      `mês ${String(filters.filterMonth).padStart(2, '0')}/${filters.filterYear}`,
    )
  } else if (filters.periodMode === 'year') {
    parts.push(`ano ${filters.filterYear}`)
  }

  if (filters.category !== 'all') parts.push(`categoria ${filters.category}`)
  if (filters.accountId !== 'all') {
    parts.push(`conta ${accountNames[filters.accountId] ?? 'selecionada'}`)
  }
  if (filters.brotherName !== 'all') parts.push(`irmão ${filters.brotherName}`)
  if (filters.searchTerm.trim()) parts.push(`busca "${filters.searchTerm.trim()}"`)

  return parts.join(' · ')
}
