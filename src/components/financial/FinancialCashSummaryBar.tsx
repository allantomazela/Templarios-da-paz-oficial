import { CheckCircle2, AlertCircle, Wallet } from 'lucide-react'
import { formatCurrencyBRL } from '@/lib/format-utils'
import type { CashAvailabilitySummary } from '@/lib/financial-balance-math'
import { cn } from '@/lib/utils'

interface FinancialCashSummaryBarProps {
  summary: CashAvailabilitySummary
  highlight?: 'income' | 'expense'
}

export function FinancialCashSummaryBar({
  summary,
  highlight,
}: FinancialCashSummaryBarProps) {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Wallet className="h-4 w-4 text-muted-foreground" />
        <h4 className="text-sm font-medium">Posição de caixa (todas as contas)</h4>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryMetric
          label="Receitas acumuladas"
          value={summary.totalIncome}
          className={highlight === 'income' ? 'text-green-600' : undefined}
        />
        <SummaryMetric
          label="Despesas acumuladas"
          value={summary.totalExpense}
          className={highlight === 'expense' ? 'text-destructive' : undefined}
        />
        <SummaryMetric
          label="Movimento líquido"
          value={summary.netMovement}
          className={summary.netMovement >= 0 ? 'text-blue-600' : 'text-orange-600'}
        />
        <SummaryMetric
          label="Caixa disponível"
          value={summary.availableCash}
          className="text-primary"
          emphasized
        />
      </div>

      <div
        className={cn(
          'flex items-start gap-2 rounded-md border px-3 py-2 text-sm',
          summary.isBalanced
            ? 'border-green-200 bg-green-50 text-green-800'
            : 'border-amber-200 bg-amber-50 text-amber-800',
        )}
      >
        {summary.isBalanced ? (
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
        ) : (
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        )}
        <p>
          {summary.isBalanced ? (
            <>
              Conferência ok: saldos iniciais ({formatCurrencyBRL(summary.totalInitialBalance)})
              + receitas − despesas = caixa disponível ({formatCurrencyBRL(summary.availableCash)}).
            </>
          ) : (
            <>
              Diferença de {formatCurrencyBRL(summary.difference)} na conferência. Verifique
              transações sem conta vinculada ou saldos iniciais das contas.
            </>
          )}
        </p>
      </div>
    </div>
  )
}

interface SummaryMetricProps {
  label: string
  value: number
  className?: string
  emphasized?: boolean
}

function SummaryMetric({ label, value, className, emphasized }: SummaryMetricProps) {
  return (
    <div className="rounded-md border px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          'font-mono font-semibold',
          emphasized ? 'text-xl' : 'text-base',
          className,
        )}
      >
        {formatCurrencyBRL(value)}
      </p>
    </div>
  )
}
