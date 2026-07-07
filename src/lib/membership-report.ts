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

export { membershipStatusLabel }
