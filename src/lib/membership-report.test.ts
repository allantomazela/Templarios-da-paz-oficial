import { describe, expect, it } from 'vitest'
import type { Contribution } from '@/lib/data'
import {
  buildMembershipBrotherStatementData,
  buildMembershipOverdueReportData,
  sortAlertsByPriority,
} from '@/lib/membership-report'
import type { BrotherMembershipSchedule } from '@/lib/membership-schedule'

function schedule(
  overrides: Partial<BrotherMembershipSchedule> &
    Pick<BrotherMembershipSchedule, 'brotherId' | 'brotherName'>,
): BrotherMembershipSchedule {
  return {
    entries: [],
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

describe('membership-report', () => {
  it('monta resumo de atrasos', () => {
    const data = buildMembershipOverdueReportData([
      schedule({
        brotherId: 'b1',
        brotherName: 'João',
        overdueMonthCount: 2,
        totalOverdue: 300,
        isUpToDate: false,
        overdueEntries: [
          {
            month: 2,
            year: 2026,
            periodLabel: 'Fev/2026',
            dueDate: '2026-02-10',
            expectedAmount: 150,
            paidAmount: 0,
            pendingAmount: 150,
            remainingAmount: 150,
            status: 'overdue',
            paymentsCount: 0,
          },
          {
            month: 3,
            year: 2026,
            periodLabel: 'Mar/2026',
            dueDate: '2026-03-10',
            expectedAmount: 150,
            paidAmount: 0,
            pendingAmount: 150,
            remainingAmount: 150,
            status: 'overdue',
            paymentsCount: 0,
          },
        ],
      }),
    ])

    expect(data.summary.brotherCount).toBe(1)
    expect(data.summary.totalOverdueAmount).toBe(300)
  })

  it('prioriza irmãos com escalonamento', () => {
    const sorted = sortAlertsByPriority([
      {
        brotherId: 'b1',
        brotherName: 'Ana',
        overdueCount: 1,
        overdueAmount: 150,
        overdueLabels: ['Mar/2026'],
        oldestOverdueDueDate: '2026-03-10',
        requiresEscalation: false,
      },
      {
        brotherId: 'b2',
        brotherName: 'Bruno',
        overdueCount: 3,
        overdueAmount: 450,
        overdueLabels: ['Jan/2026', 'Fev/2026', 'Mar/2026'],
        oldestOverdueDueDate: '2026-01-10',
        requiresEscalation: true,
      },
    ])

    expect(sorted[0].brotherName).toBe('Bruno')
  })

  it('monta extrato do irmão com cronograma e lançamentos', () => {
    const brotherSchedule = schedule({
      brotherId: 'b1',
      brotherName: 'João',
      totalPaid: 150,
      totalOverdue: 0,
      totalOpen: 0,
      isUpToDate: true,
      entries: [
        {
          month: 3,
          year: 2026,
          periodLabel: 'Mar/2026',
          dueDate: '2026-03-10',
          expectedAmount: 150,
          paidAmount: 150,
          pendingAmount: 0,
          remainingAmount: 0,
          status: 'paid',
          paymentsCount: 1,
        },
      ],
      paidEntries: [],
      overdueEntries: [],
      openEntries: [],
      overdueMonthCount: 0,
    })

    const contributions: Contribution[] = [
      {
        id: 'c1',
        brotherId: 'b1',
        month: 'Março',
        year: 2026,
        amount: 150,
        status: 'Pago',
        paymentDate: '2026-03-05',
        transactionId: 'tx-1',
      },
    ]

    const statement = buildMembershipBrotherStatementData(
      'b1',
      'João',
      brotherSchedule,
      contributions,
      [
        {
          id: 'c1',
          type: 'monthly',
          description: 'Mensalidade 03/2026',
          amount: 150,
          status: 'paid',
          dueDate: '2026-03-10',
          paymentDate: '2026-03-05',
          month: 3,
          year: 2026,
        },
        {
          id: 'ex1',
          type: 'ceremony',
          categoryLabel: 'Exaltação',
          description: 'Exaltação — parcela 1/1',
          amount: 500,
          status: 'paid',
          dueDate: '2026-05-01',
          paymentDate: '2026-05-02',
        },
      ],
    )

    expect(statement.contributions).toHaveLength(1)
    expect(statement.schedule.totalPaid).toBe(150)
    expect(statement.paidPayments).toHaveLength(2)
    expect(statement.totalPaidAll).toBe(650)
    expect(statement.summaryByType.ceremony.paidTotal).toBe(500)
  })
})
