import { formatCurrencyBRL } from '@/lib/format-utils'

export const FINANCIAL_AMOUNTS_VISIBLE_KEY =
  'templarios.financial.amountsVisible'

export const HIDDEN_CURRENCY_PLACEHOLDER = 'R$ ••••••'

/** Formata BRL ou mascara o valor para apresentação / local público. */
export function formatCurrencyBRLMaybeHidden(
  value: number | string | null | undefined,
  visible: boolean,
): string {
  if (!visible) return HIDDEN_CURRENCY_PLACEHOLDER
  return formatCurrencyBRL(value)
}

export function readFinancialAmountsVisible(): boolean {
  try {
    const raw = localStorage.getItem(FINANCIAL_AMOUNTS_VISIBLE_KEY)
    if (raw === null) return true
    return raw === '1' || raw === 'true'
  } catch {
    return true
  }
}

export function writeFinancialAmountsVisible(visible: boolean): void {
  try {
    localStorage.setItem(FINANCIAL_AMOUNTS_VISIBLE_KEY, visible ? '1' : '0')
  } catch {
    // localStorage pode estar indisponível
  }
}
