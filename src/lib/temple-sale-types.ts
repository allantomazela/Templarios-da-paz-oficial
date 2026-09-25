export const TEMPLE_SALE_CATEGORY = 'Venda do Templo'

export type TempleSalePaymentMode = 'avista' | 'prazo'
export type TempleSaleStatus = 'Pago' | 'Pendente' | 'Atrasado' | 'Cancelado'

export interface TempleSale {
  id: string
  brotherId: string
  brotherName?: string
  description: string
  amount: number
  saleDate: string
  dueDate?: string
  paymentMode: TempleSalePaymentMode
  status: TempleSaleStatus
  paymentDate?: string
  accountId?: string
  transactionId?: string
  notes?: string
  recordedBy?: string
  createdAt?: string
}

export interface TempleSaleFormData {
  id?: string
  brotherId: string
  brotherName?: string
  description: string
  amount: number
  saleDate: string
  dueDate?: string
  paymentMode: TempleSalePaymentMode
  status: TempleSaleStatus
  paymentDate?: string
  accountId?: string
  notes?: string
}

export interface TempleSaleMarkPaidData {
  saleId: string
  brotherName?: string
  description: string
  amount: number
  paymentDate: string
  accountId: string
  notes?: string
  existingTransactionId?: string | null
}

export const TEMPLE_SALE_PAYMENT_MODE_LABELS: Record<
  TempleSalePaymentMode,
  string
> = {
  avista: 'À vista',
  prazo: 'A prazo',
}

export function templeSaleStatusLabel(status: TempleSaleStatus): string {
  switch (status) {
    case 'Pago':
      return 'Pago'
    case 'Pendente':
      return 'Pendente'
    case 'Atrasado':
      return 'Atrasado'
    case 'Cancelado':
      return 'Cancelado'
    default:
      return status
  }
}
