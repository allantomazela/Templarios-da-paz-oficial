/**
 * Dicionário único de rótulos de mensalidade usados na interface.
 *
 * Centraliza a terminologia para que todas as telas (tesouraria, painel do
 * irmão, extrato e "Meus Pagamentos") falem a mesma língua e mudanças de texto
 * aconteçam em um só lugar.
 *
 * Existe um espelho para a Edge Function (Deno) em
 * supabase/functions/_shared/membership-labels.ts — ao alterar os textos aqui,
 * alinhe também o espelho.
 */
export const MEMBERSHIP_LABELS = {
  /** Situação de um mês no cronograma. */
  paid: 'Pago',
  partial: 'Parcial',
  upcoming: 'À vencer',
  overdue: 'Em atraso',
  /** Valor ainda não pago de um período (colunas e cards). */
  toReceive: 'A receber',
} as const

export type MembershipLabelKey = keyof typeof MEMBERSHIP_LABELS
