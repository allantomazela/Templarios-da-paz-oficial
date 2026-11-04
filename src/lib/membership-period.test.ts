import { describe, expect, it } from 'vitest'
import {
  isPeriodBeforeDuesStart,
  resolveScheduleStart,
  yearMonthFromCalendarDate,
} from '@/lib/membership-period'
import type { Contribution } from '@/lib/data'

describe('yearMonthFromCalendarDate', () => {
  it('lê ano e mês sem deslocar fuso', () => {
    expect(yearMonthFromCalendarDate('2026-11-04')).toEqual({
      year: 2026,
      month: 11,
    })
  })

  it('ignora data inválida', () => {
    expect(yearMonthFromCalendarDate('')).toBeNull()
    expect(yearMonthFromCalendarDate('2026-13-01')).toBeNull()
  })
})

describe('isPeriodBeforeDuesStart', () => {
  it('marca outubro anterior a novembro/2026', () => {
    expect(isPeriodBeforeDuesStart(2026, 10, '2026-11-04')).toBe(true)
    expect(isPeriodBeforeDuesStart(2026, 11, '2026-11-04')).toBe(false)
    expect(isPeriodBeforeDuesStart(2026, 12, '2026-11-04')).toBe(false)
  })

  it('sem data de início não bloqueia', () => {
    expect(isPeriodBeforeDuesStart(2026, 10, null)).toBe(false)
  })
})

describe('resolveScheduleStart', () => {
  it('trava no mês da regularização e ignora lançamento antigo', () => {
    const contributions = [
      {
        id: '1',
        brotherId: 'b1',
        month: 'Outubro',
        year: 2026,
        amount: 150,
        status: 'Pendente',
      },
    ] as Contribution[]

    expect(
      resolveScheduleStart(
        new Date('2026-10-01T00:00:00Z'),
        contributions,
        '2026-11-04',
      ),
    ).toEqual({ year: 2026, month: 11 })
  })
})
