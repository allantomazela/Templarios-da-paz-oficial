import { formatCurrencyBRL } from '@/lib/format-utils'

export interface MembershipAmountWarning {
  kind: 'above' | 'below'
  title: string
  message: string
  difference: number
}

/**
 * Mensalidade aceita um lançamento por irmão/mês; valores fora do esperado
 * costumam ser lanche ou outra cobrança somada por engano.
 */
export function getMembershipAmountWarning(
  amount: number,
  expectedAmount: number,
): MembershipAmountWarning | null {
  if (!Number.isFinite(amount) || !Number.isFinite(expectedAmount)) return null
  if (amount <= 0 || expectedAmount <= 0) return null

  const difference = Math.round((amount - expectedAmount) * 100) / 100
  if (Math.abs(difference) < 0.01) return null

  const expectedLabel = formatCurrencyBRL(expectedAmount)

  if (difference > 0) {
    return {
      kind: 'above',
      title: 'Valor acima da mensalidade',
      message: `A mensalidade esperada é ${expectedLabel}. Se os ${formatCurrencyBRL(difference)} a mais forem lanche, venda ou outra cobrança, lance aqui só ${expectedLabel} e registre a diferença em Vendas do Templo (ou na categoria correta).`,
      difference,
    }
  }

  return {
    kind: 'below',
    title: 'Valor abaixo da mensalidade',
    message: `A mensalidade esperada é ${expectedLabel}. Com este valor o mês fica parcial (faltam ${formatCurrencyBRL(-difference)}). Se não for mensalidade (ex.: lanche), registre em Vendas do Templo.`,
    difference,
  }
}

export interface MembershipAmountReduction {
  previousAmount: number
  newAmount: number
  missingAmount: number
}

/**
 * Edição que reduz a mensalidade para abaixo do esperado — típico de trocar a
 * mensalidade pelo valor do lanche, o que reabre o mês no cronograma.
 */
export function getMembershipAmountReduction(
  previousAmount: number,
  newAmount: number,
  expectedAmount: number,
): MembershipAmountReduction | null {
  if (![previousAmount, newAmount, expectedAmount].every(Number.isFinite)) {
    return null
  }
  if (newAmount <= 0 || expectedAmount <= 0) return null

  const roundedNew = roundCents(newAmount)
  if (roundedNew >= roundCents(previousAmount)) return null
  if (roundedNew >= roundCents(expectedAmount)) return null

  return {
    previousAmount: roundCents(previousAmount),
    newAmount: roundedNew,
    missingAmount: roundCents(expectedAmount - newAmount),
  }
}

function roundCents(value: number): number {
  return Math.round(value * 100) / 100
}
