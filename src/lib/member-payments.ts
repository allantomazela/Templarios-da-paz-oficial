import { supabase } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  DEFAULT_MEMBERSHIP_DUE_DAY,
  fetchMembershipFeeSettings,
} from '@/lib/contribution-payments'
export interface MemberPayment {
  id: string
  type: 'monthly' | 'charity'
  description: string
  amount: number
  status: 'paid' | 'pending' | 'overdue'
  dueDate: string
  paymentDate?: string
  month?: number
  year?: number
}

function isMissingTableError(error: { code?: string; message?: string }): boolean {
  const code = error.code || ''
  const message = error.message || ''
  return (
    code === 'PGRST116' ||
    message.includes('404') ||
    message.includes('relation') ||
    message.includes('does not exist')
  )
}

/** Carrega mensalidades e doações do irmão autenticado (sem dados mockados). */
export async function fetchMemberPayments(userId: string): Promise<MemberPayment[]> {
  const supabaseAny = supabase as any
  const mappedPayments: MemberPayment[] = []

  let dueDay = DEFAULT_MEMBERSHIP_DUE_DAY
  try {
    const settings = await fetchMembershipFeeSettings()
    dueDay = settings.dueDay
  } catch {
    // mantém padrão
  }
  const { data: contributions, error: contributionsError } = await supabaseAny
    .from('contributions')
    .select('*')
    .eq('brother_id', userId)
    .order('year', { ascending: false })
    .order('month', { ascending: false })

  if (contributionsError) {
    if (!isMissingTableError(contributionsError)) {
      throw contributionsError
    }
  } else if (contributions) {
    contributions.forEach((cont: {
      id: string
      month: number
      year: number
      amount?: number
      status?: string
      payment_date?: string | null
    }) => {
      const dueDate = new Date(cont.year, cont.month - 1, dueDay)
      const today = new Date()
      const isOverdue = today > dueDate && cont.status !== 'Pago'

      mappedPayments.push({
        id: cont.id,
        type: 'monthly',
        description: `Mensalidade ${cont.month}/${cont.year}`,
        amount: Number(cont.amount) || 0,
        status:
          cont.status === 'Pago' ? 'paid' : isOverdue ? 'overdue' : 'pending',
        dueDate: format(dueDate, 'yyyy-MM-dd'),
        paymentDate: cont.payment_date
          ? format(new Date(cont.payment_date), 'yyyy-MM-dd')
          : undefined,
        month: cont.month,
        year: cont.year,
      })
    })
  }

  const { data: charity, error: charityError } = await supabaseAny
    .from('charity_donations')
    .select('*')
    .eq('brother_id', userId)
    .order('created_at', { ascending: false })

  if (charityError) {
    if (!isMissingTableError(charityError)) {
      throw charityError
    }
  } else if (charity) {
    charity.forEach((donation: {
      id: string
      amount?: number
      description?: string | null
      created_at: string
    }) => {
      mappedPayments.push({
        id: donation.id,
        type: 'charity',
        description:
          donation.description || 'Doação ao Tronco de Beneficência',
        amount: Number(donation.amount) || 0,
        status: 'paid',
        dueDate: format(new Date(donation.created_at), 'yyyy-MM-dd'),
        paymentDate: format(new Date(donation.created_at), 'yyyy-MM-dd'),
      })
    })
  }

  mappedPayments.sort(
    (a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime(),
  )

  return mappedPayments
}

export interface MemberFinancialSummary {
  hasData: boolean
  statusLabel: string
  statusClassName: string
  nextDueLabel: string | null
  lastPaymentAmount: number | null
  lastPaymentDate: string | null
}

export function buildMemberFinancialSummary(
  payments: MemberPayment[],
): MemberFinancialSummary {
  const monthly = payments.filter((p) => p.type === 'monthly')

  if (monthly.length === 0) {
    return {
      hasData: false,
      statusLabel: 'Sem registros',
      statusClassName: 'text-muted-foreground',
      nextDueLabel: null,
      lastPaymentAmount: null,
      lastPaymentDate: null,
    }
  }

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  const current = monthly.find(
    (p) => p.month === currentMonth && p.year === currentYear,
  )
  const pendingOrOverdue = monthly.filter(
    (p) => p.status === 'pending' || p.status === 'overdue',
  )
  const nextPending = pendingOrOverdue.sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
  )[0]

  const paidMonthly = monthly
    .filter((p) => p.status === 'paid')
    .sort((a, b) => {
      const da = a.paymentDate || a.dueDate
      const db = b.paymentDate || b.dueDate
      return new Date(db).getTime() - new Date(da).getTime()
    })

  const lastPaid = paidMonthly[0] ?? null

  let statusLabel = 'Em dia'
  let statusClassName = 'text-green-500'
  let nextDueLabel: string | null = null

  if (current?.status === 'overdue') {
    statusLabel = 'Em atraso'
    statusClassName = 'text-destructive'
    nextDueLabel = `Vencimento: ${format(new Date(current.dueDate), 'dd/MM/yyyy', { locale: ptBR })}`
  } else if (current?.status === 'pending') {
    statusLabel = 'Pendente'
    statusClassName = 'text-amber-600'
    nextDueLabel = `Vencimento: ${format(new Date(current.dueDate), 'dd/MM/yyyy', { locale: ptBR })}`
  } else if (!current && nextPending) {
    statusLabel =
      nextPending.status === 'overdue' ? 'Em atraso' : 'Pendente'
    statusClassName =
      nextPending.status === 'overdue' ? 'text-destructive' : 'text-amber-600'
    nextDueLabel = `Próximo vencimento: ${format(new Date(nextPending.dueDate), 'dd/MM/yyyy', { locale: ptBR })}`
  } else if (current?.status === 'paid') {
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1
    const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear
    const dayFromDue = current.dueDate
      ? new Date(current.dueDate).getDate()
      : DEFAULT_MEMBERSHIP_DUE_DAY
    nextDueLabel = `Próximo vencimento: ${String(dayFromDue).padStart(2, '0')}/${String(nextMonth).padStart(2, '0')}/${nextYear}`
  }

  return {
    hasData: true,
    statusLabel,
    statusClassName,
    nextDueLabel,
    lastPaymentAmount: lastPaid?.amount ?? null,
    lastPaymentDate: lastPaid?.paymentDate ?? lastPaid?.dueDate ?? null,
  }
}

export { formatCurrencyBRL } from '@/lib/format-utils'
