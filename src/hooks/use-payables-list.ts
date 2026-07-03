import { useCallback, useEffect, useRef, useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { logError } from '@/lib/logger'
import { toError } from '@/lib/async-utils'
import { fetchFinancialPayables } from '@/lib/financial-payables-api'
import type { FinancialPayable, PayableStatus } from '@/lib/financial-payable-types'

export type PayablesStatusFilter = 'open' | PayableStatus | 'all'

const LOAD_ERROR_MESSAGE = 'Falha ao carregar contas a pagar.'
const ERROR_TOAST_COOLDOWN_MS = 4000

export function usePayablesList(statusFilter: PayablesStatusFilter) {
  const { toast } = useToast()
  const [payables, setPayables] = useState<FinancialPayable[]>([])
  const [loading, setLoading] = useState(false)
  const requestIdRef = useRef(0)
  const statusFilterRef = useRef(statusFilter)
  const lastErrorToastAtRef = useRef(0)

  statusFilterRef.current = statusFilter

  const reload = useCallback(async () => {
    const requestId = ++requestIdRef.current
    setLoading(true)

    try {
      const filter = statusFilterRef.current
      const data = await fetchFinancialPayables({
        status: filter === 'all' ? 'all' : filter,
      })

      if (requestId !== requestIdRef.current) return
      setPayables(data)
    } catch (err) {
      if (requestId !== requestIdRef.current) return

      const errorObj = toError(err, LOAD_ERROR_MESSAGE)
      logError('Failed to load payables', errorObj)

      const now = Date.now()
      if (now - lastErrorToastAtRef.current >= ERROR_TOAST_COOLDOWN_MS) {
        lastErrorToastAtRef.current = now
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: errorObj.message,
        })
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false)
      }
    }
  }, [toast])

  useEffect(() => {
    void reload()
  }, [statusFilter, reload])

  return { payables, loading, reload }
}
