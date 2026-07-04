import type { CashFlowPeriod } from '@/lib/cash-flow'
import type { ForecastComparisonRow } from '@/lib/forecast-types'
import { getForecastRowStatusLabel } from '@/lib/forecast-projection'
import { isDateInFinancialReportRange } from '@/lib/financial-report-period'
import type { BrotherMembershipSchedule } from '@/lib/membership-schedule'

export type PendingFinancialItemSource = 'planning' | 'membership'

export interface PendingFinancialReportItem {
  id: string
  dueDate: string
  description: string
  category: string
  type: 'Receita' | 'Despesa'
  amount: number
  source: PendingFinancialItemSource
  statusLabel: string
  brotherName?: string
  periodLabel?: string
}

export interface PendingFinancialReportSummary {
  totalReceivable: number
  totalPayable: number
  netPending: number
  receivableCount: number
  payableCount: number
}

const PENDING_TOLERANCE = 0.01

export function computePendingAmount(
  expectedAmount: number,
  realizedAmount: number,
): number {
  return Math.max(0, expectedAmount - realizedAmount)
}

export interface BuildPendingItemsFromForecastRowsOptions {
  /** Evita dupla contagem quando mensalidades vêm do cronograma por irmão. */
  excludeMembershipRows?: boolean
}

export function buildPendingItemsFromForecastRows(
  rows: ForecastComparisonRow[],
  options: BuildPendingItemsFromForecastRowsOptions = {},
): PendingFinancialReportItem[] {
  const filteredRows = options.excludeMembershipRows
    ? rows.filter((row) => row.kind !== 'membership')
    : rows

  return filteredRows
    .map((row) => {
      const amount = computePendingAmount(row.expectedAmount, row.realizedAmount)
      if (amount <= PENDING_TOLERANCE) return null

      return {
        id: `forecast-${row.id}`,
        dueDate: row.dueDate,
        description: row.description,
        category: row.categoryName,
        type: row.type,
        amount,
        source: 'planning' as const,
        statusLabel: getForecastRowStatusLabel(row),
      }
    })
    .filter((item): item is PendingFinancialReportItem => item !== null)
    .sort((left, right) => left.dueDate.localeCompare(right.dueDate))
}

export function buildPendingItemsFromMembershipSchedules(
  schedules: BrotherMembershipSchedule[],
): PendingFinancialReportItem[] {
  const items: PendingFinancialReportItem[] = []

  for (const schedule of schedules) {
    for (const entry of schedule.entries) {
      const amount =
        entry.remainingAmount > PENDING_TOLERANCE
          ? entry.remainingAmount
          : entry.pendingAmount > PENDING_TOLERANCE
            ? entry.pendingAmount
            : 0

      if (amount <= PENDING_TOLERANCE) continue
      if (entry.status === 'paid') continue

      items.push({
        id: `membership-${schedule.brotherId}-${entry.year}-${entry.month}`,
        dueDate: entry.dueDate,
        description: `Mensalidade — ${schedule.brotherName} (${entry.periodLabel})`,
        category: 'Mensalidade',
        type: 'Receita',
        amount,
        source: 'membership',
        statusLabel: membershipStatusLabel(entry.status),
        brotherName: schedule.brotherName,
        periodLabel: entry.periodLabel,
      })
    }
  }

  return items.sort((left, right) => left.dueDate.localeCompare(right.dueDate))
}

function membershipStatusLabel(
  status: BrotherMembershipSchedule['entries'][number]['status'],
): string {
  switch (status) {
    case 'overdue':
      return 'Em atraso'
    case 'upcoming':
      return 'A vencer'
    case 'partial':
      return 'Parcial'
    case 'paid':
      return 'Quitado'
    default:
      return status
  }
}

export function buildCombinedPendingFinancialItems(
  forecastRows: ForecastComparisonRow[],
  schedules: BrotherMembershipSchedule[],
): PendingFinancialReportItem[] {
  return mergePendingFinancialItems(
    buildPendingItemsFromForecastRows(forecastRows, {
      excludeMembershipRows: true,
    }),
    buildPendingItemsFromMembershipSchedules(schedules),
  )
}

export function filterPendingItemsByDueDateRange(
  items: PendingFinancialReportItem[],
  range: CashFlowPeriod | null,
): PendingFinancialReportItem[] {
  if (!range) return items
  return items.filter((item) => isDateInFinancialReportRange(item.dueDate, range))
}

export function summarizePendingFinancialItems(
  items: PendingFinancialReportItem[],
): PendingFinancialReportSummary {
  let totalReceivable = 0
  let totalPayable = 0
  let receivableCount = 0
  let payableCount = 0

  for (const item of items) {
    if (item.type === 'Receita') {
      totalReceivable += item.amount
      receivableCount += 1
    } else {
      totalPayable += item.amount
      payableCount += 1
    }
  }

  return {
    totalReceivable,
    totalPayable,
    netPending: totalReceivable - totalPayable,
    receivableCount,
    payableCount,
  }
}

export function mergePendingFinancialItems(
  ...groups: PendingFinancialReportItem[][]
): PendingFinancialReportItem[] {
  const byId = new Map<string, PendingFinancialReportItem>()

  for (const group of groups) {
    for (const item of group) {
      byId.set(item.id, item)
    }
  }

  return [...byId.values()].sort((left, right) =>
    left.dueDate.localeCompare(right.dueDate),
  )
}
