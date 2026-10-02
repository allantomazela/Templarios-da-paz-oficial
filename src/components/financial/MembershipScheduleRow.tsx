import { Pencil, Plus } from 'lucide-react'
import type { Contribution } from '@/lib/data'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { TableCell, TableRow } from '@/components/ui/table'
import { formatCurrencyBRL } from '@/lib/member-payments'
import { formatDateBR } from '@/lib/format-utils'
import {
  membershipStatusLabel,
  type MembershipMonthStatus,
  type MembershipScheduleEntry,
} from '@/lib/membership-schedule'
import type {
  MembershipScheduleRowBadge,
  MembershipScheduleRowState,
} from '@/lib/membership-schedule-rows'
import { cn } from '@/lib/utils'

interface MembershipScheduleRowProps {
  entry: MembershipScheduleEntry
  row: MembershipScheduleRowState
  checked: boolean
  saving: boolean
  onToggle: (key: string, checked: boolean) => void
  onEditContribution: (contribution: Contribution) => void
  onControlOnlySettle: (entry: MembershipScheduleEntry) => void
  onLaunch: (entry: MembershipScheduleEntry) => void
}

export function MembershipScheduleRow({
  entry,
  row,
  checked,
  saving,
  onToggle,
  onEditContribution,
  onControlOnlySettle,
  onLaunch,
}: MembershipScheduleRowProps) {
  const primary = row.primaryContribution

  return (
    <TableRow
      className={cn(
        row.isHistorical && 'bg-muted/30',
        entry.status === 'overdue' && 'bg-destructive/5',
      )}
    >
      <TableCell>
        {row.selectable ? (
          <Checkbox
            checked={checked}
            onCheckedChange={(value) => onToggle(row.key, value === true)}
            aria-label={`Selecionar ${entry.periodLabel}`}
          />
        ) : null}
      </TableCell>
      <TableCell className="font-medium">
        <div className="flex flex-col gap-1">
          <span>{entry.periodLabel}</span>
          <RowBadge badge={row.badge} />
        </div>
      </TableCell>
      <TableCell>{formatDateBR(entry.dueDate)}</TableCell>
      <TableCell className="font-mono">{formatCurrencyBRL(entry.expectedAmount)}</TableCell>
      <TableCell className="font-mono text-green-700">
        {formatCurrencyBRL(entry.paidAmount)}
      </TableCell>
      <TableCell className="font-mono text-amber-700">
        {entry.remainingAmount > 0 ? formatCurrencyBRL(entry.remainingAmount) : '—'}
      </TableCell>
      <TableCell>
        <ScheduleStatusBadge status={entry.status} />
      </TableCell>
      <TableCell className="text-right">
        <div className="flex flex-wrap justify-end gap-1">
          {primary ? (
            <Button variant="outline" size="sm" onClick={() => onEditContribution(primary)}>
              <Pencil className="mr-1 h-3 w-3" />
              Editar
            </Button>
          ) : entry.remainingAmount > 0 ? (
            <>
              {row.canControlOnlySettle ? (
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={saving}
                  onClick={() => onControlOnlySettle(entry)}
                >
                  Quitar (só controle)
                </Button>
              ) : null}
              <Button variant="outline" size="sm" onClick={() => onLaunch(entry)}>
                <Plus className="mr-1 h-3 w-3" />
                Lançar
              </Button>
            </>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}

const ROW_BADGE_LABELS: Record<MembershipScheduleRowBadge, string> = {
  backfill_missing_treasury: 'Só controle — falta tesouraria',
  orphan_treasury: 'Pago — receita não lançada no caixa',
  control_only: 'Pago — somente controle',
  historical_control: 'Só controle',
}

function RowBadge({ badge }: { badge: MembershipScheduleRowBadge | null }) {
  if (!badge) return null
  return (
    <Badge
      variant="outline"
      className={cn(
        'w-fit text-xs',
        badge === 'orphan_treasury' && 'border-amber-500 text-amber-700',
      )}
    >
      {ROW_BADGE_LABELS[badge]}
    </Badge>
  )
}

const STATUS_BADGE_CLASSES: Partial<Record<MembershipMonthStatus, string>> = {
  paid: 'bg-green-600 hover:bg-green-700',
  partial: 'bg-amber-500 hover:bg-amber-600',
  upcoming: 'bg-sky-600 hover:bg-sky-700',
}

function ScheduleStatusBadge({ status }: { status: MembershipMonthStatus }) {
  const label = membershipStatusLabel(status)
  if (status === 'overdue') return <Badge variant="destructive">{label}</Badge>
  const className = STATUS_BADGE_CLASSES[status]
  if (className) return <Badge className={className}>{label}</Badge>
  return <Badge variant="secondary">{label}</Badge>
}
