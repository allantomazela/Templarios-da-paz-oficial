import type { PayableStatus } from '@/lib/financial-payable-types'

/** Data local YYYY-MM-DD (sem horário) para comparação de vencimento. */
export function toLocalDateIso(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Deriva o status operacional a partir do vencimento.
 * Pago e Cancelado não são alterados automaticamente.
 */
export function resolvePayableStatus(
  dueDate: string,
  currentStatus: PayableStatus,
  referenceDate: Date = new Date(),
): PayableStatus {
  if (currentStatus === 'Pago' || currentStatus === 'Cancelado') {
    return currentStatus
  }

  const today = toLocalDateIso(referenceDate)
  if (dueDate < today) return 'Atrasado'
  return 'Pendente'
}

export function isPayableOpen(status: PayableStatus): boolean {
  return status === 'Pendente' || status === 'Atrasado'
}

export function shouldSendPayableReminder(
  dueDate: string,
  frequency: 'before' | 'on_due' | 'after',
  days: number,
  referenceDate: Date = new Date(),
): boolean {
  const today = toLocalDateIso(referenceDate)
  const due = new Date(`${dueDate}T12:00:00`)
  const ref = new Date(`${today}T12:00:00`)
  const diffMs = due.getTime() - ref.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

  switch (frequency) {
    case 'before':
      return diffDays >= 0 && diffDays <= days
    case 'on_due':
      return diffDays === 0
    case 'after':
      return diffDays < 0 && Math.abs(diffDays) >= days
    default:
      return false
  }
}
