import { AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import type { AgapeClosingSummary } from '@/lib/agape-closing-summary'
import { formatCurrencyBRL } from '@/lib/format-utils'

interface AgapeClosingStatusAlertsProps {
  summary: AgapeClosingSummary
  liveTotal: number | null
}

/** Avisos de divergência e pendência exibidos enquanto o mês está aberto. */
export function AgapeClosingStatusAlerts({
  summary,
  liveTotal,
}: AgapeClosingStatusAlertsProps) {
  const {
    isClosed,
    beveragesVsConsumptionMismatch,
    pendingCount,
    totalPending,
    totalBeverages,
    needsImport,
    brothersTotal,
  } = summary

  if (isClosed) return null

  return (
    <>
      {beveragesVsConsumptionMismatch && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Consumo não confere com o total das bebidas</AlertTitle>
          <AlertDescription>
            O consumo lançado no Ágape ({formatCurrencyBRL(liveTotal!)}) difere do
            total informado ({formatCurrencyBRL(totalBeverages)}). Ajuste o valor
            das bebidas ou confira os lançamentos no módulo Ágape.
          </AlertDescription>
        </Alert>
      )}

      {pendingCount > 0 && !beveragesVsConsumptionMismatch && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Pagamentos em andamento</AlertTitle>
          <AlertDescription className="text-amber-900">
            {pendingCount} irmão(s) ainda não acertou o consumo ({formatCurrencyBRL(totalPending)}{' '}
            pendente). Use <strong>Registrar pagamento</strong> ou edite cada linha
            conforme os PIX forem chegando.
          </AlertDescription>
        </Alert>
      )}

      {needsImport && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Consumos do Ágape não importados</AlertTitle>
          <AlertDescription>
            Há {formatCurrencyBRL(liveTotal!)} lançados no Ágape neste mês, mas o
            fechamento tem {formatCurrencyBRL(brothersTotal)}. Clique em{' '}
            <strong>Importar consumos do mês</strong> para sincronizar.
          </AlertDescription>
        </Alert>
      )}
    </>
  )
}
