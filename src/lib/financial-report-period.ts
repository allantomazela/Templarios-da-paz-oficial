import {
  endOfMonth,
  endOfYear,
  format,
  startOfMonth,
  startOfYear,
  subMonths,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { CashFlowPeriod } from '@/lib/cash-flow'

export type FinancialReportPeriodKey =
  | 'current_month'
  | 'last_month'
  | 'current_year'
  | 'all'

export const FINANCIAL_REPORT_PERIOD_LABELS: Record<FinancialReportPeriodKey, string> = {
  current_month: 'Mês Atual',
  last_month: 'Mês Passado',
  current_year: 'Ano Atual',
  all: 'Todos os Períodos',
}

export function getFinancialReportDateRange(
  period: FinancialReportPeriodKey,
): CashFlowPeriod | null {
  const now = new Date()
  switch (period) {
    case 'current_month':
      return { start: startOfMonth(now), end: endOfMonth(now) }
    case 'last_month': {
      const lastMonth = subMonths(now, 1)
      return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) }
    }
    case 'current_year':
      return { start: startOfYear(now), end: endOfYear(now) }
    case 'all':
    default:
      return null
  }
}

export function getFinancialReportPeriodLabel(period: FinancialReportPeriodKey): string {
  const dateRange = getFinancialReportDateRange(period)
  if (!dateRange) return FINANCIAL_REPORT_PERIOD_LABELS.all

  return `${format(dateRange.start, "dd 'de' MMMM", { locale: ptBR })} - ${format(dateRange.end, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`
}
