import {
  buildDueDateIsoFromParts,
  isMembershipPastDue,
  MEMBERSHIP_HISTORICAL_NOTE,
  type MembershipFeeScheduleSettings,
} from '@/lib/membership-schedule'
import {
  CONTRIBUTION_MONTHS,
  fetchContributionsForProfile,
  saveContribution,
  type ContributionFormData,
} from '@/lib/contribution-payments'
import type { Contribution } from '@/lib/data'
import { todayLocalISODate } from '@/lib/format-utils'

export interface BackfillPeriodInput {
  month: number
  year: number
  paid: boolean
}

function monthNumberToName(month: number): string {
  return CONTRIBUTION_MONTHS[month - 1] ?? String(month)
}

function monthNameToNumber(month: string): number {
  return CONTRIBUTION_MONTHS.indexOf(month as (typeof CONTRIBUTION_MONTHS)[number]) + 1
}

function filterPeriodContributions(
  contributions: Contribution[],
  year: number,
  month: number,
): Contribution[] {
  return contributions.filter(
    (c) => c.year === year && monthNameToNumber(c.month) === month,
  )
}

export async function saveMembershipBackfillPeriods(params: {
  brotherId: string
  brotherName: string
  periods: BackfillPeriodInput[]
  settings: MembershipFeeScheduleSettings
  existingContributions?: Contribution[]
}): Promise<{ saved: number }> {
  const contributions =
    params.existingContributions ??
    (await fetchContributionsForProfile(params.brotherId))

  let saved = 0

  for (const period of params.periods) {
    const monthName = monthNumberToName(period.month)
    const existing = filterPeriodContributions(
      contributions,
      period.year,
      period.month,
    )
    const dueDate = buildDueDateIsoFromParts(
      period.year,
      period.month,
      params.settings.dueDay,
    )

    if (period.paid) {
      const primary = existing[0]
      const form: ContributionFormData = {
        brotherId: params.brotherId,
        brotherName: params.brotherName,
        month: monthName,
        year: period.year,
        amount: params.settings.defaultAmount,
        status: 'Pago',
        paymentDate: dueDate,
        notes: MEMBERSHIP_HISTORICAL_NOTE,
      }

      if (primary) {
        await saveContribution(form, {
          contributionId: primary.id,
          existingTransactionId: primary.transactionId,
        })
      } else {
        await saveContribution(form)
      }
      saved++
      continue
    }

    const unpaidStatus = isMembershipPastDue(dueDate)
      ? 'Atrasado'
      : 'Pendente'

    if (existing.length === 0) {
      await saveContribution({
        brotherId: params.brotherId,
        brotherName: params.brotherName,
        month: monthName,
        year: period.year,
        amount: params.settings.defaultAmount,
        status: unpaidStatus,
        notes: MEMBERSHIP_HISTORICAL_NOTE,
      })
      saved++
      continue
    }

    const primary = existing[0]
    if (primary.status === 'Pago' || primary.status !== unpaidStatus) {
      await saveContribution(
        {
          brotherId: params.brotherId,
          brotherName: params.brotherName,
          month: monthName,
          year: period.year,
          amount: params.settings.defaultAmount,
          status: unpaidStatus,
          notes: MEMBERSHIP_HISTORICAL_NOTE,
        },
        {
          contributionId: primary.id,
          existingTransactionId: primary.transactionId,
        },
      )
      saved++
    }
  }

  return { saved }
}

export function defaultBackfillPaymentDate(
  year: number,
  month: number,
  dueDay: number,
): string {
  return buildDueDateIsoFromParts(year, month, dueDay)
}

export { todayLocalISODate }
