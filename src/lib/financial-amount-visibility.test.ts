import { describe, expect, it } from 'vitest'
import { formatCurrencyBRL } from '@/lib/format-utils'
import {
  HIDDEN_CURRENCY_PLACEHOLDER,
  formatCurrencyBRLMaybeHidden,
} from '@/lib/financial-amount-visibility'

describe('formatCurrencyBRLMaybeHidden', () => {
  it('mostra o valor formatado quando visível', () => {
    expect(formatCurrencyBRLMaybeHidden(1234.5, true)).toBe(
      formatCurrencyBRL(1234.5),
    )
  })

  it('mascara o valor quando oculto', () => {
    expect(formatCurrencyBRLMaybeHidden(1234.5, false)).toBe(
      HIDDEN_CURRENCY_PLACEHOLDER,
    )
  })
})
