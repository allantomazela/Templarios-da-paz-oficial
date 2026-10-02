import type { Contribution } from '@/lib/data'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Pencil, Trash2 } from 'lucide-react'
import { formatDateBR } from '@/lib/format-utils'
import { CONTRIBUTION_MONTHS } from '@/lib/contribution-payments'
import { formatCurrencyBRL } from '@/lib/member-payments'
import { isMembershipHistoricalPeriod } from '@/lib/membership-schedule'

function ContributionStatusBadge({ status }: { status: Contribution['status'] }) {
  if (status === 'Pago') {
    return (
      <Badge className="bg-green-600 hover:bg-green-700">{status}</Badge>
    )
  }
  if (status === 'Atrasado') {
    return <Badge variant="destructive">{status}</Badge>
  }
  return <Badge variant="secondary">{status}</Badge>
}

function TreasuryLinkBadge({ contribution }: { contribution: Contribution }) {
  const monthIndex = CONTRIBUTION_MONTHS.indexOf(
    contribution.month as (typeof CONTRIBUTION_MONTHS)[number],
  )
  const monthNum = monthIndex >= 0 ? monthIndex + 1 : 0
  const historical =
    monthNum > 0 && isMembershipHistoricalPeriod(contribution.year, monthNum)

  if (contribution.transactionId) {
    return (
      <Badge variant="outline" className="text-green-700">
        Receita lançada
      </Badge>
    )
  }
  if (contribution.status === 'Pago' && historical) {
    return (
      <Badge variant="outline" className="text-amber-800">
        Só controle
      </Badge>
    )
  }
  if (contribution.status === 'Pago') {
    return <Badge variant="outline">Sem vínculo</Badge>
  }
  return '—'
}

export function MembershipContributionsTable({
  rows,
  brotherNames,
  onEdit,
  onDelete,
  emptyMessage,
}: MembershipContributionsTableProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-md border bg-card py-10 text-center text-muted-foreground">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Irmão</TableHead>
            <TableHead>Referência</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Data pagto.</TableHead>
            <TableHead>Tesouraria</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((contribution) => (
            <TableRow key={contribution.id}>
              <TableCell className="font-medium whitespace-nowrap">
                {brotherNames[contribution.brotherId] ||
                  contribution.brotherName ||
                  'Desconhecido'}
              </TableCell>
              <TableCell>
                {contribution.month}/{contribution.year}
              </TableCell>
              <TableCell className="font-mono">
                {formatCurrencyBRL(contribution.amount)}
              </TableCell>
              <TableCell>
                <ContributionStatusBadge status={contribution.status} />
              </TableCell>
              <TableCell>
                {contribution.paymentDate
                  ? formatDateBR(contribution.paymentDate)
                  : '—'}
              </TableCell>
              <TableCell>
                <TreasuryLinkBadge contribution={contribution} />
              </TableCell>
              <TableCell className="text-right space-x-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(contribution)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => onDelete(contribution)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

interface MembershipContributionsTableProps {
  rows: Contribution[]
  brotherNames: Record<string, string>
  onEdit: (contribution: Contribution) => void
  onDelete: (contribution: Contribution) => void
  emptyMessage: string
}
