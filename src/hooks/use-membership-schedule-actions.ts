import { useState } from 'react'
import type { Contribution } from '@/lib/data'
import { todayLocalISODate } from '@/lib/format-utils'
import {
  CONTRIBUTION_MONTHS,
  saveContribution,
  type ApprovedBrotherOption,
} from '@/lib/contribution-payments'
import { saveMembershipBackfillPeriods } from '@/lib/membership-history-backfill'
import {
  periodKey,
  saveBatchContributionPayment,
  type BatchSettlePeriod,
} from '@/lib/membership-batch-settle'
import type {
  MembershipBackfillPeriod,
  MembershipFeeScheduleSettings,
  MembershipScheduleEntry,
} from '@/lib/membership-schedule'
import {
  contributionsForPeriod,
  type PeriodChoice,
} from '@/lib/membership-schedule-rows'

interface UseMembershipScheduleActionsParams {
  brotherId: string | null
  brother: ApprovedBrotherOption | undefined
  feeSettings: MembershipFeeScheduleSettings
  brotherContributions: Contribution[]
  historicalPeriods: MembershipBackfillPeriod[]
  choices: Record<string, PeriodChoice>
  selectedOpenPeriods: BatchSettlePeriod[]
  onSaved: () => void | Promise<void>
  clearSelection: () => void
}

/** Gravações disparadas pelo cronograma: migração da planilha, lote e "só controle". */
export function useMembershipScheduleActions({
  brotherId,
  brother,
  feeSettings,
  brotherContributions,
  historicalPeriods,
  choices,
  selectedOpenPeriods,
  onSaved,
  clearSelection,
}: UseMembershipScheduleActionsParams) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const brotherName = brother?.full_name?.trim() || 'Irmão'

  async function saveHistorical() {
    if (!brotherId || !brother || historicalPeriods.length === 0) return
    setSaving(true)
    setError(null)
    try {
      await saveMembershipBackfillPeriods({
        brotherId,
        brotherName,
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

  async function batchSettle(params: {
    paymentDate: string
    accountId: string
    notes: string
  }) {
    if (!brotherId || !brother) return
    await saveBatchContributionPayment({
      brotherId,
      brotherName,
      periods: selectedOpenPeriods,
      paymentDate: params.paymentDate,
      accountId: params.accountId,
      notes: params.notes,
      existingContributions: brotherContributions,
    })
    clearSelection()
    await onSaved()
  }

  async function controlOnlySettle(entry: MembershipScheduleEntry) {
    if (!brotherId || !brother) return

    const monthName = CONTRIBUTION_MONTHS[entry.month - 1] ?? String(entry.month)
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
      const primary = contributionsForPeriod(
        brotherContributions,
        entry.year,
        entry.month,
      )[0]

      await saveContribution(
        {
          brotherId,
          brotherName,
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

  return { saving, error, setError, saveHistorical, batchSettle, controlOnlySettle }
}
