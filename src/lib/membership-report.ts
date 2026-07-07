import type { Contribution } from '@/lib/data'
import { monthNameToNumber } from '@/lib/contribution-payments'
import {
  buildOverdueBrotherAlerts,
  membershipStatusLabel,
  type BrotherMembershipSchedule,
  type MembershipScheduleEntry,
  type OverdueBrotherAlert,
} from '@/lib/membership-schedule'

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

export interface MembershipBrotherStatementData {
  brotherId: string
  brotherName: string
  generatedAt: string
  schedule: BrotherMembershipSchedule
  contributions: Contribution[]
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
  referenceDate: Date = new Date(),
): MembershipBrotherStatementData {
  const brotherContributions = contributions
    .filter((contribution) => contribution.brotherId === brotherId)
    .sort((left, right) => {
      if (left.year !== right.year) return right.year - left.year
      return monthNameToNumber(right.month) - monthNameToNumber(left.month)
    })

  return {
    brotherId,
    brotherName,
    generatedAt: referenceDate.toISOString(),
    schedule,
    contributions: brotherContributions,
  }
}

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
