import type { Contribution } from '@/lib/data'
import { MEMBERSHIP_LABELS } from '@/lib/membership-labels'
import {
  resolveContributionAmountForSituation,
  type MembershipSituation,
} from '@/lib/brother-membership-situation'
import {
  MEMBERSHIP_TRACKING_START_MONTH,
  MEMBERSHIP_TRACKING_START_YEAR,
} from '@/lib/membership-contribution-rules'
import {
  groupContributionsByPeriod,
  isMembershipMonthOverdue,
  isMembershipPeriodFuture,
  iterMonths,
  membershipMonthEndDueDateIso,
  monthKey,
  periodLabel,
  resolveScheduleEnd,
  resolveScheduleStart,
  startOfDay,
} from '@/lib/membership-period'
import type {
  BrotherMembershipSchedule,
  MembershipBackfillPeriod,
  MembershipFeeScheduleSettings,
  MembershipMonthStatus,
  MembershipScheduleEntry,
} from '@/lib/membership-schedule-types'

export type {
  BrotherMembershipSchedule,
  MembershipBackfillPeriod,
  MembershipFeeScheduleSettings,
  MembershipMonthStatus,
  MembershipScheduleEntry,
  OverdueBrotherAlert,
} from '@/lib/membership-schedule-types'
export {
  MEMBERSHIP_CONTROL_ONLY_NOTE,
  MEMBERSHIP_HISTORICAL_NOTE,
  MEMBERSHIP_TRACKING_START_MONTH,
  MEMBERSHIP_TRACKING_START_YEAR,
  contributionCountsInTreasury,
  isMembershipBackfillContribution,
  isMembershipControlOnlyContribution,
  isMembershipHistoricalPeriod,
  isOrphanTreasuryContribution,
} from '@/lib/membership-contribution-rules'
export {
  buildDueDateIsoFromParts,
  isMembershipMonthOverdue,
  isMembershipPastDue,
  isMembershipPeriodFuture,
  membershipMonthEndDueDateIso,
} from '@/lib/membership-period'
export {
  MEMBERSHIP_OVERDUE_ESCALATION_MONTHS,
  buildOverdueBrotherAlerts,
  buildReminderAlerts,
} from '@/lib/membership-alerts'

export function resolveScheduleExpectedAmount(
  settings: MembershipFeeScheduleSettings,
  situation?: MembershipSituation | null,
): number {
  if (!situation || situation === 'regular') {
    return settings.defaultAmount
  }
  const resolved = resolveContributionAmountForSituation(situation, {
    baseAmount: settings.baseAmount ?? settings.defaultAmount,
    sessionPackageAmount: settings.sessionPackageAmount ?? 0,
    defaultAmount: settings.defaultAmount,
  })
  return resolved ?? settings.defaultAmount
}

function resolveMonthStatus(
  paidAmount: number,
  expectedAmount: number,
  today: Date,
  year: number,
  month: number,
  hasManualOverdue: boolean,
): MembershipMonthStatus {
  if (paidAmount >= expectedAmount) return 'paid'

  if (isMembershipPeriodFuture(year, month, today)) return 'upcoming'

  // Atraso só quando o mês de referência fecha (ou marcado manualmente).
  const isPastDue = hasManualOverdue || isMembershipMonthOverdue(year, month, today)

  if (paidAmount > 0 && paidAmount < expectedAmount) {
    return isPastDue ? 'overdue' : 'partial'
  }

  if (isPastDue) return 'overdue'
  return 'upcoming'
}

function sumAmounts(contributions: Contribution[]): number {
  return contributions.reduce((sum, c) => sum + c.amount, 0)
}

/** Meses anteriores ao início do controle em produção (ex.: jan–mai/2026). */
export function buildMembershipBackfillPeriods(
  memberSince: string | null | undefined,
  settings: MembershipFeeScheduleSettings,
  contributions: Contribution[],
  brotherId: string,
  trackingStartYear = MEMBERSHIP_TRACKING_START_YEAR,
  trackingStartMonth = MEMBERSHIP_TRACKING_START_MONTH,
  situation?: MembershipSituation | null,
): MembershipBackfillPeriod[] {
  const brotherContributions = contributions.filter((c) => c.brotherId === brotherId)
  const memberSinceDate = memberSince ? new Date(memberSince) : null
  const start = resolveScheduleStart(memberSinceDate, brotherContributions)

  const endMonth = trackingStartMonth - 1
  if (endMonth < 1) return []

  const byPeriod = groupContributionsByPeriod(brotherContributions)
  const expectedAmount = resolveScheduleExpectedAmount(settings, situation)
  const periods: MembershipBackfillPeriod[] = []

  for (const { year, month } of iterMonths(
    start.year,
    start.month,
    trackingStartYear,
    endMonth,
  )) {
    const periodContributions = byPeriod.get(monthKey(year, month)) ?? []
    const paidAmount = sumAmounts(
      periodContributions.filter((c) => c.status === 'Pago'),
    )

    periods.push({
      month,
      year,
      periodLabel: periodLabel(month, year),
      expectedAmount,
      paid: paidAmount >= expectedAmount,
      hasLaunch: periodContributions.length > 0,
    })
  }

  return periods.sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year
    return a.month - b.month
  })
}

function buildScheduleEntry(
  year: number,
  month: number,
  periodContributions: Contribution[],
  expectedAmount: number,
  today: Date,
): MembershipScheduleEntry {
  const paidAmount = sumAmounts(
    periodContributions.filter((c) => c.status === 'Pago'),
  )
  const pendingAmount = sumAmounts(
    periodContributions.filter((c) => c.status !== 'Pago'),
  )
  const hasManualOverdue = periodContributions.some(
    (c) => c.status === 'Atrasado',
  )
  const theoreticalRemaining = Math.max(0, expectedAmount - paidAmount)

  return {
    month,
    year,
    periodLabel: periodLabel(month, year),
    dueDate: membershipMonthEndDueDateIso(year, month),
    expectedAmount,
    paidAmount,
    pendingAmount,
    remainingAmount: Math.max(theoreticalRemaining, pendingAmount),
    status: resolveMonthStatus(
      paidAmount,
      expectedAmount,
      today,
      year,
      month,
      hasManualOverdue,
    ),
    paymentsCount: periodContributions.length,
  }
}

function summarizeSchedule(
  brotherId: string,
  brotherName: string,
  entries: MembershipScheduleEntry[],
): BrotherMembershipSchedule {
  const overdueEntries = entries.filter((e) => e.status === 'overdue')
  const openEntries = entries.filter(
    (e) => e.status === 'upcoming' || e.status === 'partial',
  )
  const paidEntries = entries.filter((e) => e.status === 'paid')

  return {
    brotherId,
    brotherName,
    entries,
    overdueEntries,
    openEntries,
    paidEntries,
    totalPaid: entries.reduce((sum, e) => sum + e.paidAmount, 0),
    totalOverdue: overdueEntries.reduce((sum, e) => sum + e.remainingAmount, 0),
    totalOpen: openEntries.reduce((sum, e) => sum + e.remainingAmount, 0),
    overdueMonthCount: overdueEntries.length,
    isUpToDate: overdueEntries.length === 0,
  }
}

export function buildMembershipScheduleForBrother(
  brotherId: string,
  brotherName: string,
  contributions: Contribution[],
  settings: MembershipFeeScheduleSettings,
  memberSince?: string | null,
  situation?: MembershipSituation | null,
): BrotherMembershipSchedule {
  const brotherContributions = contributions.filter((c) => c.brotherId === brotherId)
  const byPeriod = groupContributionsByPeriod(brotherContributions)
  const memberSinceDate = memberSince ? new Date(memberSince) : null
  const start = resolveScheduleStart(memberSinceDate, brotherContributions)

  const now = new Date()
  const end = resolveScheduleEnd(now, brotherContributions, situation)
  const today = startOfDay(now)
  const expectedAmount = resolveScheduleExpectedAmount(settings, situation)

  const months = end
    ? iterMonths(start.year, start.month, end.year, end.month)
    : []
  const entries: MembershipScheduleEntry[] = []

  for (const { year, month } of months) {
    const periodContributions = byPeriod.get(monthKey(year, month)) ?? []
    entries.push(
      buildScheduleEntry(year, month, periodContributions, expectedAmount, today),
    )
  }

  entries.sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year
    return b.month - a.month
  })

  return summarizeSchedule(brotherId, brotherName, entries)
}

export function buildAllMembershipSchedules(
  contributions: Contribution[],
  brothers: {
    id: string
    full_name: string | null
    created_at?: string | null
    membershipSituation?: MembershipSituation | null
  }[],
  brotherNames: Record<string, string>,
  settings: MembershipFeeScheduleSettings,
): BrotherMembershipSchedule[] {
  const brotherIds = new Set([
    ...brothers.map((b) => b.id),
    ...contributions.map((c) => c.brotherId),
  ])

  return [...brotherIds]
    .map((brotherId) => {
      const brother = brothers.find((b) => b.id === brotherId)
      const name =
        brotherNames[brotherId] || brother?.full_name || 'Sem nome'
      // Fora da lista de cobráveis (bloqueado/desligado): só o histórico lançado.
      const situation = brother ? brother.membershipSituation : 'desligado'

      return buildMembershipScheduleForBrother(
        brotherId,
        name,
        contributions,
        settings,
        brother?.created_at,
        situation,
      )
    })
    .sort((a, b) => a.brotherName.localeCompare(b.brotherName, 'pt-BR'))
}

export function membershipStatusLabel(status: MembershipMonthStatus): string {
  return MEMBERSHIP_LABELS[status]
}
