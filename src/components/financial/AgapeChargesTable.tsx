import { Pencil, Trash2 } from 'lucide-react'
import type { AgapeBrotherCharge } from '@/lib/data'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrencyBRL, formatDateBR } from '@/lib/format-utils'

interface AgapeChargesTableProps {
  charges: AgapeBrotherCharge[]
  brotherNames: Record<string, string>
  monthLabel: string
  canEdit: boolean
  isDeleting: boolean
  onEdit: (charge: AgapeBrotherCharge) => void
  onDelete: (charge: AgapeBrotherCharge) => void
}

export function AgapeChargesTable({
  charges,
  brotherNames,
  monthLabel,
  canEdit,
  isDeleting,
  onEdit,
  onDelete,
}: AgapeChargesTableProps) {
  if (charges.length === 0) {
    return (
      <div className="rounded-md border bg-card py-12 text-center text-muted-foreground">
        Nenhuma cobrança para {monthLabel}. Informe o total das bebidas e
        importe os consumos ou registre os pagamentos dos irmãos.
      </div>
    )
  }

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Irmão</TableHead>
            <TableHead>Consumo</TableHead>
            <TableHead>Valor cobrado</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Data pagto.</TableHead>
            <TableHead>Tesouraria</TableHead>
            {canEdit && <TableHead className="text-right">Ações</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {charges.map((charge) => (
            <TableRow key={charge.id}>
              <TableCell className="font-medium">
                {brotherNames[charge.brotherId] || charge.brotherName || 'Desconhecido'}
              </TableCell>
              <TableCell className="font-mono">
                {formatCurrencyBRL(charge.consumedAmount)}
              </TableCell>
              <TableCell className="font-mono">{formatCurrencyBRL(charge.amount)}</TableCell>
              <TableCell>
                <ChargeStatusBadge status={charge.status} />
              </TableCell>
              <TableCell>
                {charge.paymentDate ? formatDateBR(charge.paymentDate) : '—'}
              </TableCell>
              <TableCell>
                <TreasuryLinkCell charge={charge} />
              </TableCell>
              {canEdit && (
                <TableCell className="text-right space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Editar lançamento"
                    onClick={() => onEdit(charge)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    title="Excluir lançamento"
                    onClick={() => onDelete(charge)}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function ChargeStatusBadge({ status }: { status: AgapeBrotherCharge['status'] }) {
  if (status === 'Pago') {
    return <Badge className="bg-green-600 hover:bg-green-700">{status}</Badge>
  }
  if (status === 'Atrasado') {
    return <Badge variant="destructive">{status}</Badge>
  }
  return <Badge variant="secondary">{status}</Badge>
}

function TreasuryLinkCell({ charge }: { charge: AgapeBrotherCharge }) {
  if (charge.transactionId) {
    return (
      <Badge variant="outline" className="text-green-700">
        Receita lançada
      </Badge>
    )
  }
  if (charge.status === 'Pago') {
    return <Badge variant="outline">Sem vínculo</Badge>
  }
  return <>—</>
}
