export type FinancialCustomReportContentMode =
  | 'realized'
  | 'pending'
  | 'both'

export const FINANCIAL_CUSTOM_REPORT_CONTENT_MODE_LABELS: Record<
  FinancialCustomReportContentMode,
  string
> = {
  realized: 'Somente movimentações realizadas',
  pending: 'Somente valores a vencer',
  both: 'Realizados + a vencer',
}

export interface FinancialCustomReportDisplayOptions {
  showSummary: boolean
  showPendingSection: boolean
  showRealizedSummary: boolean
  showAccountBreakdown: boolean
  showIncomeCategories: boolean
  showExpenseCategories: boolean
  showRealizedLedger: boolean
  showAttachmentDetails: boolean
  showDocumentFooter: boolean
}

export const DEFAULT_FINANCIAL_CUSTOM_REPORT_DISPLAY_OPTIONS: FinancialCustomReportDisplayOptions =
  {
    showSummary: true,
    showPendingSection: true,
    showRealizedSummary: true,
    showAccountBreakdown: true,
    showIncomeCategories: true,
    showExpenseCategories: true,
    showRealizedLedger: false,
    showAttachmentDetails: true,
    showDocumentFooter: true,
  }

export const FINANCIAL_CUSTOM_REPORT_DISPLAY_LABELS: Record<
  keyof FinancialCustomReportDisplayOptions,
  string
> = {
  showSummary: 'Resumo geral (totais)',
  showPendingSection: 'Valores a vencer / pendentes',
  showRealizedSummary: 'Totais de receitas e despesas realizadas',
  showAccountBreakdown: 'Movimentação por conta',
  showIncomeCategories: 'Receitas por categoria',
  showExpenseCategories: 'Despesas por categoria',
  showRealizedLedger: 'Lançamentos realizados (detalhado)',
  showAttachmentDetails: 'Observações nos lançamentos',
  showDocumentFooter: 'Rodapé informativo',
}

export function resolveFinancialCustomReportDisplay(
  options: FinancialCustomReportDisplayOptions,
  contentMode: FinancialCustomReportContentMode,
): FinancialCustomReportDisplayOptions {
  const showRealized =
    contentMode === 'realized' || contentMode === 'both'
  const showPending =
    contentMode === 'pending' || contentMode === 'both'

  return {
    ...options,
    showPendingSection: options.showPendingSection && showPending,
    showRealizedSummary: options.showRealizedSummary && showRealized,
    showAccountBreakdown: options.showAccountBreakdown && showRealized,
    showIncomeCategories: options.showIncomeCategories && showRealized,
    showExpenseCategories: options.showExpenseCategories && showRealized,
    showRealizedLedger: options.showRealizedLedger && showRealized,
    showAttachmentDetails:
      options.showAttachmentDetails &&
      options.showRealizedLedger &&
      showRealized,
  }
}

export function hasVisibleFinancialCustomReportSection(
  options: FinancialCustomReportDisplayOptions,
): boolean {
  return Object.values(options).some(Boolean)
}
