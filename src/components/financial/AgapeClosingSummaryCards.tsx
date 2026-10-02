import type { ReactNode } from 'react'
import { Lock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { AgapeClosingSummary } from '@/lib/agape-closing-summary'
import { formatCurrencyBRL } from '@/lib/format-utils'

interface AgapeClosingSummaryCardsProps {
  summary: AgapeClosingSummary
  chargesCount: number
  liveTotal: number | null
}

export function AgapeClosingSummaryCards({
  summary,
  chargesCount,
  liveTotal,
}: AgapeClosingSummaryCardsProps) {
  const { totalBeverages, brothersTotal, totalPaid, remainingBalance, totalPending, isClosed } =
    summary
  const remainingSettled = totalBeverages > 0 && remainingBalance <= 0.009

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <SummaryCard
        label="Total das bebidas"
        value={totalBeverages > 0 ? formatCurrencyBRL(totalBeverages) : '—'}
        footer="Valor informado no fechamento"
      />
      <SummaryCard
        label="Soma dos irmãos"
        value={formatCurrencyBRL(brothersTotal)}
        footer={
          <>
            {chargesCount} irmão(s)
            {liveTotal != null && liveTotal > 0 && (
              <> · sistema: {formatCurrencyBRL(liveTotal)}</>
            )}
          </>
        }
      />
      <SummaryCard
        label="Já recebido"
        value={formatCurrencyBRL(totalPaid)}
        valueClassName="text-green-600"
        footer="Pagamentos confirmados"
      />
      <SummaryCard
        label="Saldo restante"
        value={totalBeverages > 0 ? formatCurrencyBRL(remainingBalance) : '—'}
        valueClassName={remainingSettled ? 'text-green-600' : 'text-amber-600'}
        footer="Total das bebidas − recebido"
      />
      <SummaryCard
        label="A receber"
        value={formatCurrencyBRL(totalPending)}
        valueClassName="text-amber-600"
        footer={
          isClosed ? (
            <Badge variant="outline" className="gap-1">
              <Lock className="h-3 w-3" /> Encerrado
            </Badge>
          ) : (
            <Badge variant="outline">Em aberto</Badge>
          )
        }
      />
    </div>
  )
}

function SummaryCard({
  label,
  value,
  valueClassName,
  footer,
}: {
  label: string
  value: string
  valueClassName?: string
  footer: ReactNode
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className={valueClassName ? `text-2xl ${valueClassName}` : 'text-2xl'}>
          {value}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground">{footer}</CardContent>
    </Card>
  )
}
