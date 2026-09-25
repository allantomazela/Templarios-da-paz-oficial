import { describe, expect, it } from 'vitest'
import type { BrotherMembershipSchedule } from '@/lib/membership-schedule'
import {
  buildMembershipOpenReportData,
  buildMembershipPaidByBrotherReportData,
} from '@/lib/membership-open-paid-report'

function schedule(
  overrides: Partial<BrotherMembershipSchedule> &
    Pick<BrotherMembershipSchedule, 'brotherId' | 'brotherName' | 'entries'>,
): BrotherMembershipSchedule {
  return {
    overdueEntries: [],
    openEntries: [],
    paidEntries: [],
    totalPaid: 0,
    totalOverdue: 0,
    totalOpen: 0,
    overdueMonthCount: 0,
    isUpToDate: true,
    ...overrides,
  }
}

describe('membership-open-paid-report', () => {
  it('lista mensalidades em aberto com saldo restante', () => {
    const data = buildMembershipOpenReportData([
      schedule({
        brotherId: 'a',
        brotherName: 'Allan',
        overdueMonthCount: 1,
        entries: [
          {
            month: 8,
            year: 2026,
            periodLabel: 'Agosto/2026',
            dueDate: '2026-08-31',
            expectedAmount: 290,
            paidAmount: 0,
            pendingAmount: 290,
            remainingAmount: 290,
            status: 'overdue',
            paymentsCount: 1,
          },
          {
            month: 9,
            year: 2026,
            periodLabel: 'Setembro/2026',
            dueDate: '2026-09-30',
            expectedAmount: 290,
            paidAmount: 290,
            pendingAmount: 0,
            remainingAmount: 0,
            status: 'paid',
            paymentsCount: 1,
          },
        ],
      }),
    ])

    expect(data.summary.brotherCount).toBe(1)
    expect(data.summary.openMonthCount).toBe(1)
    expect(data.summary.totalOpenAmount).toBe(290)
    expect(data.rows[0]?.periodsLabel).toBe('Agosto/2026')
  })

  it('lista pagamentos por irmão e filtra seleção', () => {
    const schedules = [
      schedule({
        brotherId: 'a',
        brotherName: 'Allan',
        entries: [
          {
            month: 7,
            year: 2026,
            periodLabel: 'Julho/2026',
            dueDate: '2026-07-31',
            expectedAmount: 290,
            paidAmount: 290,
            pendingAmount: 0,
            remainingAmount: 0,
            status: 'paid',
            paymentsCount: 1,
          },
        ],
      }),
      schedule({
        brotherId: 'b',
        brotherName: 'Bruno',
        entries: [
          {
            month: 7,
            year: 2026,
            periodLabel: 'Julho/2026',
            dueDate: '2026-07-31',
            expectedAmount: 290,
            paidAmount: 100,
            pendingAmount: 190,
            remainingAmount: 190,
            status: 'partial',
            paymentsCount: 1,
          },
        ],
      }),
    ]

    const all = buildMembershipPaidByBrotherReportData(schedules)
    expect(all.summary.brotherCount).toBe(2)
    expect(all.summary.totalPaidAmount).toBe(390)

    const onlyBruno = buildMembershipPaidByBrotherReportData(schedules, 'b')
    expect(onlyBruno.summary.brotherCount).toBe(1)
    expect(onlyBruno.rows[0]?.brotherName).toBe('Bruno')
    expect(onlyBruno.summary.totalPaidAmount).toBe(100)
  })
})
