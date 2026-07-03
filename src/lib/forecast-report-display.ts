export interface ForecastReportDisplayOptions {
  showGlobalMetrics: boolean
  showMonthSummary: boolean
  showCashFlowComparison: boolean
  showUnplannedTransactions: boolean
  showAccountProjections: boolean
  showComparisonByMonth: boolean
  showDocumentFooter: boolean
}

export const DEFAULT_FORECAST_REPORT_DISPLAY_OPTIONS: ForecastReportDisplayOptions =
  {
    showGlobalMetrics: true,
    showMonthSummary: true,
    showCashFlowComparison: true,
    showUnplannedTransactions: true,
    showAccountProjections: true,
    showComparisonByMonth: true,
    showDocumentFooter: true,
  }

export const FORECAST_REPORT_DISPLAY_OPTION_LABELS: Record<
  keyof ForecastReportDisplayOptions,
  string
> = {
  showGlobalMetrics: 'Indicadores gerais (saldo, projeção, economia)',
  showMonthSummary: 'Resumo consolidado por mês',
  showCashFlowComparison:
    'Confronto com fluxo de caixa (por conta e total)',
  showUnplannedTransactions: 'Lançamentos fora do previsto',
  showAccountProjections: 'Projeção por conta bancária',
  showComparisonByMonth: 'Detalhamento previsto × realizado',
  showDocumentFooter: 'Rodapé informativo',
}

export function hasVisibleForecastReportSection(
  options: ForecastReportDisplayOptions,
): boolean {
  return (
    options.showGlobalMetrics ||
    options.showMonthSummary ||
    options.showCashFlowComparison ||
    options.showUnplannedTransactions ||
    options.showAccountProjections ||
    options.showComparisonByMonth ||
    options.showDocumentFooter
  )
}
