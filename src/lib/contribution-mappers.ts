import type { Contribution } from '@/lib/data'
import type { ContributionTreasuryMode } from '@/lib/membership-control-only'
import { monthNumberToName } from '@/lib/contribution-months'

export const MENSALIDADE_CATEGORY = 'Mensalidade'

export interface ContributionFormData {
  brotherId: string
  brotherName?: string
  month: string
  year: number
  amount: number
  status: 'Pago' | 'Pendente' | 'Atrasado'
  paymentDate?: string
  accountId?: string
  notes?: string
  treasuryMode?: ContributionTreasuryMode
  linkedTransactionId?: string
}

/** Linha de `contributions` com o perfil do irmão (join opcional). */
export interface ContributionRow {
  id: string
  brother_id: string
  month: number
  year: number
  amount: number
  /** TEXT no banco; valores válidos garantidos pelas telas de lançamento. */
  status: string
  payment_date: string | null
  transaction_id: string | null
  account_id: string | null
  notes: string | null
  profiles?: { id: string; full_name: string | null }
}

export function mapContributionRow(row: ContributionRow): Contribution {
  return {
    id: row.id,
    brotherId: row.brother_id,
    brotherName: row.profiles?.full_name ?? undefined,
    month: monthNumberToName(row.month),
    year: row.year,
    amount: Number(row.amount),
    status: row.status as Contribution['status'],
    paymentDate: row.payment_date ?? undefined,
    accountId: row.account_id ?? undefined,
    transactionId: row.transaction_id ?? undefined,
    notes: row.notes ?? undefined,
  }
}

export function buildMensalidadeDescription(
  brotherName: string,
  month: number,
  year: number,
  paymentDate?: string,
): string {
  const name = brotherName.trim() || 'Irmão'
  const period = `${String(month).padStart(2, '0')}/${year}`
  if (paymentDate) {
    return `Mensalidade - ${name} (${period}) - ${paymentDate}`
  }
  return `Mensalidade - ${name} (${period})`
}
