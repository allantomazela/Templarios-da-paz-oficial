import { useEffect, useRef, useState } from 'react'
import type { BankAccount, Transaction } from '@/lib/data'
import useFinancialStore from '@/stores/useFinancialStore'

interface UseFinancialCoreDataResult {
  accounts: BankAccount[]
  transactions: Transaction[]
  loading: boolean
  dataRevision: number
}

/**
 * Contas e transações compartilhadas entre Fluxo de Caixa, conferência e relatórios.
 * Recarrega do banco quando dataRevision muda (ex.: ajustes na auditoria).
 */
export function useFinancialCoreData(): UseFinancialCoreDataResult {
  const accounts = useFinancialStore((state) => state.accounts)
  const transactions = useFinancialStore((state) => state.transactions)
  const storeLoading = useFinancialStore((state) => state.loading)
  const dataRevision = useFinancialStore((state) => state.dataRevision)
  const [loading, setLoading] = useState(
    accounts.length === 0 && transactions.length === 0,
  )
  const requestSeq = useRef(0)

  useEffect(() => {
    const requestId = ++requestSeq.current
    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        await useFinancialStore.getState().refreshFinancialCoreData(false)
      } finally {
        if (!cancelled && requestId === requestSeq.current) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [dataRevision])

  const isLoading =
    loading || (storeLoading && accounts.length === 0 && transactions.length === 0)

  return {
    accounts,
    transactions,
    loading: isLoading,
    dataRevision,
  }
}
