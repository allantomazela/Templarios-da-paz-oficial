import type { Contribution } from '@/lib/data'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrencyBRL } from '@/lib/member-payments'
import { MEMBERSHIP_LABELS } from '@/lib/membership-labels'
import type {
  BrotherMembershipSchedule,
  MembershipScheduleEntry,
} from '@/lib/membership-schedule'
import { describeScheduleRow } from '@/lib/membership-schedule-rows'
import { MembershipScheduleRow } from './MembershipScheduleRow'

interface MembershipScheduleDialogTableProps {
  schedule: BrotherMembershipSchedule | null
  brotherContributions: Contribution[]
  historicalKeys: Set<string>
  selectedKeys: Set<string>
  selectedCount: number
  selectionTotal: number
  saving: boolean
  onToggle: (key: string, checked: boolean) => void
  onSelectAll: () => void
  onOpenBatchSettle: () => void
  onEditContribution: (contribution: Contribution) => void
  onControlOnlySettle: (entry: MembershipScheduleEntry) => void
  onLaunch: (entry: MembershipScheduleEntry) => void
}

/** Tabela editável do cronograma no diálogo da tesouraria (seleção em lote e ações por mês). */
export function MembershipScheduleDialogTable({
  schedule,
  brotherContributions,
  historicalKeys,
  selectedKeys,
  selectedCount,
  selectionTotal,
  saving,
  onToggle,
  onSelectAll,
  onOpenBatchSettle,
  onEditContribution,
  onControlOnlySettle,
  onLaunch,
}: MembershipScheduleDialogTableProps) {
  if (!schedule || schedule.entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        Nenhum período no cronograma deste irmão.
      </p>
    )
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onSelectAll}>
          Selecionar todos a receber
        </Button>
        {selectedCount > 0 ? (
          <Button type="button" size="sm" onClick={onOpenBatchSettle}>
            Registrar pagamento na tesouraria (
            {formatCurrencyBRL(selectionTotal)})
          </Button>
        ) : null}
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>Referência</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Previsto</TableHead>
              <TableHead>Pago</TableHead>
              <TableHead>{MEMBERSHIP_LABELS.toReceive}</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedule.entries.map((entry) => {
              const row = describeScheduleRow(entry, brotherContributions, historicalKeys)
              return (
                <MembershipScheduleRow
                  key={row.key}
                  entry={entry}
                  row={row}
                  checked={selectedKeys.has(row.key)}
                  saving={saving}
                  onToggle={onToggle}
                  onEditContribution={onEditContribution}
                  onControlOnlySettle={onControlOnlySettle}
                  onLaunch={onLaunch}
                />
              )
            })}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
