export interface Contribution {
  id: string
  brotherId: string
  month: string
  year: number
  amount: number
  status: 'Pago' | 'Pendente' | 'Atrasado'
}

export type MembershipMonthStatus =
  | 'paid'
  | 'partial'
  | 'pending'
  | 'overdue'

export interface MembershipFeeScheduleSettings {
  defaultAmount: number
  dueDay: number
}

export const DEFAULT_MEMBERSHIP_DUE_DAY = 10

const CONTRIBUTION_MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
] as const

function monthNameToNumber(month: string): number {
  return CONTRIBUTION_MONTHS.indexOf(month as (typeof CONTRIBUTION_MONTHS)[number]) + 1
}

export interface MembershipScheduleEntry {
  month: number
  year: number
  periodLabel: string
  dueDate: string
  expectedAmount: number
  paidAmount: number
  pendingAmount: number
  remainingAmount: number
  status: MembershipMonthStatus
  paymentsCount: number
}

export interface BrotherMembershipSchedule {
  brotherId: string
  brotherName: string
  entries: MembershipScheduleEntry[]
  overdueEntries: MembershipScheduleEntry[]
  openEntries: MembershipScheduleEntry[]
  paidEntries: MembershipScheduleEntry[]
  totalPaid: number
  totalOverdue: number
  totalOpen: number
  overdueMonthCount: number
  isUpToDate: boolean
}

export interface OverdueBrotherAlert {
  brotherId: string
  brotherName: string
  overdueCount: number
  overdueAmount: number
  overdueLabels: string[]
  oldestOverdueDueDate: string | null
}

function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

function periodLabel(month: number, year: number): string {
  return `${CONTRIBUTION_MONTHS[month - 1] ?? month}/${year}`
}

function shortPeriodLabel(month: number, year: number): string {
  const name = CONTRIBUTION_MONTHS[month - 1] ?? String(month)
  return `${name.slice(0, 3)}/${year}`
}

function daysUntilDue(dueDateIso: string, referenceDate: Date): number {
  const [y, m, d] = dueDateIso.split('-').map(Number)
  const dueStart = new Date(y, m - 1, d)
  const refStart = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
  )
  return Math.round((dueStart.getTime() - refStart.getTime()) / 86400000)
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
      let entries: MembershipScheduleEntry[] = []

      if (frequency === 'after') {
        entries = schedule.overdueEntries.filter(
          (entry) => daysUntilDue(entry.dueDate, referenceDate) <= -safeDays,
        )
      } else if (frequency === 'on_due') {
        entries = schedule.openEntries.filter(
          (entry) =>
            entry.status !== 'paid' &&
            daysUntilDue(entry.dueDate, referenceDate) === 0,
        )
      } else {
        entries = schedule.openEntries.filter((entry) => {
          if (entry.status === 'paid') return false
          const untilDue = daysUntilDue(entry.dueDate, referenceDate)
          return untilDue > 0 && untilDue <= safeDays
        })
      }

      if (entries.length === 0) return null

      return {
        brotherId: schedule.brotherId,
        brotherName: schedule.brotherName,
        overdueCount: entries.length,
        overdueAmount: entries.reduce((sum, entry) => sum + entry.remainingAmount, 0),
        overdueLabels: entries.map((entry) =>
          shortPeriodLabel(entry.month, entry.year),
        ),
        oldestOverdueDueDate:
          entries[entries.length - 1]?.dueDate ?? null,
      }
    })
    .filter((alert): alert is OverdueBrotherAlert => alert !== null)
    .sort((a, b) => b.overdueCount - a.overdueCount)
}

function buildDueDateIso(year: number, month: number, dueDay: number): string {
  const day = Math.min(dueDay, 28)
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function isMembershipPastDue(
  dueDateIso: string,
  referenceDate: Date = new Date(),
): boolean {
  const [y, m, d] = dueDateIso.split('-').map(Number)
  const dueStart = new Date(y, m - 1, d)
  return startOfDay(referenceDate).getTime() > dueStart.getTime()
}

function* iterMonths(
  fromYear: number,
  fromMonth: number,
  toYear: number,
  toMonth: number,
): Generator<{ year: number; month: number }> {
  let year = fromYear
  let month = fromMonth

  while (year < toYear || (year === toYear && month <= toMonth)) {
    yield { year, month }
    month += 1
    if (month > 12) {
      month = 1
      year += 1
    }
  }
}

function resolveScheduleStart(
  memberSince: Date | null,
  contributions: Contribution[],
): { year: number; month: number } {
  const now = new Date()
  let startYear = now.getFullYear()
  let startMonth = now.getMonth() + 1

  if (memberSince) {
    startYear = memberSince.getFullYear()
    startMonth = memberSince.getMonth() + 1
  }

  for (const c of contributions) {
    const m = monthNameToNumber(c.month)
    if (c.year < startYear || (c.year === startYear && m < startMonth)) {
      startYear = c.year
      startMonth = m
    }
  }

  return { year: startYear, month: startMonth }
}

function groupContributionsByPeriod(
  contributions: Contribution[],
): Map<string, Contribution[]> {
  const map = new Map<string, Contribution[]>()

  for (const c of contributions) {
    const month = monthNameToNumber(c.month)
    const key = monthKey(c.year, month)
    const list = map.get(key) ?? []
    list.push(c)
    map.set(key, list)
  }

  return map
}

function resolveMonthStatus(
  paidAmount: number,
  pendingAmount: number,
  expectedAmount: number,
  dueDateIso: string,
  today: Date,
): MembershipMonthStatus {
  if (paidAmount >= expectedAmount) return 'paid'

  const isPastDue = isMembershipPastDue(dueDateIso, today)

  if (paidAmount > 0 && paidAmount < expectedAmount) {
    return isPastDue ? 'overdue' : 'partial'
  }

  if (isPastDue) return 'overdue'
  if (pendingAmount > 0 || paidAmount === 0) return 'pending'

  return 'pending'
}

export function buildMembershipScheduleForBrother(
  brotherId: string,
  brotherName: string,
  contributions: Contribution[],
  settings: MembershipFeeScheduleSettings,
  memberSince?: string | null,
): BrotherMembershipSchedule {
  const brotherContributions = contributions.filter((c) => c.brotherId === brotherId)
  const byPeriod = groupContributionsByPeriod(brotherContributions)
  const memberSinceDate = memberSince ? new Date(memberSince) : null
  const start = resolveScheduleStart(memberSinceDate, brotherContributions)

  const now = new Date()
  const endYear = now.getFullYear()
  const endMonth = now.getMonth() + 1
  const today = startOfDay(now)
  const dueDay = settings.dueDay || DEFAULT_MEMBERSHIP_DUE_DAY
  const expectedAmount = settings.defaultAmount

  const entries: MembershipScheduleEntry[] = []

  for (const { year, month } of iterMonths(
    start.year,
    start.month,
    endYear,
    endMonth,
  )) {
    const key = monthKey(year, month)
    const periodContributions = byPeriod.get(key) ?? []

    const paidAmount = periodContributions
      .filter((c) => c.status === 'Pago')
      .reduce((sum, c) => sum + c.amount, 0)

    const pendingAmount = periodContributions
      .filter((c) => c.status !== 'Pago')
      .reduce((sum, c) => sum + c.amount, 0)

    const dueDate = buildDueDateIso(year, month, dueDay)
    const remainingAmount = Math.max(0, expectedAmount - paidAmount)

    const status = resolveMonthStatus(
      paidAmount,
      pendingAmount,
      expectedAmount,
      dueDate,
      today,
    )

    entries.push({
      month,
      year,
      periodLabel: periodLabel(month, year),
      dueDate,
      expectedAmount,
      paidAmount,
      pendingAmount,
      remainingAmount,
      status,
      paymentsCount: periodContributions.length,
    })
  }

  entries.sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year
    return b.month - a.month
  })

  const overdueEntries = entries.filter((e) => e.status === 'overdue')
  const openEntries = entries.filter(
    (e) => e.status === 'pending' || e.status === 'partial' || e.status === 'overdue',
  )
  const paidEntries = entries.filter((e) => e.status === 'paid')

  const totalPaid = entries.reduce((sum, e) => sum + e.paidAmount, 0)
  const totalOverdue = overdueEntries.reduce((sum, e) => sum + e.remainingAmount, 0)
  const totalOpen = openEntries.reduce((sum, e) => sum + e.remainingAmount, 0)

  return {
    brotherId,
    brotherName,
    entries,
    overdueEntries,
    openEntries,
    paidEntries,
    totalPaid,
    totalOverdue,
    totalOpen,
    overdueMonthCount: overdueEntries.length,
    isUpToDate: overdueEntries.length === 0,
  }
}

export function buildAllMembershipSchedules(
  contributions: Contribution[],
  brothers: { id: string; full_name: string | null; created_at?: string | null }[],
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

      return buildMembershipScheduleForBrother(
        brotherId,
        name,
        contributions,
        settings,
        brother?.created_at,
      )
    })
    .sort((a, b) => a.brotherName.localeCompare(b.brotherName, 'pt-BR'))
}
