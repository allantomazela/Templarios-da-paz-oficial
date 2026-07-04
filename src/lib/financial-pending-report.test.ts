import { describe, expect, it } from 'vitest'
import { endOfDay, startOfDay } from 'date-fns'
import type { ForecastComparisonRow } from '@/lib/forecast-types'
import type { BrotherMembershipSchedule } from '@/lib/membership-schedule'
import {
  buildPendingItemsFromForecastRows,
  buildPendingItemsFromMembershipSchedules,
  computePendingAmount,
  filterPendingItemsByDueDateRange,
  mergePendingFinancialItems,
  summarizePendingFinancialItems,
} from '@/lib/financial-pending-report'

describe('financial-pending-report', () => {
  it('computes pending amount from expected and realized values', () => {
    expect(computePendingAmount(100, 40)).toBe(60)
    expect(computePendingAmount(100, 100)).toBe(0)
    expect(computePendingAmount(100, 120)).toBe(0)
  })

  it('builds pending items from forecast rows', () => {
    const rows: ForecastComparisonRow[] = [
      {
        id: 'row-1',
        kind: 'item',
        dueDate: '2026-04-10',
        description: 'Aluguel',
        categoryName: 'Despesas fixas',
        type: 'Despesa',
        year: 2026,
        month: 4,
        expectedAmount: 500,
        realizedAmount: 200,
        variance: 300,
        linkStatus: 'partial',
        hasLinkedTransactions: true,
      },
      {
        id: 'row-2',
        dueDate: '2026-04-12',
        kind: 'item',
        description: 'Doação',
        categoryName: 'Receitas',
        type: 'Receita',
        year: 2026,
        month: 4,
        expectedAmount: 300,
        realizedAmount: 300,
        variance: 0,
        linkStatus: 'matched',
        hasLinkedTransactions: true,
      },
    ]

    const items = buildPendingItemsFromForecastRows(rows)

    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({
      amount: 300,
      source: 'planning',
      type: 'Despesa',
    })
  })

  it('builds pending items from membership schedules', () => {
    const schedules: BrotherMembershipSchedule[] = [
      {
        brotherId: 'bro-1',
        brotherName: 'João Silva',
        entries: [
          {
            year: 2026,
            month: 4,
            dueDate: '2026-04-05',
            periodLabel: 'Abr/2026',
            expectedAmount: 150,
            paidAmount: 0,
            remainingAmount: 150,
            pendingAmount: 150,
            paymentsCount: 0,
            status: 'upcoming',
          },
          {
            year: 2026,
            month: 3,
            dueDate: '2026-03-05',
            periodLabel: 'Mar/2026',
            expectedAmount: 150,
            paidAmount: 150,
            remainingAmount: 0,
            pendingAmount: 0,
            paymentsCount: 1,
            status: 'paid',
          },
        ],
        overdueEntries: [],
        openEntries: [],
        paidEntries: [],
        totalPaid: 150,
        totalOverdue: 0,
        totalOpen: 150,
        overdueMonthCount: 0,
        isUpToDate: false,
      },
    ]

    const items = buildPendingItemsFromMembershipSchedules(schedules)

    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({
      source: 'membership',
      type: 'Receita',
      amount: 150,
      brotherName: 'João Silva',
    })
  })

  it('filters pending items by due date range and summarizes totals', () => {
    const items = mergePendingFinancialItems(
      [
        {
          id: 'a',
          dueDate: '2026-04-01',
          description: 'Receita A',
          category: 'Mensalidade',
          type: 'Receita',
          amount: 100,
          source: 'membership',
          statusLabel: 'A vencer',
        },
        {
          id: 'b',
          dueDate: '2026-05-01',
          description: 'Despesa B',
          category: 'Fixas',
          type: 'Despesa',
          amount: 40,
          source: 'planning',
          statusLabel: 'A vencer',
        },
      ],
    )

    const filtered = filterPendingItemsByDueDateRange(items, {
      start: startOfDay(new Date(2026, 3, 1)),
      end: endOfDay(new Date(2026, 3, 30)),
    })

    expect(filtered).toHaveLength(1)
    expect(filtered[0].id).toBe('a')

    const summary = summarizePendingFinancialItems(items)
    expect(summary).toEqual({
      totalReceivable: 100,
      totalPayable: 40,
      netPending: 60,
      receivableCount: 1,
      payableCount: 1,
    })
  })
})
