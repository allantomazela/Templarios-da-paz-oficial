import { Scale, CheckCircle2, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrencyBRL } from '@/lib/format-utils'
import type { CashReconciliationSummary } from '@/lib/account-reconciliation-difference-causes'
import { cn } from '@/lib/utils'

interface CashReconciliationSummaryProps {
  summary: CashReconciliationSummary
}

export function CashReconciliationSummaryCard({
  summary,
}: CashReconciliationSummaryProps) {
  const hasExtrato = summary.accountsWithExtrato > 0
  const matched =
    hasExtrato &&
    summary.accountsWithDifference === 0 &&
    summary.allInformedMatched

  return (
    <Card
      className={cn(
        matched
          ? 'border-green-200 bg-green-50/60 dark:border-green-900 dark:bg-green-950/20'
          : hasExtrato
            ? 'border-amber-200 bg-amber-50/40 dark:border-amber-900 dark:bg-amber-950/10'
            : undefined,
      )}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          {matched ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : hasExtrato ? (
            <AlertCircle className="h-5 w-5 text-amber-600" />
          ) : (
            <Scale className="h-5 w-5 text-muted-foreground" />
          )}
          Conferência de caixa
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryMetric
            label="Saldo no sistema (total)"
            value={formatCurrencyBRL(summary.totalSystemBalance)}
          />
          <SummaryMetric
            label="Saldo no extrato (informado)"
            value={
              summary.totalRealBalance !== null
                ? formatCurrencyBRL(summary.totalRealBalance)
                : '—'
            }
          />
          <SummaryMetric
            label="Diferença total"
            value={
              summary.totalDifference !== null
                ? formatCurrencyBRL(summary.totalDifference)
                : '—'
            }
            highlight={
              summary.totalDifference !== null &&
              Math.abs(summary.totalDifference) >= 0.01
            }
          />
          <SummaryMetric
            label="Contas conferidas"
            value={
              hasExtrato
                ? `${summary.accountsMatched} de ${summary.accountsWithExtrato}`
                : 'Informe o extrato'
            }
            sub={
              summary.accountsWithDifference > 0
                ? `${summary.accountsWithDifference} com divergência`
                : hasExtrato
                  ? 'Todas batem'
                  : undefined
            }
          />
        </div>
      </CardContent>
    </Card>
  )
}

function SummaryMetric({
  label,
  value,
  sub,
  highlight = false,
}: {
  label: string
  value: string
  sub?: string
  highlight?: boolean
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          'text-lg font-semibold tabular-nums',
          highlight && 'text-amber-700 dark:text-amber-400',
        )}
      >
        {value}
      </p>
      {sub ? <p className="text-xs text-muted-foreground">{sub}</p> : null}
    </div>
  )
}
