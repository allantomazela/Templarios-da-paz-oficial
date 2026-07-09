import { mapAgapeChargeRow } from '@/lib/agape-payments'
import {
  ceremonyPlanLabel,
  CEREMONY_PAYMENT_TYPE_LABELS,
} from '@/lib/ceremony-payment-types'
import { fetchCeremonyPaymentPlans } from '@/lib/ceremony-payments'
import type { Contribution } from '@/lib/data'
import { mapContributionFromDB } from '@/lib/financial-mappers'
import { supabase } from '@/lib/supabase/client'
import {
  formatDateBR,
  getCalendarDateTimestamp,
  parseCalendarDate,
  toDateInputValue,
} from '@/lib/format-utils'
import {
  DEFAULT_MEMBERSHIP_DUE_DAY,
} from '@/lib/contribution-payments'
import {
  isMembershipMonthOverdue,
  membershipMonthEndDueDateIso,
} from '@/lib/membership-schedule'
import { MEMBERSHIP_LABELS } from '@/lib/membership-labels'

export type MemberPaymentType = 'monthly' | 'charity' | 'ceremony' | 'agape'

export const MEMBER_PAYMENT_TYPE_LABELS: Record<MemberPaymentType, string> = {
  monthly: 'Mensalidade',
  charity: 'Tronco',
  ceremony: 'Taxa de grau',
  agape: 'Ágape',
}

export interface MemberPayment {
  id: string
  type: MemberPaymentType
  categoryLabel?: string
  description: string
  amount: number
  status: 'paid' | 'pending' | 'overdue'
  dueDate: string
  paymentDate?: string
  month?: number
  year?: number
}

function mapDbStatusToMemberStatus(
  dbStatus: string,
  dueDate?: string,
): MemberPayment['status'] {
  if (dbStatus === 'Pago') return 'paid'
  if (dbStatus === 'Atrasado') return 'overdue'

  if (dueDate) {
    const due = parseCalendarDate(dueDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (due && due < today) return 'overdue'
  }

  return 'pending'
}

export function getMemberPaymentCategoryLabel(payment: MemberPayment): string {
  return payment.categoryLabel ?? MEMBER_PAYMENT_TYPE_LABELS[payment.type]
}

export function memberPaymentStatusLabel(
  status: MemberPayment['status'],
): string {
  switch (status) {
    case 'paid':
      return MEMBERSHIP_LABELS.paid
    case 'overdue':
      return MEMBERSHIP_LABELS.overdue
    case 'pending':
      return MEMBERSHIP_LABELS.upcoming
    default:
      return status
  }
}

/**
 * Alinha status de mensalidade com o cronograma: a mensalidade só fica em atraso
 * quando o mês de referência fecha (pode ser paga em qualquer dia do mês).
 */
export function mapContributionStatusToMemberPayment(
  dbStatus: string | undefined,
  year: number,
  month: number,
  referenceDate: Date = new Date(),
): MemberPayment['status'] {
  if (dbStatus === 'Pago') return 'paid'
  if (dbStatus === 'Atrasado') return 'overdue'

  if (isMembershipMonthOverdue(year, month, referenceDate)) return 'overdue'
  return 'pending'
}

export function sortMemberPaymentsForExtrato(
  payments: MemberPayment[],
): MemberPayment[] {
  return [...payments].sort((a, b) => {
    const dateA =
      a.status === 'paid' ? a.paymentDate || a.dueDate : a.dueDate
    const dateB =
      b.status === 'paid' ? b.paymentDate || b.dueDate : b.dueDate
    return getCalendarDateTimestamp(dateB) - getCalendarDateTimestamp(dateA)
  })
}

export function getPaidMemberPayments(
  payments: MemberPayment[],
): MemberPayment[] {
  return sortMemberPaymentsForExtrato(
    payments.filter((payment) => payment.status === 'paid'),
  )
}

export function sumPaidMemberPayments(payments: MemberPayment[]): number {
  return getPaidMemberPayments(payments).reduce(
    (sum, payment) => sum + payment.amount,
    0,
  )
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

export interface MemberPaymentsBundle {
  payments: MemberPayment[]
  /** Mensalidades no formato do cronograma (mês como nome), sem segunda query. */
  contributions: Contribution[]
}

/**
 * Carrega extrato unificado + contributions do irmão em paralelo
 * (mensalidades, tronco, taxas de grau e ágape).
 */
export async function fetchMemberPaymentsBundle(
  userId: string,
): Promise<MemberPaymentsBundle> {
  const supabaseAny = supabase as any
  const mappedPayments: MemberPayment[] = []
  let contributions: Contribution[] = []

  const [contributionsResult, charityResult, ceremonyResult, agapeResult] =
    await Promise.all([
      supabaseAny
        .from('contributions')
        .select('*')
        .eq('brother_id', userId)
        .order('year', { ascending: false })
        .order('month', { ascending: false }),
      supabaseAny
        .from('charity_donations')
        .select('*')
        .eq('brother_id', userId)
        .order('created_at', { ascending: false }),
      fetchCeremonyPaymentPlans(userId).catch((error: unknown) => {
        if (!isMissingTableError(error as { code?: string; message?: string })) {
          console.warn('Falha ao carregar taxas de grau do irmão.', error)
        }
        return [] as Awaited<ReturnType<typeof fetchCeremonyPaymentPlans>>
      }),
      supabaseAny
        .from('agape_brother_charges')
        .select('*')
        .eq('brother_id', userId)
        .order('year', { ascending: false })
        .order('month', { ascending: false }),
    ])

  const { data: contributionRows, error: contributionsError } =
    contributionsResult
  if (contributionsError) {
    if (!isMissingTableError(contributionsError)) {
      throw contributionsError
    }
  } else if (contributionRows) {
    contributions = contributionRows.map(mapContributionFromDB)
    for (const cont of contributionRows as {
      id: string
      month: number
      year: number
      amount?: number
      status?: string
      payment_date?: string | null
    }[]) {
      const dueDateIso = membershipMonthEndDueDateIso(cont.year, cont.month)

      mappedPayments.push({
        id: cont.id,
        type: 'monthly',
        description: `Mensalidade ${String(cont.month).padStart(2, '0')}/${cont.year}`,
        amount: Number(cont.amount) || 0,
        status: mapContributionStatusToMemberPayment(
          cont.status,
          cont.year,
          cont.month,
        ),
        dueDate: dueDateIso,
        paymentDate: cont.payment_date
          ? toDateInputValue(cont.payment_date)
          : undefined,
        month: cont.month,
        year: cont.year,
      })
    }
  }

  const { data: charity, error: charityError } = charityResult
  if (charityError) {
    if (!isMissingTableError(charityError)) {
      throw charityError
    }
  } else if (charity) {
    for (const donation of charity as {
      id: string
      amount?: number
      description?: string | null
      created_at: string
    }[]) {
      mappedPayments.push({
        id: donation.id,
        type: 'charity',
        description:
          donation.description || 'Doação ao Tronco de Beneficência',
        amount: Number(donation.amount) || 0,
        status: 'paid',
        dueDate: toDateInputValue(donation.created_at),
        paymentDate: toDateInputValue(donation.created_at),
      })
    }
  }

  for (const plan of ceremonyResult) {
    const categoryLabel = CEREMONY_PAYMENT_TYPE_LABELS[plan.paymentType]
    const planLabel = ceremonyPlanLabel(plan)

    for (const installment of plan.installments ?? []) {
      mappedPayments.push({
        id: installment.id,
        type: 'ceremony',
        categoryLabel,
        description: `${planLabel} — parcela ${installment.installmentNumber}/${plan.installmentsCount}`,
        amount: installment.amount,
        status: mapDbStatusToMemberStatus(
          installment.status,
          installment.dueDate,
        ),
        dueDate: installment.dueDate || todayLocalISODate(),
        paymentDate: installment.paymentDate
          ? toDateInputValue(installment.paymentDate)
          : undefined,
      })
    }
  }

  const { data: agapeCharges, error: agapeError } = agapeResult
  if (agapeError) {
    if (!isMissingTableError(agapeError)) {
      console.warn('Falha ao carregar cobranças do ágape do irmão.', agapeError)
    }
  } else if (agapeCharges) {
    for (const row of agapeCharges) {
      const charge = mapAgapeChargeRow(row)
      const dueDate = `${charge.year}-${String(charge.month).padStart(2, '0')}-10`

      mappedPayments.push({
        id: charge.id,
        type: 'agape',
        categoryLabel: 'Ágape',
        description: `Consumo Ágape ${String(charge.month).padStart(2, '0')}/${charge.year}`,
        amount: charge.amount,
        status: mapDbStatusToMemberStatus(charge.status, dueDate),
        dueDate,
        paymentDate: charge.paymentDate
          ? toDateInputValue(charge.paymentDate)
          : undefined,
        month: charge.month,
        year: charge.year,
      })
    }
  }

  return {
    payments: sortMemberPaymentsForExtrato(mappedPayments),
    contributions,
  }
}

/** Carrega extrato unificado do irmão: mensalidades, tronco, taxas de grau e ágape. */
export async function fetchMemberPayments(userId: string): Promise<MemberPayment[]> {
  const { payments } = await fetchMemberPaymentsBundle(userId)
  return payments
}

function todayLocalISODate(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
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
    (a, b) => getCalendarDateTimestamp(a.dueDate) - getCalendarDateTimestamp(b.dueDate),
  )[0]

  const lastPaid = getPaidMemberPayments(payments)[0] ?? null

  let statusLabel = 'Em dia'
  let statusClassName = 'text-green-500'
  let nextDueLabel: string | null = null

  if (current?.status === 'overdue') {
    statusLabel = 'Em atraso'
    statusClassName = 'text-destructive'
    nextDueLabel = `Vencimento: ${formatDateBR(current.dueDate)}`
  } else if (current?.status === 'pending') {
    statusLabel = 'Pendente'
    statusClassName = 'text-amber-600'
    nextDueLabel = `Vencimento: ${formatDateBR(current.dueDate)}`
  } else if (!current && nextPending) {
    statusLabel =
      nextPending.status === 'overdue' ? 'Em atraso' : 'Pendente'
    statusClassName =
      nextPending.status === 'overdue' ? 'text-destructive' : 'text-amber-600'
    nextDueLabel = `Próximo vencimento: ${formatDateBR(nextPending.dueDate)}`
  } else if (current?.status === 'paid') {
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1
    const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear
    const dayFromDue =
      parseCalendarDate(current.dueDate)?.getDate() ?? DEFAULT_MEMBERSHIP_DUE_DAY
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
