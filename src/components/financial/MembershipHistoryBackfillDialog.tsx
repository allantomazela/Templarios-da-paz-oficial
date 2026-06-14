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
import { Loader2, History } from 'lucide-react'
import { formatCurrencyBRL } from '@/lib/member-payments'
import {
  buildMembershipBackfillPeriods,
  MEMBERSHIP_TRACKING_START_MONTH,
  MEMBERSHIP_TRACKING_START_YEAR,
} from '@/lib/membership-schedule'
import { saveMembershipBackfillPeriods } from '@/lib/membership-history-backfill'
import type { ApprovedBrotherOption } from '@/lib/contribution-payments'
import type { Contribution } from '@/lib/data'
import type { MembershipFeeScheduleSettings } from '@/lib/membership-schedule'

interface MembershipHistoryBackfillDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  brothers: ApprovedBrotherOption[]
  contributions: Contribution[]
  feeSettings: MembershipFeeScheduleSettings
  defaultBrotherId?: string | null
  onSaved: () => void | Promise<void>
}

type PeriodChoice = 'paid' | 'unpaid'

export function MembershipHistoryBackfillDialog({
  open,
  onOpenChange,
  brothers,
  contributions,
  feeSettings,
  defaultBrotherId,
  onSaved,
}: MembershipHistoryBackfillDialogProps) {
  const [brotherId, setBrotherId] = useState<string>('')
  const [choices, setChoices] = useState<Record<string, PeriodChoice>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setBrotherId(defaultBrotherId ?? brothers[0]?.id ?? '')
      setError(null)
    }
  }, [open, defaultBrotherId, brothers])

  const selectedBrother = brothers.find((b) => b.id === brotherId)

  const periods = useMemo(() => {
    if (!brotherId) return []
    return buildMembershipBackfillPeriods(
      selectedBrother?.created_at,
      feeSettings,
      contributions,
      brotherId,
    )
  }, [brotherId, selectedBrother?.created_at, feeSettings, contributions])

  useEffect(() => {
    if (!open || periods.length === 0) return
    const initial: Record<string, PeriodChoice> = {}
    for (const period of periods) {
      const key = `${period.year}-${period.month}`
      initial[key] = period.paid ? 'paid' : 'unpaid'
    }
    setChoices(initial)
  }, [open, periods])

  const periodKey = (year: number, month: number) => `${year}-${month}`

  async function handleSave() {
    if (!brotherId || !selectedBrother) return
    setSaving(true)
    setError(null)
    try {
      await saveMembershipBackfillPeriods({
        brotherId,
        brotherName: selectedBrother.full_name?.trim() || 'Irmão',
        settings: feeSettings,
        existingContributions: contributions.filter((c) => c.brotherId === brotherId),
        periods: periods.map((period) => ({
          month: period.month,
          year: period.year,
          paid: choices[periodKey(period.year, period.month)] === 'paid',
        })),
      })
      await onSaved()
      onOpenChange(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar histórico.')
    } finally {
      setSaving(false)
    }
  }

  const cutoffLabel = `${String(MEMBERSHIP_TRACKING_START_MONTH).padStart(2, '0')}/${MEMBERSHIP_TRACKING_START_YEAR}`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Regularizar histórico anterior a {cutoffLabel}
          </DialogTitle>
          <DialogDescription>
            Marque manualmente se cada mês antes de junho/{MEMBERSHIP_TRACKING_START_YEAR}{' '}
            foi pago ou não. Vencimento fixo dia {feeSettings.dueDay}, sem juros.
            A partir de junho o cronograma segue automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Irmão</label>
            <Select value={brotherId} onValueChange={setBrotherId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o irmão" />
              </SelectTrigger>
              <SelectContent>
                {brothers.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.full_name?.trim() || 'Sem nome'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {periods.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhum mês anterior a junho/{MEMBERSHIP_TRACKING_START_YEAR} no
              cronograma deste irmão.
            </p>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Referência</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Situação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {periods.map((period) => {
                    const key = periodKey(period.year, period.month)
                    return (
                      <TableRow key={key}>
                        <TableCell className="font-medium">
                          {period.periodLabel}
                        </TableCell>
                        <TableCell className="font-mono">
                          {formatCurrencyBRL(period.expectedAmount)}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={choices[key] ?? (period.paid ? 'paid' : 'unpaid')}
                            onValueChange={(value: PeriodChoice) =>
                              setChoices((prev) => ({
                                ...prev,
                                [key]: value,
                              }))
                            }
                          >
                            <SelectTrigger className="w-[180px]">
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
          )}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || periods.length === 0 || !brotherId}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar histórico'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
