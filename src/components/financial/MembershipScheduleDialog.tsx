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
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { CalendarDays, ChevronDown, Info, Loader2, Pencil, Plus } from 'lucide-react'
import { formatCurrencyBRL } from '@/lib/member-payments'
import { formatDateBR, todayLocalISODate } from '@/lib/format-utils'
import {
  buildMembershipBackfillPeriods,
  buildMembershipScheduleForBrother,
  contributionCountsInTreasury,
  isOrphanTreasuryContribution,
  isMembershipBackfillContribution,
  isMembershipControlOnlyContribution,
  isMembershipHistoricalPeriod,
  membershipStatusLabel,
  MEMBERSHIP_TRACKING_START_YEAR,
  type MembershipFeeScheduleSettings,
  type MembershipMonthStatus,
  type MembershipScheduleEntry,
} from '@/lib/membership-schedule'
import { saveMembershipBackfillPeriods } from '@/lib/membership-history-backfill'
import {
  saveBatchContributionPayment,
  periodKey,
  type BatchSettlePeriod,
} from '@/lib/membership-batch-settle'
import { MembershipBatchSettleDialog } from '@/components/financial/MembershipBatchSettleDialog'
import {
  CONTRIBUTION_MONTHS,
  saveContribution,
  type ApprovedBrotherOption,
} from '@/lib/contribution-payments'
import type { Contribution } from '@/lib/data'
import { cn } from '@/lib/utils'

type PeriodChoice = 'paid' | 'unpaid'

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

function monthNameToNumber(month: string): number {
  return CONTRIBUTION_MONTHS.indexOf(month as (typeof CONTRIBUTION_MONTHS)[number]) + 1
}

function statusBadge(status: MembershipMonthStatus) {
  if (status === 'paid') {
    return (
      <Badge className="bg-green-600 hover:bg-green-700">
        {membershipStatusLabel(status)}
      </Badge>
    )
  }
  if (status === 'overdue') {
    return (
      <Badge variant="destructive">{membershipStatusLabel(status)}</Badge>
    )
  }
  if (status === 'partial') {
    return (
      <Badge className="bg-amber-500 hover:bg-amber-600">
        {membershipStatusLabel(status)}
      </Badge>
    )
  }
  if (status === 'upcoming') {
    return (
      <Badge className="bg-sky-600 hover:bg-sky-700">
        {membershipStatusLabel(status)}
      </Badge>
    )
  }
  return (
    <Badge variant="secondary">{membershipStatusLabel(status)}</Badge>
  )
}

function periodSettleAmount(
  entry: MembershipScheduleEntry,
  periodContributions: Contribution[],
): number {
  if (entry.remainingAmount > 0) return entry.remainingAmount
  const needsTreasury = periodContributions.some(
    (c) =>
      (isMembershipBackfillContribution(entry.year, entry.month, c) ||
        isOrphanTreasuryContribution(entry.year, entry.month, c)) &&
      !contributionCountsInTreasury(c),
  )
  if (needsTreasury && entry.status === 'paid') return entry.expectedAmount
  return 0
}

function isRowSelectable(
  entry: MembershipScheduleEntry,
  periodContributions: Contribution[],
): boolean {
  return periodSettleAmount(entry, periodContributions) > 0
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
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    )
  }, [brotherId, brother, contributions, feeSettings])

  const historicalPeriods = useMemo(() => {
    if (!brotherId) return []
    return buildMembershipBackfillPeriods(
      brother?.created_at,
      feeSettings,
      contributions,
      brotherId,
    )
  }, [brotherId, brother?.created_at, feeSettings, contributions])

  const historicalKeys = useMemo(
    () => new Set(historicalPeriods.map((p) => periodKey(p.year, p.month))),
    [historicalPeriods],
  )

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
  }, [open, historicalPeriods])

  useEffect(() => {
    if (!open) {
      setSelectedKeys(new Set())
      setBatchSettleOpen(false)
    }
  }, [open])

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

  const selectedOpenPeriods = useMemo((): BatchSettlePeriod[] => {
    if (!schedule) return []
    return schedule.entries
      .filter((entry) => {
        const key = periodKey(entry.year, entry.month)
        if (!selectedKeys.has(key)) return false
        const periodContributions = brotherContributions.filter(
          (c) =>
            c.year === entry.year &&
            monthNameToNumber(c.month) === entry.month,
        )
        return periodSettleAmount(entry, periodContributions) > 0
      })
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year
        return a.month - b.month
      })
      .map((entry) => {
        const periodContributions = brotherContributions.filter(
          (c) =>
            c.year === entry.year &&
            monthNameToNumber(c.month) === entry.month,
        )
        return {
          month: entry.month,
          year: entry.year,
          amount: periodSettleAmount(entry, periodContributions),
          periodLabel: entry.periodLabel,
        }
      })
  }, [schedule, selectedKeys, brotherContributions])

  const selectionTotal = useMemo(
    () => selectedOpenPeriods.reduce((sum, p) => sum + p.amount, 0),
    [selectedOpenPeriods],
  )

  function contributionsForPeriod(year: number, month: number) {
    return brotherContributions.filter(
      (c) => c.year === year && monthNameToNumber(c.month) === month,
    )
  }

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
    const keys = schedule.entries
      .filter((entry) => {
        const periodContributions = brotherContributions.filter(
          (c) =>
            c.year === entry.year &&
            monthNameToNumber(c.month) === entry.month,
        )
        return isRowSelectable(entry, periodContributions)
      })
      .map((entry) => periodKey(entry.year, entry.month))
    setSelectedKeys(new Set(keys))
  }

  async function handleSaveHistorical() {
    if (!brotherId || !brother || historicalPeriods.length === 0) return
    setSaving(true)
    setError(null)
    try {
      await saveMembershipBackfillPeriods({
        brotherId,
        brotherName: brother.full_name?.trim() || 'Irmão',
        settings: feeSettings,
        existingContributions: brotherContributions,
        periods: historicalPeriods.map((period) => ({
          month: period.month,
          year: period.year,
          paid: choices[periodKey(period.year, period.month)] === 'paid',
        })),
      })
      await onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar histórico.')
    } finally {
      setSaving(false)
    }
  }

  async function handleBatchSettle(params: {
    paymentDate: string
    accountId: string
    notes: string
  }) {
    if (!brotherId || !brother) return
    await saveBatchContributionPayment({
      brotherId,
      brotherName: brother.full_name?.trim() || 'Irmão',
      periods: selectedOpenPeriods,
      paymentDate: params.paymentDate,
      accountId: params.accountId,
      notes: params.notes,
      existingContributions: brotherContributions,
    })
    setSelectedKeys(new Set())
    await onSaved()
  }

  async function handleControlOnlySettle(entry: MembershipScheduleEntry) {
    if (!brotherId || !brother) return

    const monthName =
      CONTRIBUTION_MONTHS[entry.month - 1] ?? String(entry.month)
    const amount =
      entry.remainingAmount > 0 ? entry.remainingAmount : entry.expectedAmount

    const confirmed = window.confirm(
      `Marcar ${entry.periodLabel} como pago (somente controle)?\n\n` +
        'O mês será quitado no cronograma sem gerar nova receita no caixa. ' +
        'Use quando o pagamento já estiver lançado na tesouraria.',
    )
    if (!confirmed) return

    setSaving(true)
    setError(null)
    try {
      const periodContributions = contributionsForPeriod(entry.year, entry.month)
      const primary = periodContributions[0]

      await saveContribution(
        {
          brotherId,
          brotherName: brother.full_name?.trim() || 'Irmão',
          month: monthName,
          year: entry.year,
          amount,
          status: 'Pago',
          paymentDate: todayLocalISODate(),
          treasuryMode: 'control_only',
        },
        primary
          ? {
              contributionId: primary.id,
              existingTransactionId: primary.transactionId,
            }
          : undefined,
      )
      await onSaved()
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Erro ao quitar mensalidade (só controle).',
      )
    } finally {
      setSaving(false)
    }
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

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="space-y-1 text-sm">
              <p>
                <strong>Um mês</strong> — clique em <strong>Lançar</strong> na linha
                (ex.: Renan quitando só jul/2026).
              </p>
              <p>
                <strong>Vários meses no mesmo PIX</strong> — marque os meses e use{' '}
                <strong>Registrar pagamento na tesouraria</strong> (quitação em lote).
              </p>
            </AlertDescription>
          </Alert>

          {openEntries.length >= 2 ? (
            <Alert className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
              <AlertTitle className="text-sm font-medium">
                {openEntries.length} meses com valor a receber neste irmão
              </AlertTitle>
              <AlertDescription className="text-sm">
                Se o pagamento recebido cobre mais de um mês, selecione todos os meses
                quitados antes de registrar. Use &quot;Selecionar todos a receber&quot; e
                depois &quot;Registrar pagamento na tesouraria&quot;.
              </AlertDescription>
            </Alert>
          ) : null}

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="space-y-1">
              {overdueEntries.length > 0 ? (
                <p>
                  <strong className="text-destructive">
                    {overdueEntries.length} mês(es) em atraso
                  </strong>{' '}
                  — {overdueEntries.map((e) => e.periodLabel).join(', ')} (
                  {formatCurrencyBRL(schedule?.totalOverdue ?? 0)}). Meses já
                  fechados sem pagamento — priorize a cobrança.
                </p>
              ) : null}
              {upcomingEntries.length > 0 ? (
                <p>
                  <strong className="text-sky-700">
                    {upcomingEntries.length} mês(es) à vencer
                  </strong>{' '}
                  — {upcomingEntries.map((e) => e.periodLabel).join(', ')} (
                  {formatCurrencyBRL(schedule?.totalOpen ?? 0)}). Podem ser pagos
                  em qualquer dia do mês, sem constar atraso.
                </p>
              ) : null}
              {overdueEntries.length === 0 && upcomingEntries.length === 0 ? (
                <p>Cronograma quitado nos meses exibidos.</p>
              ) : null}
              <p>
                Receita registrada:{' '}
                <strong>{formatCurrencyBRL(treasuryPaidTotal)}</strong>.
              </p>
            </AlertDescription>
          </Alert>

          {!schedule || schedule.entries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum período no cronograma deste irmão.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={selectAllOpen}>
                  Selecionar todos a receber
                </Button>
                {selectedOpenPeriods.length > 0 ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setBatchSettleOpen(true)}
                  >
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
                      <TableHead>A receber</TableHead>
                      <TableHead>Situação</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schedule.entries.map((entry) => {
                      const key = periodKey(entry.year, entry.month)
                      const isHistorical = historicalKeys.has(key)
                      const periodContributions = contributionsForPeriod(
                        entry.year,
                        entry.month,
                      )
                      const primary = periodContributions[0]
                      const selectable = isRowSelectable(entry, periodContributions)
                      const checked = selectedKeys.has(key)
                      const paidViaTreasury = periodContributions.some((c) =>
                        contributionCountsInTreasury(c),
                      )
                      const backfillOnlyPaid =
                        entry.status === 'paid' &&
                        !paidViaTreasury &&
                        periodContributions.some((c) =>
                          isMembershipBackfillContribution(
                            entry.year,
                            entry.month,
                            c,
                          ),
                        )
                      const orphanTreasuryPaid =
                        entry.status === 'paid' &&
                        !paidViaTreasury &&
                        periodContributions.some((c) =>
                          isOrphanTreasuryContribution(entry.year, entry.month, c),
                        )
                      const controlOnlyPaid =
                        entry.status === 'paid' &&
                        !paidViaTreasury &&
                        !isHistorical &&
                        periodContributions.some((c) =>
                          isMembershipControlOnlyContribution(
                            entry.year,
                            entry.month,
                            c,
                          ),
                        )
                      const canControlOnlySettle =
                        entry.remainingAmount > 0 &&
                        !isHistorical &&
                        !isMembershipHistoricalPeriod(entry.year, entry.month)

                      return (
                        <TableRow
                          key={key}
                          className={cn(
                            isHistorical && 'bg-muted/30',
                            entry.status === 'overdue' && 'bg-destructive/5',
                          )}
                        >
                          <TableCell>
                            {selectable ? (
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(value) =>
                                  toggleSelection(key, value === true)
                                }
                                aria-label={`Selecionar ${entry.periodLabel}`}
                              />
                            ) : null}
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex flex-col gap-1">
                              <span>{entry.periodLabel}</span>
                              {backfillOnlyPaid ? (
                                <Badge variant="outline" className="w-fit text-xs">
                                  Só controle — falta tesouraria
                                </Badge>
                              ) : orphanTreasuryPaid ? (
                                <Badge
                                  variant="outline"
                                  className="w-fit text-xs border-amber-500 text-amber-700"
                                >
                                  Pago — receita não lançada no caixa
                                </Badge>
                              ) : controlOnlyPaid ? (
                                <Badge variant="outline" className="w-fit text-xs">
                                  Pago — somente controle
                                </Badge>
                              ) : isHistorical && !paidViaTreasury && entry.status === 'paid' ? (
                                <Badge variant="outline" className="w-fit text-xs">
                                  Só controle
                                </Badge>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell>{formatDateBR(entry.dueDate)}</TableCell>
                          <TableCell className="font-mono">
                            {formatCurrencyBRL(entry.expectedAmount)}
                          </TableCell>
                          <TableCell className="font-mono text-green-700">
                            {formatCurrencyBRL(entry.paidAmount)}
                          </TableCell>
                          <TableCell className="font-mono text-amber-700">
                            {entry.remainingAmount > 0
                              ? formatCurrencyBRL(entry.remainingAmount)
                              : '—'}
                          </TableCell>
                          <TableCell>{statusBadge(entry.status)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-wrap justify-end gap-1">
                            {primary ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onEditContribution(primary)}
                              >
                                <Pencil className="mr-1 h-3 w-3" />
                                Editar
                              </Button>
                            ) : entry.remainingAmount > 0 ? (
                              <>
                                {canControlOnlySettle ? (
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    disabled={saving}
                                    onClick={() => handleControlOnlySettle(entry)}
                                  >
                                    Quitar (só controle)
                                  </Button>
                                ) : null}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    onRegisterPayment({
                                      brotherId: brotherId!,
                                      brotherName:
                                        brother?.full_name?.trim() ||
                                        schedule?.brotherName ||
                                        'Irmão',
                                      month:
                                        CONTRIBUTION_MONTHS[entry.month - 1] ??
                                        String(entry.month),
                                      year: entry.year,
                                    })
                                  }
                                >
                                  <Plus className="mr-1 h-3 w-3" />
                                  Lançar
                                </Button>
                              </>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}

          {historicalPeriods.length > 0 ? (
            <Collapsible open={backfillOpen} onOpenChange={setBackfillOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="flex w-full items-center justify-between px-2 text-sm text-muted-foreground"
                >
                  Migrar planilha antiga (jan–mai/{MEMBERSHIP_TRACKING_START_YEAR}) — sem
                  tesouraria
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 transition-transform',
                      backfillOpen && 'rotate-180',
                    )}
                  />
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
                      {historicalPeriods.map((period) => {
                        const key = periodKey(period.year, period.month)
                        return (
                          <TableRow key={key} className="bg-muted/20">
                            <TableCell className="font-medium">
                              {period.periodLabel}
                            </TableCell>
                            <TableCell>
                              <Select
                                value={
                                  choices[key] ?? (period.paid ? 'paid' : 'unpaid')
                                }
                                onValueChange={(value: PeriodChoice) =>
                                  setChoices((prev) => ({
                                    ...prev,
                                    [key]: value,
                                  }))
                                }
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
                    onClick={handleSaveHistorical}
                    disabled={saving || !brotherId}
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
          ) : null}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

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
        onConfirm={handleBatchSettle}
      />
    </>
  )
}
