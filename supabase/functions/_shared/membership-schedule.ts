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
  | 'upcoming'
  | 'overdue'

/** Mês a partir do qual o controle em produção passa a valer (jun/2026). */
export const MEMBERSHIP_TRACKING_START_YEAR = 2026
export const MEMBERSHIP_TRACKING_START_MONTH = 6

/** Período anterior ao início da tesouraria digital — só controle, sem receita. */
export function isMembershipHistoricalPeriod(
  year: number,
  month: number,
  trackingStartYear = MEMBERSHIP_TRACKING_START_YEAR,
  trackingStartMonth = MEMBERSHIP_TRACKING_START_MONTH,
): boolean {
  return (
    year < trackingStartYear ||
    (year === trackingStartYear && month < trackingStartMonth)
  )
}

export const MEMBERSHIP_HISTORICAL_NOTE =
  'Regularização histórica (pré-produção — não entra na tesouraria)'

/** Tolerância de meses em atraso antes de mensagem de escalonamento no e-mail. */
export const MEMBERSHIP_OVERDUE_ESCALATION_MONTHS = 3

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

export function buildDueDateIsoFromParts(
  year: number,
  month: number,
  dueDay: number,
): string {
  const day = Math.min(dueDay, 28)
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/** Período de calendário ainda não iniciou (mês futuro). */
export function isMembershipPeriodFuture(
  year: number,
  month: number,
  referenceDate: Date = new Date(),
): boolean {
  const refYear = referenceDate.getFullYear()
  const refMonth = referenceDate.getMonth() + 1
  return year > refYear || (year === refYear && month > refMonth)
}

/** Atraso só após o dia de vencimento (ex.: dia 11 se vence dia 10). */
export function isMembershipPastDue(
  dueDateIso: string,
  referenceDate: Date = new Date(),
): boolean {
  const [y, m, d] = dueDateIso.split('-').map(Number)
  const dueStart = new Date(y, m - 1, d)
  return startOfDay(referenceDate).getTime() > dueStart.getTime()
}

/**
 * Vencimento por fechamento do mês: a mensalidade pode ser paga em qualquer dia
 * do mês de referência. Só fica em atraso a partir do 1º dia do mês seguinte.
 */
export function isMembershipMonthOverdue(
  year: number,
  month: number,
  referenceDate: Date = new Date(),
): boolean {
  const refYear = referenceDate.getFullYear()
  const refMonth = referenceDate.getMonth() + 1
  return year < refYear || (year === refYear && month < refMonth)
}

/** Vencimento exibido: último dia do mês de referência (fechamento do mês). */
export function membershipMonthEndDueDateIso(
  year: number,
  month: number,
): string {
  const lastDay = new Date(year, month, 0).getDate()
  return `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
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
  today: Date,
  year: number,
  month: number,
  hasManualOverdue: boolean,
): MembershipMonthStatus {
  if (paidAmount >= expectedAmount) return 'paid'

  if (isMembershipPeriodFuture(year, month, today)) return 'upcoming'

  // Atraso só quando o mês de referência fecha (ou marcado manualmente).
  const isPastDue =
    hasManualOverdue || isMembershipMonthOverdue(year, month, today)

  if (paidAmount > 0 && paidAmount < expectedAmount) {
    return isPastDue ? 'overdue' : 'partial'
  }

  if (isPastDue) return 'overdue'
  return 'upcoming'
}

export interface MembershipBackfillPeriod {
  month: number
  year: number
  periodLabel: string
  expectedAmount: number
  paid: boolean
  hasLaunch: boolean
}

/** Meses anteriores ao início do controle em produção (ex.: jan–mai/2026). */
export function buildMembershipBackfillPeriods(
  memberSince: string | null | undefined,
  settings: MembershipFeeScheduleSettings,
  contributions: Contribution[],
  brotherId: string,
  trackingStartYear = MEMBERSHIP_TRACKING_START_YEAR,
  trackingStartMonth = MEMBERSHIP_TRACKING_START_MONTH,
): MembershipBackfillPeriod[] {
  const memberSinceDate = memberSince ? new Date(memberSince) : null
  const start = resolveScheduleStart(memberSinceDate, contributions.filter((c) => c.brotherId === brotherId))

  const endYear = trackingStartYear
  const endMonth = trackingStartMonth - 1
  if (endMonth < 1) return []

  const byPeriod = groupContributionsByPeriod(
    contributions.filter((c) => c.brotherId === brotherId),
  )
  const expectedAmount = settings.defaultAmount
  const periods: MembershipBackfillPeriod[] = []

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

    const hasManualOverdue = periodContributions.some(
      (c) => c.status === 'Atrasado',
    )

    const dueDate = membershipMonthEndDueDateIso(year, month)
    const remainingAmount = Math.max(0, expectedAmount - paidAmount)

    const status = resolveMonthStatus(
      paidAmount,
      pendingAmount,
      expectedAmount,
      today,
      year,
      month,
      hasManualOverdue,
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
    (e) =>
      e.status === 'upcoming' ||
      e.status === 'partial' ||
      e.status === 'overdue',
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

export function buildOverdueBrotherAlerts(
  schedules: BrotherMembershipSchedule[],
): OverdueBrotherAlert[] {
  return schedules
    .filter((s) => s.overdueMonthCount > 0)
    .map((s) => ({
      brotherId: s.brotherId,
      brotherName: s.brotherName,
      overdueCount: s.overdueMonthCount,
      overdueAmount: s.totalOverdue,
      overdueLabels: s.overdueEntries.map((e) =>
        shortPeriodLabel(e.month, e.year),
      ),
      oldestOverdueDueDate:
        s.overdueEntries.length > 0
          ? s.overdueEntries[s.overdueEntries.length - 1]?.dueDate ?? null
          : null,
    }))
    .sort((a, b) => b.overdueCount - a.overdueCount)
}

export function membershipStatusLabel(status: MembershipMonthStatus): string {
  switch (status) {
    case 'paid':
      return 'Pago'
    case 'partial':
      return 'Parcial'
    case 'upcoming':
      return 'À vencer'
    case 'overdue':
      return 'Em atraso'
  }
}
