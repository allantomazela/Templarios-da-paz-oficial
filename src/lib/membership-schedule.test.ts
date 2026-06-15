import { describe, expect, it, vi } from 'vitest'
import type { Contribution } from '@/lib/data'
import {
  buildMembershipScheduleForBrother,
  buildOverdueBrotherAlerts,
  buildAllMembershipSchedules,
  buildReminderAlerts,
  buildMembershipBackfillPeriods,
  isMembershipHistoricalPeriod,
  isMembershipPastDue,
} from '@/lib/membership-schedule'

const settings = { defaultAmount: 150, dueDay: 10 }

function contribution(
  overrides: Partial<Contribution> & Pick<Contribution, 'month' | 'year'>,
): Contribution {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    brotherId: overrides.brotherId ?? 'brother-1',
    month: overrides.month,
    year: overrides.year,
    amount: overrides.amount ?? 150,
    status: overrides.status ?? 'Pago',
    paymentDate: overrides.paymentDate,
    brotherName: overrides.brotherName,
    accountId: overrides.accountId,
    transactionId: overrides.transactionId,
    notes: overrides.notes,
  }
}

describe('buildMembershipScheduleForBrother', () => {
  it('marca mês quitado quando pagamentos somam o valor previsto', () => {
    const schedule = buildMembershipScheduleForBrother(
      'brother-1',
      'Irmão Teste',
      [
        contribution({ month: 'Janeiro', year: 2026, amount: 75, status: 'Pago' }),
        contribution({
          id: '2',
          month: 'Janeiro',
          year: 2026,
          amount: 75,
          status: 'Pago',
        }),
      ],
      settings,
      '2026-01-01T00:00:00Z',
    )

    const jan = schedule.entries.find((e) => e.month === 1 && e.year === 2026)
    expect(jan?.paidAmount).toBe(150)
    expect(jan?.status).toBe('paid')
    expect(jan?.remainingAmount).toBe(0)
  })

  it('identifica mês em atraso sem pagamento suficiente', () => {
    const schedule = buildMembershipScheduleForBrother(
      'brother-1',
      'Irmão Teste',
      [],
      settings,
      '2020-01-01T00:00:00Z',
    )

    expect(schedule.overdueMonthCount).toBeGreaterThan(0)
    expect(schedule.isUpToDate).toBe(false)
    expect(schedule.totalOverdue).toBeGreaterThan(0)
  })

  it('gera alertas de atraso por irmão', () => {
    const contributions = [
      contribution({
        brotherId: 'a',
        month: 'Janeiro',
        year: 2020,
        status: 'Pendente',
      }),
    ]

    const schedules = buildAllMembershipSchedules(
      contributions,
      [
        { id: 'a', full_name: 'Alpha', created_at: '2020-01-01T00:00:00Z' },
        { id: 'b', full_name: 'Beta', created_at: '2020-01-01T00:00:00Z' },
      ],
      { a: 'Alpha', b: 'Beta' },
      settings,
    )

    const alerts = buildOverdueBrotherAlerts(schedules)
    expect(alerts.some((a) => a.brotherId === 'a')).toBe(true)
    expect(alerts.every((a) => a.overdueCount > 0)).toBe(true)
  })
})

describe('buildReminderAlerts', () => {
  it('filtra alertas após vencimento conforme dias configurados', () => {
    const schedules = buildAllMembershipSchedules(
      [],
      [{ id: 'a', full_name: 'Alpha', created_at: '2020-01-01T00:00:00Z' }],
      { a: 'Alpha' },
      settings,
    )

    const alertsDefault = buildReminderAlerts(schedules, 'after', 0)
    expect(alertsDefault.length).toBeGreaterThan(0)

    const alertsStrict = buildReminderAlerts(
      schedules,
      'after',
      9999,
      new Date(),
    )
    expect(alertsStrict.length).toBe(0)
  })
})

describe('isMembershipPastDue', () => {
  it('mantém pendente no dia 10 e marca atraso apenas depois', () => {
    const dueDate = '2026-06-10'
    expect(isMembershipPastDue(dueDate, new Date(2026, 5, 10))).toBe(false)
    expect(isMembershipPastDue(dueDate, new Date(2026, 5, 9))).toBe(false)
    expect(isMembershipPastDue(dueDate, new Date(2026, 5, 11))).toBe(true)
  })

  it('marca mês corrente como pendente no dia 10 e atraso só depois', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 10))

    const scheduleOnDueDay = buildMembershipScheduleForBrother(
      'brother-1',
      'Irmão Teste',
      [],
      settings,
      '2026-06-01T00:00:00Z',
    )
    const juneOnDue = scheduleOnDueDay.entries.find(
      (e) => e.month === 6 && e.year === 2026,
    )
    expect(juneOnDue?.status).toBe('upcoming')

    vi.setSystemTime(new Date(2026, 5, 11))
    const scheduleAfterDue = buildMembershipScheduleForBrother(
      'brother-1',
      'Irmão Teste',
      [],
      settings,
      '2026-06-01T00:00:00Z',
    )
    const juneOverdue = scheduleAfterDue.entries.find(
      (e) => e.month === 6 && e.year === 2026,
    )
    expect(juneOverdue?.status).toBe('overdue')

    vi.useRealTimers()
  })

  it('marca mês futuro como à vencer, não em atraso', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 1))

    const schedule = buildMembershipScheduleForBrother(
      'brother-1',
      'Irmão Teste',
      [],
      settings,
      '2026/06/01',
    )
    const june = schedule.entries.find((e) => e.month === 6 && e.year === 2026)
    expect(june?.status).toBe('upcoming')
    expect(schedule.overdueMonthCount).toBe(0)

    vi.useRealTimers()
  })

  it('lista meses de backfill antes de jun/2026', () => {
    const periods = buildMembershipBackfillPeriods(
      '2026/01/01',
      settings,
      [],
      'brother-1',
    )
    expect(periods.map((p) => p.month)).toEqual([1, 2, 3, 4, 5])
    expect(periods.every((p) => p.year === 2026)).toBe(true)
  })

  it('identifica período histórico antes de jun/2026', () => {
    expect(isMembershipHistoricalPeriod(2026, 5)).toBe(true)
    expect(isMembershipHistoricalPeriod(2026, 6)).toBe(false)
    expect(isMembershipHistoricalPeriod(2026, 7)).toBe(false)
  })
})
