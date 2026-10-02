import { ChevronDown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { periodKey } from '@/lib/membership-batch-settle'
import {
  MEMBERSHIP_TRACKING_START_YEAR,
  type MembershipBackfillPeriod,
} from '@/lib/membership-schedule'
import type { PeriodChoice } from '@/lib/membership-schedule-rows'
import { cn } from '@/lib/utils'

interface MembershipHistoricalBackfillSectionProps {
  periods: MembershipBackfillPeriod[]
  choices: Record<string, PeriodChoice>
  onChoiceChange: (key: string, value: PeriodChoice) => void
  open: boolean
  onOpenChange: (open: boolean) => void
  saving: boolean
  disabled: boolean
  onSave: () => void
}

/** Migração da planilha antiga (meses pré-produção), sem gerar receita no caixa. */
export function MembershipHistoricalBackfillSection({
  periods,
  choices,
  onChoiceChange,
  open,
  onOpenChange,
  saving,
  disabled,
  onSave,
}: MembershipHistoricalBackfillSectionProps) {
  if (periods.length === 0) return null

  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <CollapsibleTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="flex w-full items-center justify-between px-2 text-sm text-muted-foreground"
        >
          Migrar planilha antiga (jan–mai/{MEMBERSHIP_TRACKING_START_YEAR}) — sem
          tesouraria
          <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 pt-2">
        <p className="text-xs text-muted-foreground">
          Use apenas para importar o status da planilha Excel. Não gera receita
          no caixa. Para pagamento real (ex.: março e abril pagos em junho),
          use a tabela acima com conta bancária.
        </p>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Referência</TableHead>
                <TableHead>Situação na planilha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {periods.map((period) => {
                const key = periodKey(period.year, period.month)
                return (
                  <TableRow key={key} className="bg-muted/20">
                    <TableCell className="font-medium">{period.periodLabel}</TableCell>
                    <TableCell>
                      <Select
                        value={choices[key] ?? (period.paid ? 'paid' : 'unpaid')}
                        onValueChange={(value: PeriodChoice) => onChoiceChange(key, value)}
                      >
                        <SelectTrigger className="w-[160px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="paid">Pago</SelectItem>
                          <SelectItem value="unpaid">Não pago</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
        <div className="flex justify-end">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onSave}
            disabled={saving || disabled}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar migração da planilha'
            )}
          </Button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
