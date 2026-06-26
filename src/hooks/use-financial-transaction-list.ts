import { useEffect, useRef, useState } from 'react'
import type { BankAccount, Transaction } from '@/lib/data'
import { logError } from '@/lib/logger'
import { fetchFinancialAccountsAndTransactions } from '@/lib/financial-balances'
import { fetchAttachmentCountsByTransaction } from '@/lib/financial-attachments'
import {
  type FinancialTransactionType,
} from '@/lib/financial-transaction-api'
import { toast } from '@/hooks/use-toast'
import useFinancialStore from '@/stores/useFinancialStore'

interface UseFinancialTransactionListOptions {
  /** Carrega contagem de comprovantes (tesoureiro/admin). */
  includeAttachmentCounts?: boolean
}

interface UseFinancialTransactionListResult {
  transactions: Transaction[]
  accounts: BankAccount[]
  allTransactions: Transaction[]
  accountNames: Record<string, string>
  loading: boolean
}

export function useFinancialTransactionList(
  type: FinancialTransactionType,
  options: UseFinancialTransactionListOptions = {},
): UseFinancialTransactionListResult {
  const { includeAttachmentCounts = false } = options
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
        const { accounts: accountsData, transactions: allTx } =
          await fetchFinancialAccountsAndTransactions()

        if (cancelled || requestId !== requestSeq.current) return

        const namesById: Record<string, string> = {}
        for (const account of accountsData) {
          namesById[account.id] = account.name
        }

        const typed = allTx
          .filter((item) => item.type === type)
          .map((item) => ({
            ...item,
            category: item.category || 'Sem categoria',
          }))

        if (includeAttachmentCounts && typed.length > 0) {
          const counts = await fetchAttachmentCountsByTransaction(
            typed.map((item) => item.id),
          )
          for (const transaction of typed) {
            transaction.attachmentCount = counts[transaction.id] ?? 0
          }
        }

        if (cancelled || requestId !== requestSeq.current) return

        setAccountNames(namesById)
        setTransactions(typed)
        setAccounts(accountsData)
        setAllTransactions(allTx)
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
  }, [dataRevision, type, includeAttachmentCounts])

  return {
    transactions,
    accounts,
    allTransactions,
    accountNames,
    loading,
  }
}
