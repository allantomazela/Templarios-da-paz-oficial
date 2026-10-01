import {
  buildOverdueBrotherAlerts,
  buildReminderAlerts,
  type BrotherMembershipSchedule,
  type OverdueBrotherAlert,
} from '../_shared/membership-schedule.ts'

/**
 * cron: job diário, respeita momento/dias configurados.
 * manual: disparo do administrador, alcança todos com mensalidade em atraso.
 */
export type ReminderMode = 'cron' | 'manual'

export type ReminderFrequency = 'before' | 'on_due' | 'after'

export interface ReminderProfile {
  fullName: string | null
  email: string | null
}

export interface ReminderRecipient {
  brotherId: string
  brotherName: string
  email: string | null
  overdueLabels: string[]
  overdueAmount: number
  overdueCount: number
  alreadyRemindedThisMonth: boolean
}

export function selectReminderAlerts(
  schedules: BrotherMembershipSchedule[],
  approvedIds: Set<string>,
  mode: ReminderMode,
  frequency: ReminderFrequency,
  days: number,
  referenceDate: Date = new Date(),
): OverdueBrotherAlert[] {
  const alerts =
    mode === 'manual'
      ? buildOverdueBrotherAlerts(schedules)
      : buildReminderAlerts(schedules, frequency, days, referenceDate)

  return alerts.filter((alert) => approvedIds.has(alert.brotherId))
}

export function buildReminderRecipients(
  alerts: OverdueBrotherAlert[],
  profileById: Map<string, ReminderProfile>,
  remindedThisMonth: Set<string>,
): ReminderRecipient[] {
  return alerts.map((alert) => {
    const profile = profileById.get(alert.brotherId)
    return {
      brotherId: alert.brotherId,
      brotherName: profile?.fullName?.trim() || alert.brotherName,
      email: profile?.email?.trim().toLowerCase() || null,
      overdueLabels: alert.overdueLabels,
      overdueAmount: alert.overdueAmount,
      overdueCount: alert.overdueCount,
      alreadyRemindedThisMonth: remindedThisMonth.has(alert.brotherId),
    }
  })
}
