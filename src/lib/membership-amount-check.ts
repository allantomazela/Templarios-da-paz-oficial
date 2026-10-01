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
