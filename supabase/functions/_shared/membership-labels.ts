// Espelho (Deno) do dicionário de rótulos de mensalidade de src/lib/membership-labels.ts.
// Mantido separado porque a Edge Function roda em Deno e não importa código de src/.
// Se alterar os textos aqui, alinhe também src/lib/membership-labels.ts.
export const MEMBERSHIP_LABELS = {
  paid: 'Pago',
  partial: 'Parcial',
  upcoming: 'À vencer',
  overdue: 'Em atraso',
  toReceive: 'A receber',
} as const

export type MembershipLabelKey = keyof typeof MEMBERSHIP_LABELS
