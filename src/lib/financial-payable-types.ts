export type PayableStatus = 'Pendente' | 'Pago' | 'Atrasado' | 'Cancelado'

export interface FinancialPayable {
  id: string
  description: string
  supplierName?: string
  categoryId: string
  categoryName?: string
  amount: number
  dueDate: string
  status: PayableStatus
  paymentDate?: string
  accountId?: string
  accountName?: string
  transactionId?: string
  forecastItemId?: string
  documentReference?: string
  notes?: string
  createdAt?: string
  updatedAt?: string
}

export interface PayableFormData {
  description: string
  supplierName?: string
  categoryId: string
  amount: number
  dueDate: string
  forecastItemId?: string | null
  documentReference?: string
  notes?: string
}

export interface PayablePaymentFormData {
  status: 'Pago' | 'Pendente' | 'Atrasado' | 'Cancelado'
  paymentDate?: string
  accountId?: string
  attachmentNotes?: string
}

export const PAYABLE_STATUS_LABELS: Record<PayableStatus, string> = {
  Pendente: 'Pendente',
  Pago: 'Pago',
  Atrasado: 'Em atraso',
  Cancelado: 'Cancelado',
}

export interface PayableReminderSettings {
  enabled: boolean
  frequency: 'before' | 'on_due' | 'after'
  days: number
}

export interface PayableReminderRun {
  id: string
  source: 'cron' | 'manual'
  startedAt: string
  finishedAt: string | null
  alertsCount: number
  sentCount: number
  skippedCount: number
  failedCount: number
  message: string | null
  error: string | null
}
