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
} from '@/lib/membership-schedule'
import { saveMembershipBackfillPeriods } from '@/lib/membership-history-backfill'
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
    month: string
    year: number
  }) => void
  onEditContribution: (contribution: Contribution) => void
}

function monthNameToNumber(month: string): number {
  return CONTRIBUTION_MONTHS.indexOf(month as (typeof CONTRIBUTION_MONTHS)[number]) + 1
}

function periodKey(year: number, month: number) {
  return `${year}-${month}`
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

  function contributionsForPeriod(year: number, month: number) {
    return brotherContributions.filter(
      (c) => c.year === year && monthNameToNumber(c.month) === month,
    )
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

  const cutoffLabel = `${String(MEMBERSHIP_TRACKING_START_MONTH).padStart(2, '0')}/${MEMBERSHIP_TRACKING_START_YEAR}`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Cronograma — {brother?.full_name?.trim() || 'Irmão'}
          </DialogTitle>
          <DialogDescription>
            Ajuste jan–mai/{MEMBERSHIP_TRACKING_START_YEAR} apenas para controle
            (não entra na tesouraria). De {cutoffLabel} em diante, use
            lançamentos com conta bancária para registrar receita real.
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Meses anteriores a {cutoffLabel}: marque <strong>Pago</strong> ou{' '}
            <strong>Não pago</strong> conforme a planilha antiga — sem impacto no
            saldo. Total na tesouraria (jun+):{' '}
            <strong>{formatCurrencyBRL(treasuryPaidTotal)}</strong>.
          </AlertDescription>
        </Alert>

        {!schedule || schedule.entries.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhum período no cronograma deste irmão.
          </p>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
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

                  return (
                    <TableRow
                      key={key}
                      className={cn(
                        isHistorical && 'bg-muted/30',
                        entry.status === 'overdue' && 'bg-destructive/5',
                      )}
                    >
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
                            Salve abaixo
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
        )}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <p className="text-xs text-muted-foreground text-left">
            Vencimento dia {feeSettings.dueDay}, sem juros. Lembretes automáticos
            consideram o cronograma completo.
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
  )
}
