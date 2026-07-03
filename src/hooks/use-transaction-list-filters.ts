import { useEffect, useMemo, useState } from 'react'
import type { BankAccount, Transaction } from '@/lib/data'
import { fetchBrothers } from '@/lib/brothers-api'
import { fetchLinkedMembershipTransactionIds } from '@/lib/contribution-payments'
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
  /** Habilita filtro de receitas de mensalidade sem vínculo no cronograma. */
  enableMembershipLinkFilter?: boolean
}

export function useTransactionListFilters({
  transactions,
  accounts,
  accountNames,
  enableMembershipLinkFilter = false,
}: UseTransactionListFiltersOptions) {
  const [filters, setFilters] = useState<TransactionListFilterState>(() =>
    createDefaultTransactionListFilters(),
  )
  const [brothers, setBrothers] = useState<BrotherOption[]>([])
  const [brothersLoading, setBrothersLoading] = useState(true)
  const [linkedMembershipTransactionIds, setLinkedMembershipTransactionIds] =
    useState<Set<string> | undefined>(undefined)
  const [membershipLinksLoading, setMembershipLinksLoading] = useState(false)

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

  useEffect(() => {
    if (!enableMembershipLinkFilter) {
      setLinkedMembershipTransactionIds(undefined)
      return
    }

    let isMounted = true

    const loadMembershipLinks = async () => {
      setMembershipLinksLoading(true)
      try {
        const linkedIds = await fetchLinkedMembershipTransactionIds()
        if (!isMounted) return
        setLinkedMembershipTransactionIds(linkedIds)
      } catch {
        if (isMounted) setLinkedMembershipTransactionIds(new Set())
      } finally {
        if (isMounted) setMembershipLinksLoading(false)
      }
    }

    void loadMembershipLinks()
    return () => {
      isMounted = false
    }
  }, [enableMembershipLinkFilter, transactions])

  const categories = useMemo(
    () => collectTransactionCategories(transactions),
    [transactions],
  )

  const filteredTransactions = useMemo(
    () =>
      filterTransactions(
        transactions,
        filters,
        accountNames,
        linkedMembershipTransactionIds,
      ),
    [transactions, filters, accountNames, linkedMembershipTransactionIds],
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
    membershipLinksLoading,
    hasActiveFilters,
  }
}
