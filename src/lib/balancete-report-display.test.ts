import { describe, expect, it } from 'vitest'
import {
  DEFAULT_BALANCETE_DISPLAY_OPTIONS,
  hasVisibleBalanceteSection,
  resolveBalanceteDisplayOptions,
} from '@/lib/balancete-report-display'

describe('balancete-report-display', () => {
  it('oculta categorias de receita quando filtro é despesa', () => {
    const resolved = resolveBalanceteDisplayOptions(
      DEFAULT_BALANCETE_DISPLAY_OPTIONS,
      'Despesa',
    )

    expect(resolved.showIncomeCategories).toBe(false)
    expect(resolved.showExpenseCategories).toBe(true)
  })

  it('exige ao menos uma seção visível', () => {
    expect(
      hasVisibleBalanceteSection({
        ...DEFAULT_BALANCETE_DISPLAY_OPTIONS,
        showSummary: false,
        showIncomeCategories: false,
        showExpenseCategories: false,
        showLedger: false,
        showDocumentFooter: false,
      }),
    ).toBe(false)
  })
})
