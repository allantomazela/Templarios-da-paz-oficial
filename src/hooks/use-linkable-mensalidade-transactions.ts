import { useEffect, useState } from 'react'
import {
  fetchLinkableMensalidadeTransactions,
  type LinkableMensalidadeTransaction,
} from '@/lib/contribution-payments'
import { contributionMonthNameToNumber } from '@/lib/contribution-form-schema'

interface LinkableMensalidadeParams {
  /** Só busca quando o formulário está aberto em "Pago" + "Vincular receita existente". */
  enabled: boolean
  brotherName?: string
  monthName?: string
  year: number
}

/** Receitas de mensalidade já lançadas no caixa que podem ser vinculadas ao mês. */
export function useLinkableMensalidadeTransactions({
  enabled,
  brotherName,
  monthName,
  year,
}: LinkableMensalidadeParams) {
  const [transactions, setTransactions] = useState<LinkableMensalidadeTransaction[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!enabled) {
      setTransactions([])
      return
    }
    if (!brotherName || !monthName) return

    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        const rows = await fetchLinkableMensalidadeTransactions({
          brotherName,
          referenceMonth: contributionMonthNameToNumber(monthName),
          referenceYear: year,
        })
        if (!cancelled) setTransactions(rows)
      } catch (error) {
        console.error('Erro ao carregar receitas vinculáveis:', error)
        if (!cancelled) setTransactions([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [enabled, brotherName, monthName, year])

  return { transactions, loading }
}
