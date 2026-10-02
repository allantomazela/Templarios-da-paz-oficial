import { describe, expect, it } from 'vitest'
import {
  buildForecastPlanningCsvRows,
  computeTotalEconomyAcrossMonths,
} from '@/lib/forecast-report-export'
import type { ForecastMonthSummary } from '@/lib/forecast-types'

const sampleMonth: ForecastMonthSummary = {
  year: 2026,
  month: 6,
  label: 'Jun/2026',
  expectedIncome: 500,
  expectedExpense: 250,
  realizedIncome: 150,
  realizedExpense: 230,
  netExpected: 250,
  netRealized: -80,
  cashFlow: {
    accounts: [],
    totals: {
      accountId: 'total',
      accountName: 'Total',
      periodIncome: 150,
      periodExpense: 230,
      netCashFlow: -80,
    },
    cashFlowIncome: 150,
    cashFlowExpense: 230,
    cashFlowNet: -80,
    unplannedIncome: 0,
    unplannedExpense: 0,
    unplannedNet: 0,
    unplannedTransactions: [],
  },
  rows: [
    {
      id: 'item-luz',
      kind: 'item',
      type: 'Despesa',
      year: 2026,
      month: 6,
      dueDate: '2026-06-15',
      description: 'Conta de luz',
      categoryName: 'Utilidades',
      expectedAmount: 250,
      realizedAmount: 230,
      variance: 20,
      linkStatus: 'under',
      forecastItemId: 'item-1',
      hasLinkedTransactions: true,
    },
  ],
}

describe('forecast-report-export', () => {
  it('monta linhas CSV com status de economia', () => {
    const rows = buildForecastPlanningCsvRows([sampleMonth])
    expect(rows).toHaveLength(1)
    expect(rows[0][2]).toBe('Conta de luz')
    expect(rows[0][8]).toBe('Economia')
  })

  it('soma economia total dos meses', () => {
    const total = computeTotalEconomyAcrossMonths([sampleMonth])
    expect(total).toBe(20)
  })
})
