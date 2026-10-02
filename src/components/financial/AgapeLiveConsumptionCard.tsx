import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { AgapeConsumptionTotalRow } from '@/lib/agape-payments'
import { formatCurrencyBRL } from '@/lib/format-utils'

interface AgapeLiveConsumptionCardProps {
  rows: AgapeConsumptionTotalRow[]
  monthLabel: string
  liveTotal: number | null
  canEdit: boolean
  onUseAsBeveragesTotal: () => void
}

/** Consumos lançados no módulo Ágape que ainda podem ser importados ao fechamento. */
export function AgapeLiveConsumptionCard({
  rows,
  monthLabel,
  liveTotal,
  canEdit,
  onUseAsBeveragesTotal,
}: AgapeLiveConsumptionCardProps) {
  if (rows.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          Consumos lançados no Ágape ({monthLabel})
        </CardTitle>
        <CardDescription>
          Valores registrados no módulo Ágape — use Importar para trazer ao
          fechamento financeiro.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Irmão</TableHead>
                <TableHead className="text-right">Itens</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.brother_id}>
                  <TableCell>{row.brother_name}</TableCell>
                  <TableCell className="text-right">{row.total_items}</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrencyBRL(row.total_amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="font-medium">
            Total no Ágape: {formatCurrencyBRL(liveTotal ?? 0)}
          </span>
          {canEdit && (liveTotal ?? 0) > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onUseAsBeveragesTotal}
            >
              Usar este total nas bebidas
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
