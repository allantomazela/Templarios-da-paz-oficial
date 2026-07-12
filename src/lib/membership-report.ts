import type { Contribution } from '@/lib/data'
import { monthNameToNumber } from '@/lib/contribution-payments'
import {
  getMemberPaymentCategoryLabel,
  getPaidMemberPayments,
  memberPaymentStatusLabel,
  sumPaidMemberPayments,
  type MemberPayment,
  type MemberPaymentType,
} from '@/lib/member-payments'
import {
  buildOverdueBrotherAlerts,
  MEMBERSHIP_OVERDUE_ESCALATION_MONTHS,
  membershipStatusLabel,
  type BrotherMembershipSchedule,
  type MembershipScheduleEntry,
  type OverdueBrotherAlert,
} from '@/lib/membership-schedule'

export interface BrotherStatementTypeSummary {
  paidTotal: number
  paidCount: number
  openCount: number
}

export interface MembershipBrotherStatementData {
  brotherId: string
  brotherName: string
  generatedAt: string
  schedule: BrotherMembershipSchedule
  contributions: Contribution[]
  memberPayments: MemberPayment[]
  paidPayments: MemberPayment[]
  totalPaidAll: number
  summaryByType: Record<MemberPaymentType, BrotherStatementTypeSummary>
}

export interface MembershipOverdueReportSummary {
  brotherCount: number
  totalOverdueAmount: number
  escalationCount: number
  generatedAt: string
}

export interface MembershipOverdueReportData {
  summary: MembershipOverdueReportSummary
  alerts: OverdueBrotherAlert[]
  schedulesByBrotherId: Record<string, BrotherMembershipSchedule>
}

function emptyTypeSummary(): BrotherStatementTypeSummary {
  return { paidTotal: 0, paidCount: 0, openCount: 0 }
}

export function buildBrotherStatementSummaryByType(
  memberPayments: MemberPayment[],
): Record<MemberPaymentType, BrotherStatementTypeSummary> {
  const summary: Record<MemberPaymentType, BrotherStatementTypeSummary> = {
    monthly: emptyTypeSummary(),
    charity: emptyTypeSummary(),
    ceremony: emptyTypeSummary(),
    agape: emptyTypeSummary(),
  }

  for (const payment of memberPayments) {
    const bucket = summary[payment.type]
    if (payment.status === 'paid') {
      bucket.paidTotal += payment.amount
      bucket.paidCount += 1
    } else {
      bucket.openCount += 1
    }
  }

  return summary
}

export function filterMemberPaymentsByType(
  payments: MemberPayment[],
  type: MemberPaymentType,
): MemberPayment[] {
  return payments.filter((payment) => payment.type === type)
}

export function buildMembershipOverdueReportData(
  schedules: BrotherMembershipSchedule[],
  referenceDate: Date = new Date(),
): MembershipOverdueReportData {
  const alerts = buildOverdueBrotherAlerts(schedules)
  const schedulesByBrotherId = Object.fromEntries(
    schedules.map((schedule) => [schedule.brotherId, schedule]),
  )

  return {
    summary: {
      brotherCount: alerts.length,
      totalOverdueAmount: alerts.reduce((sum, alert) => sum + alert.overdueAmount, 0),
      escalationCount: alerts.filter((alert) => alert.requiresEscalation).length,
      generatedAt: referenceDate.toISOString(),
    },
    alerts,
    schedulesByBrotherId,
  }
}

export function getOverdueEntriesForBrother(
  data: MembershipOverdueReportData,
  brotherId: string,
): MembershipScheduleEntry[] {
  return data.schedulesByBrotherId[brotherId]?.overdueEntries ?? []
}

export function buildMembershipBrotherStatementData(
  brotherId: string,
  brotherName: string,
  schedule: BrotherMembershipSchedule,
  contributions: Contribution[],
  memberPayments: MemberPayment[] = [],
  referenceDate: Date = new Date(),
): MembershipBrotherStatementData {
  const brotherContributions = contributions
    .filter((contribution) => contribution.brotherId === brotherId)
    .sort((left, right) => {
      if (left.year !== right.year) return right.year - left.year
      return monthNameToNumber(right.month) - monthNameToNumber(left.month)
    })

  const paidPayments = getPaidMemberPayments(memberPayments)

  return {
    brotherId,
    brotherName,
    generatedAt: referenceDate.toISOString(),
    schedule,
    contributions: brotherContributions,
    memberPayments,
    paidPayments,
    totalPaidAll: sumPaidMemberPayments(memberPayments),
    summaryByType: buildBrotherStatementSummaryByType(memberPayments),
  }
}

export { getMemberPaymentCategoryLabel, memberPaymentStatusLabel }

export function membershipContributionStatusLabel(
  status: Contribution['status'],
): string {
  switch (status) {
    case 'Pago':
      return 'Pago'
    case 'Atrasado':
      return 'Em atraso'
    case 'Pendente':
      return 'Pendente'
    default:
      return status
  }
}

export function sortAlertsByPriority(
  alerts: OverdueBrotherAlert[],
): OverdueBrotherAlert[] {
  return [...alerts].sort((left, right) => {
    if (left.requiresEscalation !== right.requiresEscalation) {
      return left.requiresEscalation ? -1 : 1
    }
    if (right.overdueCount !== left.overdueCount) {
      return right.overdueCount - left.overdueCount
    }
    return left.brotherName.localeCompare(right.brotherName, 'pt-BR')
  })
}

export function formatOverdueLabels(labels: string[]): string {
  return labels.join(', ')
}

export type MembershipSituationFilter =
  | 'all'
  | 'up_to_date'
  | 'overdue'
  | 'pending'

export type MembershipBrotherSituation =
  | 'up_to_date'
  | 'overdue'
  | 'pending'
  | 'no_schedule'

export interface MembershipStatusReportFilters {
  situation: MembershipSituationFilter
  minOverdueMonths: number
  escalationOnly: boolean
  searchTerm: string
}

export const DEFAULT_MEMBERSHIP_STATUS_REPORT_FILTERS: MembershipStatusReportFilters =
  {
    situation: 'all',
    minOverdueMonths: 0,
    escalationOnly: false,
    searchTerm: '',
  }

export interface MembershipStatusReportRow {
  brotherId: string
  brotherName: string
  situation: MembershipBrotherSituation
  situationLabel: string
  overdueMonthCount: number
  totalOverdue: number
  totalOpen: number
  totalPaid: number
  lastPaidPeriod: string | null
  overduePeriodsLabel: string
  requiresEscalation: boolean
}

export interface MembershipStatusReportSummary {
  totalBrothers: number
  upToDateCount: number
  overdueCount: number
  pendingCount: number
  noScheduleCount: number
  totalOverdueAmount: number
  escalationCount: number
  generatedAt: string
}

export interface MembershipStatusReportData {
  filters: MembershipStatusReportFilters
  summary: MembershipStatusReportSummary
  rows: MembershipStatusReportRow[]
}

export function resolveBrotherSituation(
  schedule: BrotherMembershipSchedule,
): MembershipBrotherSituation {
  if (schedule.entries.length === 0) return 'no_schedule'
  if (schedule.overdueMonthCount > 0) return 'overdue'
  if (schedule.totalOpen > 0) return 'pending'
  return 'up_to_date'
}

export function membershipBrotherSituationLabel(
  situation: MembershipBrotherSituation,
): string {
  switch (situation) {
    case 'up_to_date':
      return 'Em dia'
    case 'overdue':
      return 'Em atraso'
    case 'pending':
      return 'Com pendências'
    case 'no_schedule':
      return 'Sem cronograma'
    default:
      return situation
  }
}

function latestPaidPeriod(
  schedule: BrotherMembershipSchedule,
): string | null {
  const latestPaid = schedule.entries.find((entry) => entry.status === 'paid')
  return latestPaid?.periodLabel ?? null
}

export function buildMembershipStatusReportRow(
  schedule: BrotherMembershipSchedule,
): MembershipStatusReportRow {
  const situation = resolveBrotherSituation(schedule)
  return {
    brotherId: schedule.brotherId,
    brotherName: schedule.brotherName,
    situation,
    situationLabel: membershipBrotherSituationLabel(situation),
    overdueMonthCount: schedule.overdueMonthCount,
    totalOverdue: schedule.totalOverdue,
    totalOpen: schedule.totalOpen,
    totalPaid: schedule.totalPaid,
    lastPaidPeriod: latestPaidPeriod(schedule),
    overduePeriodsLabel: formatOverdueLabels(
      schedule.overdueEntries.map((entry) => entry.periodLabel),
    ),
    requiresEscalation:
      schedule.overdueMonthCount >= MEMBERSHIP_OVERDUE_ESCALATION_MONTHS,
  }
}

export function filterMembershipStatusReportRows(
  rows: MembershipStatusReportRow[],
  filters: MembershipStatusReportFilters,
): MembershipStatusReportRow[] {
  const search = filters.searchTerm.trim().toLowerCase()

  return rows.filter((row) => {
    if (filters.situation === 'up_to_date' && row.situation !== 'up_to_date') {
      return false
    }
    if (filters.situation === 'overdue' && row.situation !== 'overdue') {
      return false
    }
    if (filters.situation === 'pending' && row.situation !== 'pending') {
      return false
    }
    if (filters.minOverdueMonths > 0 && row.overdueMonthCount < filters.minOverdueMonths) {
      return false
    }
    if (filters.escalationOnly && !row.requiresEscalation) {
      return false
    }
    if (search && !row.brotherName.toLowerCase().includes(search)) {
      return false
    }
    return true
  })
}

export function buildMembershipStatusReportData(
  schedules: BrotherMembershipSchedule[],
  filters: MembershipStatusReportFilters = DEFAULT_MEMBERSHIP_STATUS_REPORT_FILTERS,
  referenceDate: Date = new Date(),
): MembershipStatusReportData {
  const allRows = schedules.map(buildMembershipStatusReportRow)
  const rows = filterMembershipStatusReportRows(allRows, filters)

  return {
    filters,
    summary: {
      totalBrothers: rows.length,
      upToDateCount: rows.filter((row) => row.situation === 'up_to_date').length,
      overdueCount: rows.filter((row) => row.situation === 'overdue').length,
      pendingCount: rows.filter((row) => row.situation === 'pending').length,
      noScheduleCount: rows.filter((row) => row.situation === 'no_schedule').length,
      totalOverdueAmount: rows.reduce((sum, row) => sum + row.totalOverdue, 0),
      escalationCount: rows.filter((row) => row.requiresEscalation).length,
      generatedAt: referenceDate.toISOString(),
    },
    rows: rows.sort((left, right) => {
      if (left.situation === 'overdue' && right.situation !== 'overdue') return -1
      if (right.situation === 'overdue' && left.situation !== 'overdue') return 1
      if (right.overdueMonthCount !== left.overdueMonthCount) {
        return right.overdueMonthCount - left.overdueMonthCount
      }
      return left.brotherName.localeCompare(right.brotherName, 'pt-BR')
    }),
  }
}

export { membershipStatusLabel }
