import {
  ANNIVERSARY_CATEGORY_OPTIONS,
  DEFAULT_ANNIVERSARY_CATEGORY_FILTERS,
  type AgendaReportKind,
  type AgendaReportPeriod,
  type AnniversaryCategoryFilters,
} from '@/lib/agenda-events'

export const AGENDA_REPORT_PREFERENCES_KEY = 'agenda_report_preferences'

export interface AgendaReportPreferences {
  reportKind: AgendaReportKind
  period: AgendaReportPeriod
  monthValue: string
  yearValue: number
  quarter: number
  half: number
  categoryFilters: AnniversaryCategoryFilters
}

const VALID_PERIODS: AgendaReportPeriod[] = [
  'monthly',
  'quarterly',
  'semiannual',
  'annual',
]

const VALID_KINDS: AgendaReportKind[] = ['sessions', 'anniversaries']

function isValidMonthValue(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}$/.test(value)
}

function parseCategoryFilters(value: unknown): AnniversaryCategoryFilters | null {
  if (!value || typeof value !== 'object') return null

  const record = value as Record<string, unknown>
  const filters = { ...DEFAULT_ANNIVERSARY_CATEGORY_FILTERS }

  for (const option of ANNIVERSARY_CATEGORY_OPTIONS) {
    if (typeof record[option.id] !== 'boolean') return null
    filters[option.id] = record[option.id]
  }

  return filters
}

function parsePreferences(value: unknown): AgendaReportPreferences | null {
  if (!value || typeof value !== 'object') return null

  const raw = value as Record<string, unknown>
  if (!VALID_KINDS.includes(raw.reportKind as AgendaReportKind)) return null
  if (!VALID_PERIODS.includes(raw.period as AgendaReportPeriod)) return null
  if (!isValidMonthValue(raw.monthValue)) return null
  if (typeof raw.yearValue !== 'number' || !Number.isFinite(raw.yearValue)) {
    return null
  }
  if (typeof raw.quarter !== 'number' || raw.quarter < 1 || raw.quarter > 4) {
    return null
  }
  if (typeof raw.half !== 'number' || raw.half < 1 || raw.half > 2) return null

  const categoryFilters = parseCategoryFilters(raw.categoryFilters)
  if (!categoryFilters) return null

  return {
    reportKind: raw.reportKind as AgendaReportKind,
    period: raw.period as AgendaReportPeriod,
    monthValue: raw.monthValue,
    yearValue: raw.yearValue,
    quarter: raw.quarter,
    half: raw.half,
    categoryFilters,
  }
}

export function loadAgendaReportPreferences(): AgendaReportPreferences | null {
  try {
    const saved = localStorage.getItem(AGENDA_REPORT_PREFERENCES_KEY)
    if (!saved) return null
    return parsePreferences(JSON.parse(saved))
  } catch {
    return null
  }
}

export function saveAgendaReportPreferences(
  preferences: AgendaReportPreferences,
): void {
  try {
    localStorage.setItem(
      AGENDA_REPORT_PREFERENCES_KEY,
      JSON.stringify(preferences),
    )
  } catch {
    // localStorage pode estar indisponível (modo privado, quota, etc.)
  }
}
