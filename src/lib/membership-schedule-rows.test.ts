import { describe, expect, it } from 'vitest'
import type { Contribution } from '@/lib/data'
import type { MembershipScheduleEntry } from '@/lib/membership-schedule-types'
import {
  MEMBERSHIP_CONTROL_ONLY_NOTE,
  MEMBERSHIP_HISTORICAL_NOTE,
} from '@/lib/membership-contribution-rules'
import { periodKey } from '@/lib/membership-batch-settle-format'
import {
  buildSelectedSettlePeriods,
  describeScheduleRow,
  periodSettleAmount,
  selectableScheduleKeys,
} from './membership-schedule-rows'

function entry(
  year: number,
  month: number,
  overrides: Partial<MembershipScheduleEntry> = {},
): MembershipScheduleEntry {
  return {
    month,
    year,
    periodLabel: `${month}/${year}`,
    dueDate: `${year}-${String(month).padStart(2, '0')}-10`,
    expectedAmount: 290,
    paidAmount: 0,
    pendingAmount: 0,
    remainingAmount: 290,
    status: 'overdue',
    paymentsCount: 0,
    ...overrides,
  }
}

const paid = { status: 'paid' as const, paidAmount: 290, remainingAmount: 0 }

function contribution(
  month: string,
  year: number,
  overrides: Partial<Contribution> = {},
): Contribution {
  return {
    id: `${month}-${year}`,
    brotherId: 'b1',
    month,
    year,
    amount: 290,
    status: 'Pago',
    ...overrides,
  }
}

describe('periodSettleAmount', () => {
  it('usa o saldo em aberto quando existe', () => {
    expect(periodSettleAmount(entry(2026, 7, { remainingAmount: 120 }), [])).toBe(120)
  })

  it('cobra o valor previsto de mês pago só pela migração da planilha', () => {
    const backfill = contribution('Março', 2026, { notes: MEMBERSHIP_HISTORICAL_NOTE })
    expect(periodSettleAmount(entry(2026, 3, paid), [backfill])).toBe(290)
  })

  it('não cobra nada de mês pago com receita na tesouraria', () => {
    const linked = contribution('Julho', 2026, { transactionId: 'tx-1' })
    expect(periodSettleAmount(entry(2026, 7, paid), [linked])).toBe(0)
  })
})

describe('seleção para quitação em lote', () => {
  const entries = [
    entry(2026, 8),
    entry(2026, 6, paid),
    entry(2026, 7, { remainingAmount: 100, status: 'partial' }),
  ]
  const contributions = [contribution('Junho', 2026, { transactionId: 'tx-6' })]

  it('lista só os meses com valor a quitar', () => {
    expect(selectableScheduleKeys(entries, contributions)).toEqual([
      periodKey(2026, 8),
      periodKey(2026, 7),
    ])
  })

  it('monta os períodos selecionados em ordem cronológica', () => {
    const allKeys = new Set(selectableScheduleKeys(entries, contributions))
    const periods = buildSelectedSettlePeriods(entries, allKeys, contributions)

    expect(periods.map((p) => [p.month, p.amount])).toEqual([
      [7, 100],
      [8, 290],
    ])
  })
})

describe('describeScheduleRow', () => {
  it('marca mês pago só no controle como "control_only"', () => {
    const controlOnly = contribution('Julho', 2026, { notes: MEMBERSHIP_CONTROL_ONLY_NOTE })
    const row = describeScheduleRow(entry(2026, 7, paid), [controlOnly], new Set())

    expect(row.badge).toBe('control_only')
    expect(row.selectable).toBe(false)
    expect(row.primaryContribution).toBe(controlOnly)
  })

  it('marca receita sem vínculo com o caixa como "orphan_treasury"', () => {
    const orphan = contribution('Julho', 2026, { accountId: 'acc-1' })
    const row = describeScheduleRow(entry(2026, 7, paid), [orphan], new Set())

    expect(row.badge).toBe('orphan_treasury')
    expect(row.selectable).toBe(true)
  })

  it('permite quitar só no controle apenas em meses do período acompanhado', () => {
    const current = describeScheduleRow(entry(2026, 7), [], new Set())
    const historical = describeScheduleRow(entry(2026, 3), [], new Set())

    expect(current.canControlOnlySettle).toBe(true)
    expect(current.badge).toBeNull()
    expect(historical.canControlOnlySettle).toBe(false)
  })
})
