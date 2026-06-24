import type { BalanceteTypeFilter } from '@/lib/accounting-balancete'

export interface BalanceteReportDisplayOptions {
  showSummary: boolean
  showIncomeCategories: boolean
  showExpenseCategories: boolean
  showLedger: boolean
  showAttachmentDetails: boolean
  showDocumentFooter: boolean
}

export const DEFAULT_BALANCETE_DISPLAY_OPTIONS: BalanceteReportDisplayOptions = {
  showSummary: true,
  showIncomeCategories: true,
  showExpenseCategories: true,
  showLedger: true,
  showAttachmentDetails: true,
  showDocumentFooter: true,
}

export const BALANCETE_DISPLAY_OPTION_LABELS: Record<
  keyof BalanceteReportDisplayOptions,
  string
> = {
  showSummary: 'Resumo consolidado por conta',
  showIncomeCategories: 'Receitas por categoria',
  showExpenseCategories: 'Despesas por categoria',
  showLedger: 'Razão analítico (lançamentos)',
  showAttachmentDetails: 'Observações e comprovantes',
  showDocumentFooter: 'Rodapé informativo',
}

export function resolveBalanceteDisplayOptions(
  options: BalanceteReportDisplayOptions,
  typeFilter: BalanceteTypeFilter,
): BalanceteReportDisplayOptions {
  return {
    ...options,
    showIncomeCategories:
      options.showIncomeCategories &&
      (typeFilter === 'all' || typeFilter === 'Receita'),
    showExpenseCategories:
      options.showExpenseCategories &&
      (typeFilter === 'all' || typeFilter === 'Despesa'),
  }
}

export function hasVisibleBalanceteSection(
  options: BalanceteReportDisplayOptions,
): boolean {
  return (
    options.showSummary ||
    options.showIncomeCategories ||
    options.showExpenseCategories ||
    options.showLedger ||
    options.showDocumentFooter
  )
}

export function isDisplayOptionAvailable(
  key: keyof BalanceteReportDisplayOptions,
  typeFilter: BalanceteTypeFilter,
): boolean {
  if (key === 'showIncomeCategories') {
    return typeFilter === 'all' || typeFilter === 'Receita'
  }
  if (key === 'showExpenseCategories') {
    return typeFilter === 'all' || typeFilter === 'Despesa'
  }
  return true
}
