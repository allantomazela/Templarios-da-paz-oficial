import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAsyncOperation } from '@/hooks/use-async-operation'
import {
  CONTRIBUTION_MONTHS,
  generatePendingContributionsForMonth,
  type MembershipFeeSettings,
} from '@/lib/contribution-payments'
import { formatCurrencyBRL } from '@/lib/member-payments'

type ContributionMonth = (typeof CONTRIBUTION_MONTHS)[number]

export function MembershipGenerateDialog({
  open,
  onOpenChange,
  feeSettings,
  onGenerated,
}: MembershipGenerateDialogProps) {
  const [generateMonth, setGenerateMonth] = useState<ContributionMonth>(
    CONTRIBUTION_MONTHS[new Date().getMonth()],
  )
  const [generateYear, setGenerateYear] = useState(new Date().getFullYear())

  const generateOperation = useAsyncOperation(
    async () => {
      const month = CONTRIBUTION_MONTHS.indexOf(generateMonth) + 1
      const result = await generatePendingContributionsForMonth(
        month,
        generateYear,
      )
      await onGenerated()
      onOpenChange(false)
      const afastadoNote =
        result.createdAfastado > 0
          ? ` Destas, ${result.createdAfastado} com valor de afastamento (base).`
          : ''
      return `${result.created} mensalidade(s) criada(s). ${result.skipped} irmão(s) já tinham lançamento para ${generateMonth}/${generateYear}.${afastadoNote}`
    },
    {
      successMessage: 'Geração concluída',
      errorMessage: 'Falha ao gerar mensalidades do mês.',
    },
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Gerar mensalidades pendentes</DialogTitle>
          <DialogDescription>
            Cria um lançamento <strong>Pendente</strong> para cada irmão com
            conta aprovada que ainda não possui registro no mês escolhido.
            Valor regular: {formatCurrencyBRL(feeSettings.defaultAmount)} ·
            afastado: {formatCurrencyBRL(feeSettings.baseAmount)}.
            Desligados não entram na geração.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Mês</label>
            <Select
              value={generateMonth}
              onValueChange={(value) => setGenerateMonth(value as ContributionMonth)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTRIBUTION_MONTHS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Ano</label>
            <Input
              type="number"
              value={generateYear}
              onChange={(e) => setGenerateYear(Number(e.target.value))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => generateOperation.execute()}
            disabled={generateOperation.loading}
          >
            {generateOperation.loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Gerar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface MembershipGenerateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  feeSettings: MembershipFeeSettings
  onGenerated: () => Promise<void>
}
