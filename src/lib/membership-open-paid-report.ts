import {
  membershipStatusLabel,
  type BrotherMembershipSchedule,
  type MembershipScheduleEntry,
} from '@/lib/membership-schedule'

/** Meses com saldo em aberto (atraso, parcial ou a vencer). */
export function getOpenBalanceEntries(
  schedule: BrotherMembershipSchedule,
): MembershipScheduleEntry[] {
  return schedule.entries
    .filter((entry) => entry.remainingAmount > 0)
    .sort((left, right) => {
      if (left.year !== right.year) return left.year - right.year
      return left.month - right.month
    })
}

/** Meses com algum valor pago (quitado ou parcial). */
export function getPaidBalanceEntries(
  schedule: BrotherMembershipSchedule,
): MembershipScheduleEntry[] {
  return schedule.entries
    .filter((entry) => entry.paidAmount > 0)
    .sort((left, right) => {
      if (left.year !== right.year) return right.year - left.year
      return right.month - left.month
    })
}

export interface MembershipOpenReportRow {
  brotherId: string
  brotherName: string
  openMonthCount: number
  overdueMonthCount: number
  totalOpenAmount: number
  periodsLabel: string
  entries: MembershipScheduleEntry[]
}

export interface MembershipOpenReportData {
  summary: {
    brotherCount: number
    openMonthCount: number
    totalOpenAmount: number
    generatedAt: string
  }
  rows: MembershipOpenReportRow[]
}

export function buildMembershipOpenReportData(
  schedules: BrotherMembershipSchedule[],
  referenceDate: Date = new Date(),
): MembershipOpenReportData {
  const rows: MembershipOpenReportRow[] = schedules
    .map((schedule) => {
      const entries = getOpenBalanceEntries(schedule)
      if (entries.length === 0) return null
      return {
        brotherId: schedule.brotherId,
        brotherName: schedule.brotherName,
        openMonthCount: entries.length,
        overdueMonthCount: schedule.overdueMonthCount,
        totalOpenAmount: entries.reduce(
          (sum, entry) => sum + entry.remainingAmount,
          0,
        ),
        periodsLabel: entries.map((entry) => entry.periodLabel).join(', '),
        entries,
      }
    })
    .filter((row): row is MembershipOpenReportRow => row !== null)
    .sort((left, right) => {
      if (right.totalOpenAmount !== left.totalOpenAmount) {
        return right.totalOpenAmount - left.totalOpenAmount
      }
      return left.brotherName.localeCompare(right.brotherName, 'pt-BR')
    })

  return {
    summary: {
      brotherCount: rows.length,
      openMonthCount: rows.reduce((sum, row) => sum + row.openMonthCount, 0),
      totalOpenAmount: rows.reduce((sum, row) => sum + row.totalOpenAmount, 0),
      generatedAt: referenceDate.toISOString(),
    },
    rows,
  }
}

export interface MembershipPaidByBrotherRow {
  brotherId: string
  brotherName: string
  paidMonthCount: number
  totalPaidAmount: number
  periodsLabel: string
  entries: MembershipScheduleEntry[]
}

export interface MembershipPaidByBrotherReportData {
  summary: {
    brotherCount: number
    paidMonthCount: number
    totalPaidAmount: number
    generatedAt: string
  }
  rows: MembershipPaidByBrotherRow[]
  selectedBrotherId: string | null
}

export function buildMembershipPaidByBrotherReportData(
  schedules: BrotherMembershipSchedule[],
  selectedBrotherId: string | null = null,
  referenceDate: Date = new Date(),
): MembershipPaidByBrotherReportData {
  const scoped = selectedBrotherId
    ? schedules.filter((schedule) => schedule.brotherId === selectedBrotherId)
    : schedules

  const rows: MembershipPaidByBrotherRow[] = scoped
    .map((schedule) => {
      const entries = getPaidBalanceEntries(schedule)
      if (entries.length === 0) return null
      return {
        brotherId: schedule.brotherId,
        brotherName: schedule.brotherName,
        paidMonthCount: entries.length,
        totalPaidAmount: entries.reduce(
          (sum, entry) => sum + entry.paidAmount,
          0,
        ),
        periodsLabel: entries.map((entry) => entry.periodLabel).join(', '),
        entries,
      }
    })
    .filter((row): row is MembershipPaidByBrotherRow => row !== null)
    .sort((left, right) =>
      left.brotherName.localeCompare(right.brotherName, 'pt-BR'),
    )

  return {
    summary: {
      brotherCount: rows.length,
      paidMonthCount: rows.reduce((sum, row) => sum + row.paidMonthCount, 0),
      totalPaidAmount: rows.reduce((sum, row) => sum + row.totalPaidAmount, 0),
      generatedAt: referenceDate.toISOString(),
    },
    rows,
    selectedBrotherId,
  }
}

export { membershipStatusLabel }
