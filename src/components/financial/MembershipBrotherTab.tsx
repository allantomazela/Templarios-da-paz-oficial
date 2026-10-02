import { CalendarDays, Loader2, User, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Contribution } from '@/lib/data'
import type {
  ApprovedBrotherOption,
  BrotherContributionSummary,
} from '@/lib/contribution-payments'
import type { BrotherMembershipSchedule } from '@/lib/membership-schedule'
import { BrotherSearchCombobox } from './BrotherSearchCombobox'
import { BrotherAccessInfoPanel } from './BrotherAccessInfoPanel'
import { MembershipScheduleTable } from './MembershipScheduleTable'
import { MembershipBrotherSummaryCards } from './MembershipBrotherSummaryCards'
import { MembershipContributionsTable } from './MembershipContributionsTable'

export function MembershipBrotherTab({
  brothers,
  selectedBrotherId,
  onBrotherChange,
  onNewContribution,
  onOpenSchedule,
  summary,
  schedule,
  treasuryPaidTotal,
  history,
  brotherNames,
  loading,
  onEdit,
  onDelete,
}: MembershipBrotherTabProps) {
  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1 max-w-md space-y-2">
          <label className="text-sm font-medium">Selecionar irmão</label>
          <BrotherSearchCombobox
            brothers={brothers}
            value={selectedBrotherId}
            onChange={onBrotherChange}
            placeholder="Buscar irmão por nome..."
          />
        </div>
        <Button
          onClick={onNewContribution}
          disabled={!selectedBrotherId}
          className="shrink-0 bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/25 transition-all hover:bg-emerald-700 hover:shadow-md disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none disabled:ring-0"
        >
          <User className="mr-2 h-4 w-4" />
          Lançar para este irmão
        </Button>
      </div>

      {selectedBrotherId ? (
        <BrotherAccessInfoPanel profileId={selectedBrotherId} />
      ) : null}

      {summary ? (
        <MembershipBrotherSummaryCards
          summary={summary}
          schedule={schedule}
          treasuryPaidTotal={treasuryPaidTotal}
        />
      ) : null}

      {schedule ? (
        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <CalendarDays className="h-4 w-4" />
              Cronograma de mensalidades
            </h3>
            <Button variant="outline" size="sm" onClick={onOpenSchedule}>
              Gerenciar cronograma
            </Button>
          </div>
          <MembershipScheduleTable entries={schedule.entries} />
        </div>
      ) : null}

      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Wallet className="h-4 w-4" />
          Histórico de mensalidades
        </h3>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <MembershipContributionsTable
            rows={history}
            brotherNames={brotherNames}
            onEdit={onEdit}
            onDelete={onDelete}
            emptyMessage="Nenhuma mensalidade registrada para este irmão."
          />
        )}
      </div>
    </>
  )
}

interface MembershipBrotherTabProps {
  brothers: ApprovedBrotherOption[]
  selectedBrotherId: string
  onBrotherChange: (brotherId: string) => void
  onNewContribution: () => void
  onOpenSchedule: () => void
  summary: BrotherContributionSummary | undefined
  schedule: BrotherMembershipSchedule | null
  treasuryPaidTotal: number
  history: Contribution[]
  brotherNames: Record<string, string>
  loading: boolean
  onEdit: (contribution: Contribution) => void
  onDelete: (contribution: Contribution) => void
}
