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
import { Alert, AlertDescription } from '@/components/ui/alert'
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
import { CalendarDays, Info, Loader2, Pencil, Plus } from 'lucide-react'
import { formatCurrencyBRL } from '@/lib/member-payments'
import { formatDateBR } from '@/lib/format-utils'
import {
  buildMembershipBackfillPeriods,
  buildMembershipScheduleForBrother,
  isMembershipHistoricalPeriod,
  membershipStatusLabel,
  MEMBERSHIP_TRACKING_START_MONTH,
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

function isRowSelectable(
  entry: MembershipScheduleEntry,
  isHistorical: boolean,
): boolean {
  if (isHistorical) return entry.status !== 'paid'
  return entry.remainingAmount > 0
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

  const treasuryPaidTotal = useMemo(
    () =>
      brotherContributions
        .filter(
          (c) =>
            c.status === 'Pago' &&
            !isMembershipHistoricalPeriod(c.year, monthNameToNumber(c.month)),
        )
        .reduce((sum, c) => sum + c.amount, 0),
    [brotherContributions],
  )

  const openEntries = useMemo(
    () =>
      schedule?.entries.filter((e) => e.remainingAmount > 0) ?? [],
    [schedule],
  )

  const selectedProductionPeriods = useMemo((): BatchSettlePeriod[] => {
    if (!schedule) return []
    return schedule.entries
      .filter((entry) => {
        const key = periodKey(entry.year, entry.month)
        return (
          selectedKeys.has(key) &&
          !historicalKeys.has(key) &&
          entry.remainingAmount > 0
        )
      })
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year
        return a.month - b.month
      })
      .map((entry) => ({
        month: entry.month,
        year: entry.year,
        amount: entry.remainingAmount,
        periodLabel: entry.periodLabel,
      }))
  }, [schedule, selectedKeys, historicalKeys])

  const selectedHistoricalCount = useMemo(() => {
    let count = 0
    for (const key of selectedKeys) {
      if (!historicalKeys.has(key)) continue
      if (choices[key] !== 'paid') count++
    }
    return count
  }, [selectedKeys, historicalKeys, choices])

  const productionSelectionTotal = useMemo(
    () => selectedProductionPeriods.reduce((sum, p) => sum + p.amount, 0),
    [selectedProductionPeriods],
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
      .filter((entry) =>
        isRowSelectable(entry, historicalKeys.has(periodKey(entry.year, entry.month))),
      )
      .map((entry) => periodKey(entry.year, entry.month))
    setSelectedKeys(new Set(keys))
  }

  function markSelectedHistoricalPaid() {
    setChoices((prev) => {
      const next = { ...prev }
      for (const key of selectedKeys) {
        if (historicalKeys.has(key)) next[key] = 'paid'
      }
      return next
    })
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
      periods: selectedProductionPeriods,
      paymentDate: params.paymentDate,
      accountId: params.accountId,
      notes: params.notes,
      existingContributions: brotherContributions,
    })
    setSelectedKeys(new Set())
    await onSaved()
  }

  const cutoffLabel = `${String(MEMBERSHIP_TRACKING_START_MONTH).padStart(2, '0')}/${MEMBERSHIP_TRACKING_START_YEAR}`

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
              Selecione os meses quitados em um mesmo pagamento (ex.: R$ 580 =
              março + abril). Histórico jan–mai/{MEMBERSHIP_TRACKING_START_YEAR}{' '}
              não entra na tesouraria; de {cutoffLabel} em diante, use quitação
              com conta bancária.
            </DialogDescription>
          </DialogHeader>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              {openEntries.length > 0 ? (
                <>
                  <strong>{openEntries.length} mês(es) em aberto</strong> —{' '}
                  {openEntries.map((e) => e.periodLabel).join(', ')}. Marque os
                  meses pagos e use os botões abaixo da tabela.
                </>
              ) : (
                'Cronograma quitado nos meses exibidos.'
              )}{' '}
              Tesouraria (jun+):{' '}
              <strong>{formatCurrencyBRL(treasuryPaidTotal)}</strong>.
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
                  Selecionar todos em aberto
                </Button>
                {selectedHistoricalCount > 0 ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={markSelectedHistoricalPaid}
                  >
                    Marcar histórico selecionado como pago
                  </Button>
                ) : null}
                {selectedProductionPeriods.length > 0 ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setBatchSettleOpen(true)}
                  >
                    Quitar na tesouraria ({formatCurrencyBRL(productionSelectionTotal)})
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
                      <TableHead>Em aberto</TableHead>
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
                      const selectable = isRowSelectable(entry, isHistorical)
                      const checked = selectedKeys.has(key)

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
                              {isHistorical ? (
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
                          <TableCell>
                            {isHistorical ? (
                              <Select
                                value={
                                  choices[key] ??
                                  (entry.status === 'paid' ? 'paid' : 'unpaid')
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
                            ) : (
                              statusBadge(entry.status)
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {isHistorical ? (
                              <span className="text-xs text-muted-foreground">
                                Salve histórico
                              </span>
                            ) : primary ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onEditContribution(primary)}
                              >
                                <Pencil className="mr-1 h-3 w-3" />
                                Editar
                              </Button>
                            ) : (
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
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
            <p className="text-xs text-muted-foreground text-left">
              Ex.: pagou R$ 580 em junho → marque março e abril (histórico) como
              pagos e salve; maio/junho permanecem em aberto até quitar.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
              {historicalPeriods.length > 0 ? (
                <Button onClick={handleSaveHistorical} disabled={saving || !brotherId}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar histórico (jan–mai)'
                  )}
                </Button>
              ) : null}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MembershipBatchSettleDialog
        open={batchSettleOpen}
        onOpenChange={setBatchSettleOpen}
        brotherName={brother?.full_name?.trim() || schedule?.brotherName || 'Irmão'}
        periods={selectedProductionPeriods}
        onConfirm={handleBatchSettle}
      />
    </>
  )
}
