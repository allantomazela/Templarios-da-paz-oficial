import { useEffect, useRef, useState } from 'react'
import type { BankAccount, Transaction } from '@/lib/data'
import { logError } from '@/lib/logger'
import { fetchFinancialAccountsAndTransactions } from '@/lib/financial-balances'
import {
  loadTransactionsByType,
  type FinancialTransactionType,
} from '@/lib/financial-transaction-api'
import { toast } from '@/hooks/use-toast'
import useFinancialStore from '@/stores/useFinancialStore'

interface UseFinancialTransactionListResult {
  transactions: Transaction[]
  accounts: BankAccount[]
  allTransactions: Transaction[]
  accountNames: Record<string, string>
  loading: boolean
}

export function useFinancialTransactionList(
  type: FinancialTransactionType,
): UseFinancialTransactionListResult {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([])
  const [accountNames, setAccountNames] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const dataRevision = useFinancialStore((state) => state.dataRevision)
  const requestSeq = useRef(0)

  useEffect(() => {
    const requestId = ++requestSeq.current
    let cancelled = false

    const loadCore = async () => {
      setLoading(true)
      try {
        const [{ transactions: rows, accountNames: namesById }, cashData] =
          await Promise.all([
            loadTransactionsByType(type),
            fetchFinancialAccountsAndTransactions(),
          ])

        if (cancelled || requestId !== requestSeq.current) return

        setAccountNames(namesById)
        setTransactions(rows)
        setAccounts(cashData.accounts)
        setAllTransactions(cashData.transactions)
      } catch (error) {
        if (cancelled || requestId !== requestSeq.current) return
        logError(`useFinancialTransactionList(${type})`, error)
        toast({
          title: 'Erro',
          description:
            error instanceof Error
              ? error.message
              : `Falha ao carregar ${type === 'Despesa' ? 'despesas' : 'receitas'}.`,
          variant: 'destructive',
        })
      } finally {
        if (!cancelled && requestId === requestSeq.current) {
          setLoading(false)
        }
      }
    }

    void loadCore()

    return () => {
      cancelled = true
    }
  }, [dataRevision, type])

  return {
    transactions,
    accounts,
    allTransactions,
    accountNames,
    loading,
  }
}
