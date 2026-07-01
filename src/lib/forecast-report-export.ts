import type {
  ForecastComparisonRow,
  ForecastMonthSummary,
  ForecastProjectionResult,
} from '@/lib/forecast-types'
import { downloadCsvFile } from '@/lib/export-utils'
import {
  computeMonthEconomyTotal,
  formatForecastMonthLabel,
  getForecastRowStatusLabel,
} from '@/lib/forecast-projection'

function formatDateBR(isoDate: string): string {
  const [year, month, day] = isoDate.split('-')
  return `${day}/${month}/${year}`
}

function formatAmount(value: number): string {
  return value.toFixed(2).replace('.', ',')
}

export function buildForecastPlanningCsvRows(
  months: ForecastMonthSummary[],
): string[][] {
  const rows: string[][] = []

  for (const month of months) {
    for (const row of month.rows) {
      rows.push([
        month.label,
        formatDateBR(row.dueDate),
        row.description,
        row.type,
        row.categoryName,
        formatAmount(row.expectedAmount),
        formatAmount(row.realizedAmount),
        formatAmount(row.variance),
        getForecastRowStatusLabel(row),
      ])
    }
  }

  return rows
}

export function exportForecastPlanningCsv(
  projection: ForecastProjectionResult,
): void {
  const rows = buildForecastPlanningCsvRows(projection.months)
  if (rows.length === 0) {
    throw new Error('Nenhum dado de planejamento para exportar.')
  }

  downloadCsvFile(
    [
      'Mês',
      'Vencimento',
      'Descrição',
      'Tipo',
      'Categoria',
      'Previsto (R$)',
      'Realizado (R$)',
      'Variação (R$)',
      'Status',
    ],
    rows,
    'planejamento-financeiro',
  )
}

export function buildForecastPlanningSummaryRows(
  projection: ForecastProjectionResult,
): Array<{
  label: string
  expectedIncome: number
  expectedExpense: number
  realizedIncome: number
  realizedExpense: number
  netExpected: number
  netRealized: number
  economyTotal: number
}> {
  return projection.months.map((month) => ({
    label: month.label,
    expectedIncome: month.expectedIncome,
    expectedExpense: month.expectedExpense,
    realizedIncome: month.realizedIncome,
    realizedExpense: month.realizedExpense,
    netExpected: month.netExpected,
    netRealized: month.netRealized,
    economyTotal: computeMonthEconomyTotal(month.rows),
  }))
}

export function computeTotalEconomyAcrossMonths(
  months: ForecastMonthSummary[],
): number {
  return months.reduce(
    (sum, month) => sum + computeMonthEconomyTotal(month.rows),
    0,
  )
}

export function formatForecastMonthTitle(year: number, month: number): string {
  return formatForecastMonthLabel(year, month)
}

export type { ForecastComparisonRow }
