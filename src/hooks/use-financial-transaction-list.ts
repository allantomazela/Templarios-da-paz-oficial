import { useEffect, useMemo, useRef, useState } from 'react'
import type { BankAccount, Transaction } from '@/lib/data'
import { withTimeout } from '@/lib/async-utils'
import { logError } from '@/lib/logger'
import { fetchFinancialAccountsAndTransactions } from '@/lib/financial-balances'
import { fetchAttachmentCountsByTransaction } from '@/lib/financial-attachments'
import {
  loadTransactionsByType,
  type FinancialTransactionType,
} from '@/lib/financial-transaction-api'
import { useFinancialAttachmentAccess } from '@/hooks/use-financial-attachment-access'
import { useToast } from '@/hooks/use-toast'
import useFinancialStore from '@/stores/useFinancialStore'

const LIST_LOAD_TIMEOUT_MS = 30_000

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
  const canManageAttachments = useFinancialAttachmentAccess()
  const { toast } = useToast()
  const requestSeq = useRef(0)

  useEffect(() => {
    const requestId = ++requestSeq.current
    let cancelled = false

    const loadCore = async () => {
      setLoading(true)
      try {
        const [{ transactions: rows, accountNames: namesById }, cashData] =
          await withTimeout(
            Promise.all([
              loadTransactionsByType(type),
              fetchFinancialAccountsAndTransactions(),
            ]),
            LIST_LOAD_TIMEOUT_MS,
            'Carregamento demorou demais. Verifique sua conexão.',
          )

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
  }, [dataRevision, type, toast])

  const transactionIdsKey = useMemo(
    () => transactions.map((transaction) => transaction.id).join(','),
    [transactions],
  )

  useEffect(() => {
    if (!canManageAttachments || !transactionIdsKey) return

    let cancelled = false
    const transactionIds = transactionIdsKey.split(',')

    void fetchAttachmentCountsByTransaction(transactionIds)
      .then((counts) => {
        if (cancelled) return
        setTransactions((current) =>
          current.map((transaction) => ({
            ...transaction,
            attachmentCount: counts[transaction.id] ?? 0,
          })),
        )
      })
      .catch((error) => {
        logError(`useFinancialTransactionList attachment counts (${type})`, error)
      })

    return () => {
      cancelled = true
    }
  }, [canManageAttachments, transactionIdsKey, type])

  return {
    transactions,
    accounts,
    allTransactions,
    accountNames,
    loading,
  }
}
