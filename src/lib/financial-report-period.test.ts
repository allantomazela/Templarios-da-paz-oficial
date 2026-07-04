import { describe, expect, it } from 'vitest'
import { endOfDay, endOfMonth, startOfDay, startOfMonth } from 'date-fns'
import {
  isDateInFinancialReportRange,
  resolveFinancialReportDateRange,
  validateFinancialReportPeriodConfig,
} from '@/lib/financial-report-period'

describe('financial-report-period', () => {
  it('resolve current month range', () => {
    const now = new Date()
    const range = resolveFinancialReportDateRange({ period: 'current_month' })

    expect(range).not.toBeNull()
    expect(range?.start).toEqual(startOfMonth(now))
    expect(range?.end).toEqual(endOfMonth(now))
  })

  it('resolve custom range with inclusive boundaries', () => {
    const range = resolveFinancialReportDateRange({
      period: 'custom',
      customStart: '2026-03-01',
      customEnd: '2026-03-15',
    })

    expect(range).not.toBeNull()
    expect(range?.start).toEqual(startOfDay(new Date(2026, 2, 1)))
    expect(range?.end).toEqual(endOfDay(new Date(2026, 2, 15)))
  })

  it('returns null for all periods', () => {
    expect(resolveFinancialReportDateRange({ period: 'all' })).toBeNull()
  })

  it('validates custom period dates', () => {
    expect(
      validateFinancialReportPeriodConfig({
        period: 'custom',
        customStart: '',
        customEnd: '2026-03-01',
      }),
    ).toBe('Informe a data inicial do período.')

    expect(
      validateFinancialReportPeriodConfig({
        period: 'custom',
        customStart: '2026-03-10',
        customEnd: '2026-03-01',
      }),
    ).toBe('A data final deve ser igual ou posterior à data inicial.')

    expect(
      validateFinancialReportPeriodConfig({
        period: 'current_month',
      }),
    ).toBeNull()
  })

  it('checks date membership in range', () => {
    const range = {
      start: startOfDay(new Date(2026, 2, 1)),
      end: endOfDay(new Date(2026, 2, 31)),
    }

    expect(isDateInFinancialReportRange('2026-03-01', range)).toBe(true)
    expect(isDateInFinancialReportRange('2026-02-28', range)).toBe(false)
  })
})
