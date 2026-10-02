import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrencyBRL } from '@/lib/member-payments'
import type { OverdueBrotherAlert } from '@/lib/membership-schedule'

export function MembershipOverdueTable({
  alerts,
  onSelectBrother,
}: MembershipOverdueTableProps) {
  if (alerts.length === 0) return null

  return (
    <div className="rounded-md border bg-card overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Irmão</TableHead>
            <TableHead>Meses em atraso</TableHead>
            <TableHead>Valor em aberto</TableHead>
            <TableHead className="text-right">Ação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {alerts.map((alert) => (
            <TableRow key={alert.brotherId}>
              <TableCell className="font-medium whitespace-nowrap">
                {alert.brotherName}
              </TableCell>
              <TableCell>{alert.overdueLabels.join(', ')}</TableCell>
              <TableCell className="font-mono text-destructive">
                {formatCurrencyBRL(alert.overdueAmount)}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSelectBrother(alert.brotherId)}
                >
                  Ver cronograma
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

interface MembershipOverdueTableProps {
  alerts: OverdueBrotherAlert[]
  onSelectBrother: (brotherId: string) => void
}
