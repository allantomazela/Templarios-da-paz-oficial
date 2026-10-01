import { daysUntilDue, shortPeriodLabel } from '@/lib/membership-period'
import type {
  BrotherMembershipSchedule,
  MembershipScheduleEntry,
  OverdueBrotherAlert,
} from '@/lib/membership-schedule-types'

/** Tolerância de meses em atraso antes de mensagem de escalonamento no e-mail. */
export const MEMBERSHIP_OVERDUE_ESCALATION_MONTHS = 3

function selectReminderEntries(
  schedule: BrotherMembershipSchedule,
  frequency: 'before' | 'on_due' | 'after',
  safeDays: number,
  referenceDate: Date,
): MembershipScheduleEntry[] {
  if (frequency === 'after') {
    return schedule.overdueEntries.filter(
      (entry) => daysUntilDue(entry.dueDate, referenceDate) <= -safeDays,
    )
  }

  if (frequency === 'on_due') {
    return schedule.openEntries.filter(
      (entry) =>
        entry.status !== 'paid' &&
        daysUntilDue(entry.dueDate, referenceDate) === 0,
    )
  }

  return schedule.openEntries.filter((entry) => {
    if (entry.status === 'paid') return false
    const untilDue = daysUntilDue(entry.dueDate, referenceDate)
    return untilDue > 0 && untilDue <= safeDays
  })
}

function toAlert(
  schedule: BrotherMembershipSchedule,
  entries: MembershipScheduleEntry[],
): OverdueBrotherAlert {
  return {
    brotherId: schedule.brotherId,
    brotherName: schedule.brotherName,
    overdueCount: entries.length,
    overdueAmount: entries.reduce((sum, entry) => sum + entry.remainingAmount, 0),
    overdueLabels: entries.map((entry) =>
      shortPeriodLabel(entry.month, entry.year),
    ),
    oldestOverdueDueDate: entries[entries.length - 1]?.dueDate ?? null,
    requiresEscalation: entries.length >= MEMBERSHIP_OVERDUE_ESCALATION_MONTHS,
  }
}

export function buildReminderAlerts(
  schedules: BrotherMembershipSchedule[],
  frequency: 'before' | 'on_due' | 'after',
  days: number,
  referenceDate: Date = new Date(),
): OverdueBrotherAlert[] {
  const safeDays = Math.max(0, days)

  return schedules
    .map((schedule) => {
      const entries = selectReminderEntries(
        schedule,
        frequency,
        safeDays,
        referenceDate,
      )
      return entries.length > 0 ? toAlert(schedule, entries) : null
    })
    .filter((alert): alert is OverdueBrotherAlert => alert !== null)
    .sort((a, b) => b.overdueCount - a.overdueCount)
}

export function buildOverdueBrotherAlerts(
  schedules: BrotherMembershipSchedule[],
): OverdueBrotherAlert[] {
  return schedules
    .filter((s) => s.overdueMonthCount > 0)
    .map((s) => toAlert(s, s.overdueEntries))
    .sort((a, b) => b.overdueCount - a.overdueCount)
}
