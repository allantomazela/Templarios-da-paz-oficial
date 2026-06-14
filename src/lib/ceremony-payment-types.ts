export const CEREMONY_PAYMENT_TYPES = [
  'Iniciacao',
  'Elevacao',
  'Exaltacao',
  'Outros',
] as const

export type CeremonyPaymentType = (typeof CEREMONY_PAYMENT_TYPES)[number]

export const CEREMONY_PAYMENT_TYPE_LABELS: Record<CeremonyPaymentType, string> = {
  Iniciacao: 'Iniciação',
  Elevacao: 'Elevação',
  Exaltacao: 'Exaltação',
  Outros: 'Outros',
}

export const CEREMONY_FINANCIAL_CATEGORIES: Record<CeremonyPaymentType, string> = {
  Iniciacao: 'Iniciação',
  Elevacao: 'Elevação',
  Exaltacao: 'Exaltação',
  Outros: 'Outros (Irmãos)',
}

export type CeremonyPlanStatus = 'open' | 'paid' | 'cancelled'

export type CeremonyInstallmentStatus = 'Pago' | 'Pendente' | 'Atrasado'

export interface CeremonyPaymentPlan {
  id: string
  brotherId: string
  brotherName?: string
  paymentType: CeremonyPaymentType
  description?: string
  totalAmount: number
  installmentsCount: number
  ceremonyDate?: string
  status: CeremonyPlanStatus
  paidAmount: number
  remainingAmount: number
  paidInstallmentsCount: number
  installments?: CeremonyPaymentInstallment[]
}

export interface CeremonyPaymentInstallment {
  id: string
  planId: string
  installmentNumber: number
  amount: number
  dueDate?: string
  status: CeremonyInstallmentStatus
  paymentDate?: string
  accountId?: string
  transactionId?: string
  notes?: string
}

export interface CeremonyPlanFormData {
  brotherId: string
  brotherName?: string
  paymentType: CeremonyPaymentType
  description?: string
  totalAmount: number
  installmentsCount: number
  firstDueDate?: string
  ceremonyDate?: string
}

export interface CeremonyInstallmentFormData {
  installmentId: string
  brotherName?: string
  paymentType: CeremonyPaymentType
  planDescription?: string
  installmentNumber: number
  installmentsCount: number
  amount: number
  status: CeremonyInstallmentStatus
  paymentDate?: string
  accountId?: string
  notes?: string
}

/** Divide valor total em parcelas iguais (última ajusta centavos). */
export function splitInstallmentAmounts(
  totalAmount: number,
  count: number,
): number[] {
  if (count <= 0) return []
  if (count === 1) return [Math.round(totalAmount * 100) / 100]

  const base = Math.floor((totalAmount / count) * 100) / 100
  const amounts = Array.from({ length: count - 1 }, () => base)
  const sumSoFar = base * (count - 1)
  amounts.push(Math.round((totalAmount - sumSoFar) * 100) / 100)
  return amounts
}

export function ceremonyPlanLabel(plan: Pick<CeremonyPaymentPlan, 'paymentType' | 'description'>): string {
  const base = CEREMONY_PAYMENT_TYPE_LABELS[plan.paymentType]
  if (plan.paymentType === 'Outros' && plan.description?.trim()) {
    return `${base}: ${plan.description.trim()}`
  }
  return base
}
