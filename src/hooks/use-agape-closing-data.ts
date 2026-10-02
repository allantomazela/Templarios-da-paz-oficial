import { useEffect, useState } from 'react'
import type { AgapeBrotherCharge, AgapeMonthlyClosing } from '@/lib/data'
import { useAsyncOperation } from '@/hooks/use-async-operation'
import useAgapeStore from '@/stores/useAgapeStore'
import {
  fetchAgapeChargesForMonth,
  fetchAgapeMonthlyClosing,
  fetchLiveConsumptionTotals,
  type AgapeConsumptionTotalRow,
} from '@/lib/agape-payments'

/**
 * Carrega o fechamento do ágape do mês (cobranças, total informado e consumo
 * lançado no módulo Ágape) e recarrega ao voltar para a aba do navegador.
 */
export function useAgapeClosingData(selectedMonth: number, selectedYear: number) {
  const [charges, setCharges] = useState<AgapeBrotherCharge[]>([])
  const [brotherNames, setBrotherNames] = useState<Record<string, string>>({})
  const [closing, setClosing] = useState<AgapeMonthlyClosing | null>(null)
  const [liveTotal, setLiveTotal] = useState<number | null>(null)
  const [liveConsumptionRows, setLiveConsumptionRows] = useState<
    AgapeConsumptionTotalRow[]
  >([])
  const [loading, setLoading] = useState(true)
  const [totalBeveragesInput, setTotalBeveragesInput] = useState('')

  const loadData = useAsyncOperation(
    async () => {
      setLoading(true)
      setClosing(null)
      setCharges([])
      setBrotherNames({})
      setLiveConsumptionRows([])
      setLiveTotal(0)
      setTotalBeveragesInput('')
      try {
        const [closingData, chargesData, consumptionTotals] = await Promise.all([
          fetchAgapeMonthlyClosing(selectedMonth, selectedYear),
          fetchAgapeChargesForMonth(selectedMonth, selectedYear),
          fetchLiveConsumptionTotals(selectedMonth, selectedYear),
        ])

        setClosing(closingData)
        setCharges(chargesData.charges)
        setBrotherNames(chargesData.brotherNames)
        setLiveConsumptionRows(consumptionTotals)
        setTotalBeveragesInput(
          closingData?.totalBeveragesSpent != null
            ? String(closingData.totalBeveragesSpent)
            : '',
        )
        setLiveTotal(
          consumptionTotals.reduce(
            (sum, r) => sum + Number(r.total_amount),
            0,
          ),
        )
      } finally {
        setLoading(false)
      }
    },
    {
      showSuccessToast: false,
      errorMessage: 'Falha ao carregar fechamento do ágape.',
    },
  )

  useEffect(() => {
    useAgapeStore.getState().clearOperationalCache()
    loadData.execute()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedYear])

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        loadData.execute()
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedYear])

  return {
    charges,
    brotherNames,
    closing,
    liveTotal,
    liveConsumptionRows,
    loading,
    totalBeveragesInput,
    setTotalBeveragesInput,
    reload: loadData.execute,
  }
}
