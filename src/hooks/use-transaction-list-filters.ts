import { useEffect, useMemo, useState } from 'react'
import type { BankAccount, Transaction } from '@/lib/data'
import { fetchBrothers } from '@/lib/brothers-api'
import {
  collectTransactionCategories,
  createDefaultTransactionListFilters,
  filterTransactions,
  hasActiveTransactionFilters,
  type TransactionListFilterState,
} from '@/lib/transaction-list-filters'

interface BrotherOption {
  id: string
  name: string
}

interface UseTransactionListFiltersOptions {
  transactions: Transaction[]
  accounts: BankAccount[]
  accountNames: Record<string, string>
}

export function useTransactionListFilters({
  transactions,
  accounts,
  accountNames,
}: UseTransactionListFiltersOptions) {
  const [filters, setFilters] = useState<TransactionListFilterState>(() =>
    createDefaultTransactionListFilters(),
  )
  const [brothers, setBrothers] = useState<BrotherOption[]>([])
  const [brothersLoading, setBrothersLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const loadBrothers = async () => {
      setBrothersLoading(true)
      try {
        const rows = await fetchBrothers()
        if (!isMounted) return
        setBrothers(
          rows
            .map((brother) => ({ id: brother.id, name: brother.name.trim() }))
            .filter((brother) => brother.name.length > 0)
            .sort((left, right) => left.name.localeCompare(right.name, 'pt-BR')),
        )
      } catch {
        if (isMounted) setBrothers([])
      } finally {
        if (isMounted) setBrothersLoading(false)
      }
    }

    void loadBrothers()
    return () => {
      isMounted = false
    }
  }, [])

  const categories = useMemo(
    () => collectTransactionCategories(transactions),
    [transactions],
  )

  const filteredTransactions = useMemo(
    () => filterTransactions(transactions, filters, accountNames),
    [transactions, filters, accountNames],
  )

  const hasActiveFilters = hasActiveTransactionFilters(filters)

  const resetFilters = () => {
    setFilters(createDefaultTransactionListFilters())
  }

  const updateFilters = (patch: Partial<TransactionListFilterState>) => {
    setFilters((current) => ({ ...current, ...patch }))
  }

  return {
    filters,
    setFilters,
    updateFilters,
    resetFilters,
    filteredTransactions,
    categories,
    accounts,
    brothers,
    brothersLoading,
    hasActiveFilters,
  }
}
