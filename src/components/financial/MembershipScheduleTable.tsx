import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDateBR } from '@/lib/format-utils'
import { formatCurrencyBRL } from '@/lib/member-payments'
import {
  membershipStatusLabel,
  type MembershipScheduleEntry,
  type MembershipMonthStatus,
} from '@/lib/membership-schedule'
import { cn } from '@/lib/utils'

function statusBadge(status: MembershipMonthStatus) {
  if (status === 'paid') {
    return (
      <Badge className="bg-green-600 hover:bg-green-700">
        {membershipStatusLabel(status)}
      </Badge>
    )
  }
  if (status === 'overdue') {
    return (
      <Badge variant="destructive">{membershipStatusLabel(status)}</Badge>
    )
  }
  if (status === 'partial') {
    return (
      <Badge className="bg-amber-500 hover:bg-amber-600">
        {membershipStatusLabel(status)}
      </Badge>
    )
  }
  if (status === 'upcoming') {
    return (
      <Badge className="bg-sky-600 hover:bg-sky-700">
        {membershipStatusLabel(status)}
      </Badge>
    )
  }
  return (
    <Badge variant="secondary">{membershipStatusLabel(status)}</Badge>
  )
}

interface MembershipScheduleTableProps {
  entries: MembershipScheduleEntry[]
  emptyMessage?: string
  highlightOverdue?: boolean
}

export function MembershipScheduleTable({
  entries,
  emptyMessage = 'Nenhum período no cronograma.',
  highlightOverdue = true,
}: MembershipScheduleTableProps) {
  if (entries.length === 0) {
    return (
      <div className="rounded-md border bg-card py-10 text-center text-muted-foreground">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="rounded-md border bg-card overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Referência</TableHead>
            <TableHead>Vencimento</TableHead>
            <TableHead>Previsto</TableHead>
            <TableHead>Pago</TableHead>
            <TableHead>Em aberto</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow
              key={`${entry.year}-${entry.month}`}
              className={cn(
                highlightOverdue &&
                  entry.status === 'overdue' &&
                  'bg-destructive/5',
              )}
            >
              <TableCell className="font-medium">{entry.periodLabel}</TableCell>
              <TableCell>{formatDateBR(entry.dueDate)}</TableCell>
              <TableCell className="font-mono">
                {formatCurrencyBRL(entry.expectedAmount)}
              </TableCell>
              <TableCell className="font-mono text-green-700">
                {formatCurrencyBRL(entry.paidAmount)}
              </TableCell>
              <TableCell className="font-mono text-amber-700">
                {entry.remainingAmount > 0
                  ? formatCurrencyBRL(entry.remainingAmount)
                  : '—'}
              </TableCell>
              <TableCell>{statusBadge(entry.status)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
