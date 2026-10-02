import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  CalendarDays,
  CalendarPlus,
  ChevronDown,
  GraduationCap,
  Plus,
  Wallet,
} from 'lucide-react'

export function MembershipPaymentsToolbar({
  loading,
  hasSelectedBrother,
  onNewContribution,
  onNewCeremony,
  onGenerate,
  onOpenSchedule,
}: MembershipPaymentsToolbarProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <p className="text-sm text-muted-foreground max-w-2xl">
        Registre pagamentos a partir de jun/2026 — entram na tesouraria quando
        marcados como <strong>Pago</strong> com conta bancária. Meses anteriores
        (jan–mai/2026) são ajustados pelo cronograma, apenas para controle.
      </p>
      <div className="flex flex-wrap gap-2 shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button disabled={loading}>
              <Plus className="mr-2 h-4 w-4" />
              Registrar pagamento
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onNewContribution}>
              <Wallet className="mr-2 h-4 w-4" />
              Mensalidade
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onNewCeremony}>
              <GraduationCap className="mr-2 h-4 w-4" />
              Iniciação, Elevação, Exaltação ou Outros
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="outline" onClick={onGenerate} disabled={loading}>
          <CalendarPlus className="mr-2 h-4 w-4" />
          Gerar do mês
        </Button>
        <Button
          variant="outline"
          onClick={onOpenSchedule}
          disabled={loading || !hasSelectedBrother}
        >
          <CalendarDays className="mr-2 h-4 w-4" />
          Ver cronograma
        </Button>
      </div>
    </div>
  )
}

interface MembershipPaymentsToolbarProps {
  loading: boolean
  hasSelectedBrother: boolean
  onNewContribution: () => void
  onNewCeremony: () => void
  onGenerate: () => void
  onOpenSchedule: () => void
}
