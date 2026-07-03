import { describe, expect, it } from 'vitest'
import {
  buildForecastProjection,
  computeMembershipExpectedForMonth,
  getExpectedAmountForItem,
  isTransactionCountedInForecastPlanning,
  itemAppliesToMonth,
  isMembershipCategory,
} from '@/lib/forecast-projection'
import type {
  ForecastItem,
  ForecastMonthOverride,
  MembershipForecastOverride,
} from '@/lib/forecast-types'
import type { BrotherMembershipSchedule } from '@/lib/membership-schedule'

const baseItem: ForecastItem = {
  id: 'item-luz',
  description: 'Conta de luz',
  type: 'Despesa',
  categoryId: null,
  expectedAmount: 250,
  dueDay: 15,
  recurrence: 'monthly',
  recurrenceMonth: null,
  preferredAccountId: 'acc-1',
  isActive: true,
  sortOrder: 0,
}

describe('forecast-projection', () => {
  it('identifica categoria de mensalidade', () => {
    expect(isMembershipCategory('Mensalidade')).toBe(true)
    expect(isMembershipCategory(' mensalidade ')).toBe(true)
    expect(isMembershipCategory('Ágape')).toBe(false)
  })

  it('aplica recorrência mensal e anual', () => {
    expect(itemAppliesToMonth(baseItem, 2026, 6)).toBe(true)

    const annualItem: ForecastItem = {
      ...baseItem,
      id: 'item-anual',
      recurrence: 'annual',
      recurrenceMonth: 3,
    }
    expect(itemAppliesToMonth(annualItem, 2026, 3)).toBe(true)
    expect(itemAppliesToMonth(annualItem, 2026, 4)).toBe(false)
  })

  it('usa override mensal quando existir', () => {
    const overrides: ForecastMonthOverride[] = [
      {
        id: 'ov-1',
        forecastItemId: 'item-luz',
        year: 2026,
        month: 6,
        expectedAmountOverride: 230,
      },
    ]

    expect(getExpectedAmountForItem(baseItem, 2026, 6, overrides)).toBe(230)
    expect(getExpectedAmountForItem(baseItem, 2026, 7, overrides)).toBe(250)
  })

  it('calcula previsto de mensalidades pelo cronograma ou override', () => {
    const schedules: BrotherMembershipSchedule[] = [
      {
        brotherId: 'b1',
        brotherName: 'Irmão A',
        entries: [
          {
            month: 6,
            year: 2026,
            periodLabel: 'Jun/2026',
            dueDate: '2026-06-10',
            expectedAmount: 100,
            paidAmount: 0,
            pendingAmount: 100,
            remainingAmount: 100,
            status: 'open',
            paymentsCount: 0,
          },
        ],
        overdueEntries: [],
        openEntries: [],
        paidEntries: [],
        totalPaid: 0,
        totalOverdue: 0,
        totalOpen: 100,
        overdueMonthCount: 0,
        isUpToDate: false,
      },
      {
        brotherId: 'b2',
        brotherName: 'Irmão B',
        entries: [
          {
            month: 6,
            year: 2026,
            periodLabel: 'Jun/2026',
            dueDate: '2026-06-10',
            expectedAmount: 100,
            paidAmount: 0,
            pendingAmount: 100,
            remainingAmount: 100,
            status: 'open',
            paymentsCount: 0,
          },
        ],
        overdueEntries: [],
        openEntries: [],
        paidEntries: [],
        totalPaid: 0,
        totalOverdue: 0,
        totalOpen: 100,
        overdueMonthCount: 0,
        isUpToDate: false,
      },
    ]

    expect(computeMembershipExpectedForMonth(schedules, 2026, 6)).toBe(200)

    const membershipOverride: MembershipForecastOverride = {
      id: 'm-ov',
      year: 2026,
      month: 6,
      expectedAmountOverride: 180,
    }
    expect(
      computeMembershipExpectedForMonth(schedules, 2026, 6, membershipOverride),
    ).toBe(180)
  })

  it('monta previsto x realizado com vínculo explícito', () => {
    const projection = buildForecastProjection({
      referenceDate: new Date(2026, 5, 1),
      horizonMonths: 1,
      items: [baseItem],
      monthOverrides: [],
      membershipOverrides: [],
      membershipSchedules: [],
      accounts: [{ id: 'acc-1', name: 'Caixa', initialBalance: 1000 }],
      transactions: [
        {
          id: 'tx-1',
          date: '2026-06-20',
          type: 'Despesa',
          amount: 230,
          category: 'Utilidades',
          accountId: 'acc-1',
          forecastItemId: 'item-luz',
          description: 'Conta de luz junho',
        },
        {
          id: 'tx-2',
          date: '2026-06-12',
          type: 'Receita',
          amount: 150,
          category: 'Mensalidade',
          accountId: 'acc-1',
          description: 'Mensalidade Irmão A',
        },
        {
          id: 'tx-3',
          date: '2026-06-05',
          type: 'Receita',
          amount: 80,
          category: 'Doação',
          accountId: 'acc-1',
          description: 'Doação evento',
        },
      ],
    })

    const month = projection.months[0]
    const luzRow = month.rows.find((row) => row.forecastItemId === 'item-luz')
    const membershipRow = month.rows.find((row) => row.kind === 'membership')

    expect(luzRow?.expectedAmount).toBe(250)
    expect(luzRow?.realizedAmount).toBe(230)
    expect(luzRow?.variance).toBe(20)
    expect(luzRow?.linkStatus).toBe('under')

    expect(membershipRow?.realizedAmount).toBe(150)
    expect(projection.globalCurrentBalance).toBe(1000)
    expect(month.cashFlow.cashFlowIncome).toBe(230)
    expect(month.cashFlow.cashFlowExpense).toBe(230)
    expect(month.cashFlow.cashFlowNet).toBe(0)
    expect(month.cashFlow.unplannedTransactions).toHaveLength(1)
    expect(month.cashFlow.unplannedTransactions[0].id).toBe('tx-3')
    expect(projection.accountProjectionsTotals.currentBalance).toBe(1000)
  })

  it('identifica transações fora do previsto', () => {
    expect(
      isTransactionCountedInForecastPlanning({
        type: 'Receita',
        category: 'Mensalidade',
      }),
    ).toBe(true)
    expect(
      isTransactionCountedInForecastPlanning({
        type: 'Receita',
        category: 'Doação',
        forecastItemId: 'item-1',
      }),
    ).toBe(true)
    expect(
      isTransactionCountedInForecastPlanning({
        type: 'Despesa',
        category: 'Utilidades',
      }),
    ).toBe(false)
  })
})
