import type { AgapeReportPeriodParams, AgapeReportScope } from '@/lib/agape-report'

export const AGAPE_REPORT_PREFERENCES_KEY = 'agape_report_preferences'

export interface AgapeReportPreferences extends AgapeReportPeriodParams {
  scope: AgapeReportScope
  selectedSessionId: string
}

const VALID_SCOPES: AgapeReportScope[] = [
  'session',
  'monthly',
  'quarterly',
  'semiannual',
  'annual',
]

function isValidMonthValue(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}$/.test(value)
}

function parsePreferences(value: unknown): AgapeReportPreferences | null {
  if (!value || typeof value !== 'object') return null

  const raw = value as Record<string, unknown>
  if (!VALID_SCOPES.includes(raw.scope as AgapeReportScope)) return null
  if (!isValidMonthValue(raw.monthValue)) return null
  if (typeof raw.yearValue !== 'number' || !Number.isFinite(raw.yearValue)) {
    return null
  }
  if (typeof raw.quarter !== 'number' || raw.quarter < 1 || raw.quarter > 4) {
    return null
  }
  if (typeof raw.half !== 'number' || raw.half < 1 || raw.half > 2) return null
  if (typeof raw.selectedSessionId !== 'string') return null

  return {
    scope: raw.scope as AgapeReportScope,
    monthValue: raw.monthValue,
    yearValue: raw.yearValue,
    quarter: raw.quarter,
    half: raw.half,
    selectedSessionId: raw.selectedSessionId,
  }
}

export function loadAgapeReportPreferences(): AgapeReportPreferences | null {
  try {
    const saved = localStorage.getItem(AGAPE_REPORT_PREFERENCES_KEY)
    if (!saved) return null
    return parsePreferences(JSON.parse(saved))
  } catch {
    return null
  }
}

export function saveAgapeReportPreferences(
  preferences: AgapeReportPreferences,
): void {
  try {
    localStorage.setItem(
      AGAPE_REPORT_PREFERENCES_KEY,
      JSON.stringify(preferences),
    )
  } catch {
    // localStorage pode estar indisponível
  }
}
