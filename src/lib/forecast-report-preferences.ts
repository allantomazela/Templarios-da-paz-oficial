import {
  DEFAULT_FORECAST_REPORT_DISPLAY_OPTIONS,
  type ForecastReportDisplayOptions,
} from '@/lib/forecast-report-display'

export const FORECAST_REPORT_PREFERENCES_KEY = 'forecast_report_preferences'

export type ForecastReportMonthScope = 'all' | '0' | '1' | '2'

export interface ForecastReportPreferences {
  displayOptions: ForecastReportDisplayOptions
  monthScope: ForecastReportMonthScope
}

function parseDisplayOptions(value: unknown): ForecastReportDisplayOptions | null {
  if (!value || typeof value !== 'object') return null

  const raw = value as Record<string, unknown>
  const keys = Object.keys(
    DEFAULT_FORECAST_REPORT_DISPLAY_OPTIONS,
  ) as (keyof ForecastReportDisplayOptions)[]

  const options = { ...DEFAULT_FORECAST_REPORT_DISPLAY_OPTIONS }
  for (const key of keys) {
    if (typeof raw[key] === 'boolean') {
      options[key] = raw[key]
    }
  }

  return options
}

function parseMonthScope(value: unknown): ForecastReportMonthScope | null {
  if (value === 'all' || value === '0' || value === '1' || value === '2') {
    return value
  }
  return null
}

function parsePreferences(value: unknown): ForecastReportPreferences | null {
  if (!value || typeof value !== 'object') return null

  const raw = value as Record<string, unknown>
  const displayOptions = parseDisplayOptions(raw.displayOptions)
  const monthScope = parseMonthScope(raw.monthScope)

  if (!displayOptions || !monthScope) return null

  return { displayOptions, monthScope }
}

export function loadForecastReportPreferences(): ForecastReportPreferences | null {
  try {
    const saved = localStorage.getItem(FORECAST_REPORT_PREFERENCES_KEY)
    if (!saved) return null
    return parsePreferences(JSON.parse(saved))
  } catch {
    return null
  }
}

export function saveForecastReportPreferences(
  preferences: ForecastReportPreferences,
): void {
  try {
    localStorage.setItem(
      FORECAST_REPORT_PREFERENCES_KEY,
      JSON.stringify(preferences),
    )
  } catch {
    // localStorage indisponível
  }
}
