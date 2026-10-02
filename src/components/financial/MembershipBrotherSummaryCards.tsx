import type { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { formatDateBR } from '@/lib/format-utils'
import { formatCurrencyBRL } from '@/lib/member-payments'
import type { BrotherContributionSummary } from '@/lib/contribution-payments'
import type { BrotherMembershipSchedule } from '@/lib/membership-schedule'

function currentStatusLabel(status: BrotherContributionSummary['currentStatus']) {
  switch (status) {
    case 'paid':
      return { label: 'Em dia', className: 'text-green-600' }
    case 'upcoming':
      return { label: 'À vencer', className: 'text-sky-600' }
    case 'pending':
      return { label: 'Pendente', className: 'text-amber-600' }
    case 'overdue':
      return { label: 'Em atraso', className: 'text-destructive' }
    default:
      return { label: 'Sem registro', className: 'text-muted-foreground' }
  }
}

function SummaryCard({ title, value, valueClassName, hint }: SummaryCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className={cn('text-lg font-semibold', valueClassName)}>{value}</p>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  )
}

export function MembershipBrotherSummaryCards({
  summary,
  schedule,
  treasuryPaidTotal,
}: MembershipBrotherSummaryCardsProps) {
  const current = currentStatusLabel(summary.currentStatus)

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <SummaryCard
        title="Situação atual"
        value={current.label}
        valueClassName={current.className}
      />
      <SummaryCard
        title="Total na tesouraria"
        value={formatCurrencyBRL(treasuryPaidTotal)}
        valueClassName="text-green-600"
        hint={
          <>
            Jun/2026 em diante · controle:{' '}
            {formatCurrencyBRL(summary.totalPaid)}
          </>
        }
      />
      <SummaryCard
        title="Pendências"
        value={formatCurrencyBRL(summary.totalPending)}
        valueClassName="text-amber-600"
        hint={`${summary.pendingCount + summary.overdueCount} em aberto`}
      />
      <SummaryCard
        title="Em atraso"
        value={formatCurrencyBRL(schedule?.totalOverdue ?? 0)}
        valueClassName="text-destructive"
        hint={`${schedule?.overdueMonthCount ?? 0} mês(es)`}
      />
      <SummaryCard
        title="Último pagamento"
        value={summary.lastPaymentDate ? formatDateBR(summary.lastPaymentDate) : '—'}
      />
    </div>
  )
}

interface SummaryCardProps {
  title: string
  value: ReactNode
  valueClassName?: string
  hint?: ReactNode
}

interface MembershipBrotherSummaryCardsProps {
  summary: BrotherContributionSummary
  schedule: BrotherMembershipSchedule | null
  treasuryPaidTotal: number
}
