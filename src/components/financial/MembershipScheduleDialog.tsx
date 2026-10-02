import { useEffect, useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CalendarDays } from 'lucide-react'
import {
  buildMembershipBackfillPeriods,
  buildMembershipScheduleForBrother,
  contributionCountsInTreasury,
  type MembershipFeeScheduleSettings,
  type MembershipScheduleEntry,
} from '@/lib/membership-schedule'
import { periodKey } from '@/lib/membership-batch-settle'
import {
  buildSelectedSettlePeriods,
  selectableScheduleKeys,
  type PeriodChoice,
} from '@/lib/membership-schedule-rows'
import { MembershipBatchSettleDialog } from '@/components/financial/MembershipBatchSettleDialog'
import {
  CONTRIBUTION_MONTHS,
  type ApprovedBrotherOption,
} from '@/lib/contribution-payments'
import type { Contribution } from '@/lib/data'
import { useMembershipScheduleActions } from '@/hooks/use-membership-schedule-actions'
import { MembershipScheduleSummaryAlerts } from './MembershipScheduleSummaryAlerts'
import { MembershipScheduleDialogTable } from './MembershipScheduleDialogTable'
import { MembershipHistoricalBackfillSection } from './MembershipHistoricalBackfillSection'

interface MembershipScheduleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  brotherId: string | null
  brothers: ApprovedBrotherOption[]
  contributions: Contribution[]
  feeSettings: MembershipFeeScheduleSettings
  onSaved: () => void | Promise<void>
  onRegisterPayment: (params: {
    brotherId: string
    brotherName: string
    month: string
    year: number
  }) => void
  onEditContribution: (contribution: Contribution) => void
}

export function MembershipScheduleDialog({
  open,
  onOpenChange,
  brotherId,
  brothers,
  contributions,
  feeSettings,
  onSaved,
  onRegisterPayment,
  onEditContribution,
}: MembershipScheduleDialogProps) {
  const [choices, setChoices] = useState<Record<string, PeriodChoice>>({})
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
  const [batchSettleOpen, setBatchSettleOpen] = useState(false)
  const [backfillOpen, setBackfillOpen] = useState(false)

  const brother = brothers.find((b) => b.id === brotherId)
  const brotherContributions = useMemo(
    () =>
      brotherId
        ? contributions.filter((c) => c.brotherId === brotherId)
        : [],
    [contributions, brotherId],
  )

  const schedule = useMemo(() => {
    if (!brotherId || !brother) return null
    return buildMembershipScheduleForBrother(
      brotherId,
      brother.full_name?.trim() || 'Irmão',
      contributions,
      feeSettings,
      brother.created_at,
      brother.membershipSituation,
    )
  }, [brotherId, brother, contributions, feeSettings])

  const historicalPeriods = useMemo(() => {
    if (!brotherId) return []
    return buildMembershipBackfillPeriods(
      brother?.created_at,
      feeSettings,
      contributions,
      brotherId,
      undefined,
      undefined,
      brother?.membershipSituation,
    )
  }, [brotherId, brother?.created_at, brother?.membershipSituation, feeSettings, contributions])

  const historicalKeys = useMemo(
    () => new Set(historicalPeriods.map((p) => periodKey(p.year, p.month))),
    [historicalPeriods],
  )

  const openEntries = useMemo(
    () => schedule?.entries.filter((e) => e.remainingAmount > 0) ?? [],
    [schedule],
  )

  // Separação clara: "em atraso" (mês já fechado) x "à vencer" (mês corrente/futuro).
  const overdueEntries = useMemo(
    () => schedule?.overdueEntries ?? [],
    [schedule],
  )
  const upcomingEntries = useMemo(() => schedule?.openEntries ?? [], [schedule])

  const treasuryPaidTotal = useMemo(
    () =>
      brotherContributions
        .filter((c) => contributionCountsInTreasury(c))
        .reduce((sum, c) => sum + c.amount, 0),
    [brotherContributions],
  )

  const selectedOpenPeriods = useMemo(
    () =>
      schedule
        ? buildSelectedSettlePeriods(schedule.entries, selectedKeys, brotherContributions)
        : [],
    [schedule, selectedKeys, brotherContributions],
  )

  const selectionTotal = useMemo(
    () => selectedOpenPeriods.reduce((sum, p) => sum + p.amount, 0),
    [selectedOpenPeriods],
  )

  const actions = useMembershipScheduleActions({
    brotherId,
    brother,
    feeSettings,
    brotherContributions,
    historicalPeriods,
    choices,
    selectedOpenPeriods,
    onSaved,
    clearSelection: () => setSelectedKeys(new Set()),
  })
  const { setError } = actions

  useEffect(() => {
    if (!open || historicalPeriods.length === 0) return
    const initial: Record<string, PeriodChoice> = {}
    for (const period of historicalPeriods) {
      initial[periodKey(period.year, period.month)] = period.paid
        ? 'paid'
        : 'unpaid'
    }
    setChoices(initial)
    setError(null)
  }, [open, historicalPeriods, setError])

  useEffect(() => {
    if (!open) {
      setSelectedKeys(new Set())
      setBatchSettleOpen(false)
    }
  }, [open])

  function toggleSelection(key: string, checked: boolean) {
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      if (checked) next.add(key)
      else next.delete(key)
      return next
    })
  }

  function selectAllOpen() {
    if (!schedule) return
    setSelectedKeys(new Set(selectableScheduleKeys(schedule.entries, brotherContributions)))
  }

  function launchPeriod(entry: MembershipScheduleEntry) {
    onRegisterPayment({
      brotherId: brotherId!,
      brotherName: brother?.full_name?.trim() || schedule?.brotherName || 'Irmão',
      month: CONTRIBUTION_MONTHS[entry.month - 1] ?? String(entry.month),
      year: entry.year,
    })
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Cronograma — {brother?.full_name?.trim() || 'Irmão'}
            </DialogTitle>
            <DialogDescription>
              A coluna <strong>Referência</strong> é o mês da mensalidade; a data do
              pagamento é quando o valor entrou no banco. Irmãos diferentes pagando no
              mesmo mês (ex.: Renan em jul/2026 e Carlos em jun/2026) geram receitas
              separadas — isso é normal.
            </DialogDescription>
          </DialogHeader>

          <MembershipScheduleSummaryAlerts
            openEntriesCount={openEntries.length}
            overdueEntries={overdueEntries}
            upcomingEntries={upcomingEntries}
            totalOverdue={schedule?.totalOverdue ?? 0}
            totalOpen={schedule?.totalOpen ?? 0}
            treasuryPaidTotal={treasuryPaidTotal}
          />

          <MembershipScheduleDialogTable
            schedule={schedule}
            brotherContributions={brotherContributions}
            historicalKeys={historicalKeys}
            selectedKeys={selectedKeys}
            selectedCount={selectedOpenPeriods.length}
            selectionTotal={selectionTotal}
            saving={actions.saving}
            onToggle={toggleSelection}
            onSelectAll={selectAllOpen}
            onOpenBatchSettle={() => setBatchSettleOpen(true)}
            onEditContribution={onEditContribution}
            onControlOnlySettle={actions.controlOnlySettle}
            onLaunch={launchPeriod}
          />

          <MembershipHistoricalBackfillSection
            periods={historicalPeriods}
            choices={choices}
            onChoiceChange={(key, value) =>
              setChoices((prev) => ({ ...prev, [key]: value }))
            }
            open={backfillOpen}
            onOpenChange={setBackfillOpen}
            saving={actions.saving}
            disabled={!brotherId}
            onSave={actions.saveHistorical}
          />

          {actions.error ? <p className="text-sm text-destructive">{actions.error}</p> : null}

          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
            <p className="text-xs text-muted-foreground text-left">
              Ex.: Claudinei pagou R$ 580 em junho → marque março e abril, registre na
              tesouraria; maio e junho permanecem em aberto até quitar.
            </p>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MembershipBatchSettleDialog
        open={batchSettleOpen}
        onOpenChange={setBatchSettleOpen}
        brotherName={brother?.full_name?.trim() || schedule?.brotherName || 'Irmão'}
        periods={selectedOpenPeriods}
        onConfirm={actions.batchSettle}
      />
    </>
  )
}
