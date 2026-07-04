import {
  endOfDay,
  endOfMonth,
  endOfYear,
  format,
  isValid,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfYear,
  subMonths,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { CashFlowPeriod } from '@/lib/cash-flow'
import { todayLocalISODate } from '@/lib/format-utils'

export type FinancialReportPeriodKey =
  | 'current_month'
  | 'last_month'
  | 'current_year'
  | 'all'
  | 'custom'

export interface FinancialReportPeriodConfig {
  period: FinancialReportPeriodKey
  customStart?: string
  customEnd?: string
}

export const FINANCIAL_REPORT_PERIOD_LABELS: Record<FinancialReportPeriodKey, string> = {
  current_month: 'Mês Atual',
  last_month: 'Mês Passado',
  current_year: 'Ano Atual',
  all: 'Todos os Períodos',
  custom: 'Período personalizado',
}

export const DEFAULT_FINANCIAL_REPORT_PERIOD_CONFIG: FinancialReportPeriodConfig = {
  period: 'current_month',
  customStart: todayLocalISODate(),
  customEnd: todayLocalISODate(),
}

export function getFinancialReportDateRange(
  period: FinancialReportPeriodKey,
): CashFlowPeriod | null {
  return resolveFinancialReportDateRange({ period })
}

export function resolveFinancialReportDateRange(
  config: FinancialReportPeriodConfig,
): CashFlowPeriod | null {
  const now = new Date()
  switch (config.period) {
    case 'current_month':
      return { start: startOfMonth(now), end: endOfMonth(now) }
    case 'last_month': {
      const lastMonth = subMonths(now, 1)
      return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) }
    }
    case 'current_year':
      return { start: startOfYear(now), end: endOfYear(now) }
    case 'custom': {
      const start = parseCalendarInput(config.customStart)
      const end = parseCalendarInput(config.customEnd)
      if (!start || !end) return null
      const rangeStart = startOfDay(start)
      const rangeEnd = endOfDay(end <= start ? start : end)
      return { start: rangeStart, end: rangeEnd }
    }
    case 'all':
    default:
      return null
  }
}

function parseCalendarInput(value?: string): Date | null {
  if (!value?.trim()) return null
  const parsed = parseISO(value.trim())
  return isValid(parsed) ? parsed : null
}

export function validateFinancialReportPeriodConfig(
  config: FinancialReportPeriodConfig,
): string | null {
  if (config.period !== 'custom') return null

  const start = parseCalendarInput(config.customStart)
  const end = parseCalendarInput(config.customEnd)

  if (!start) return 'Informe a data inicial do período.'
  if (!end) return 'Informe a data final do período.'
  if (end < start) return 'A data final deve ser igual ou posterior à data inicial.'

  return null
}

export function formatFinancialReportPeriodLabel(
  dateRange: CashFlowPeriod | null,
  period: FinancialReportPeriodKey,
): string {
  if (!dateRange) return FINANCIAL_REPORT_PERIOD_LABELS.all

  return `${format(dateRange.start, "dd 'de' MMMM", { locale: ptBR })} - ${format(dateRange.end, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`
}

export function getFinancialReportPeriodLabel(period: FinancialReportPeriodKey): string {
  const dateRange = getFinancialReportDateRange(period)
  return formatFinancialReportPeriodLabel(dateRange, period)
}

export function getFinancialReportPeriodLabelFromConfig(
  config: FinancialReportPeriodConfig,
): string {
  if (config.period === 'custom') {
    const error = validateFinancialReportPeriodConfig(config)
    if (error) return FINANCIAL_REPORT_PERIOD_LABELS.custom
  }

  const dateRange = resolveFinancialReportDateRange(config)
  return formatFinancialReportPeriodLabel(dateRange, config.period)
}

export function isDateInFinancialReportRange(
  isoDate: string,
  range: CashFlowPeriod,
): boolean {
  const date = parseCalendarInput(isoDate)
  if (!date) return false
  const timestamp = date.getTime()
  return timestamp >= range.start.getTime() && timestamp <= range.end.getTime()
}
