import { supabase } from '@/lib/supabase/client'
import { toError } from '@/lib/async-utils'
import { todayLocalISODate } from '@/lib/format-utils'
import {
  CEREMONY_FINANCIAL_CATEGORIES,
  splitInstallmentAmounts,
  type CeremonyInstallmentFormData,
  type CeremonyInstallmentStatus,
  type CeremonyPaymentInstallment,
  type CeremonyPaymentPlan,
  type CeremonyPaymentType,
  type CeremonyPlanFormData,
} from '@/lib/ceremony-payment-types'

interface PlanRow {
  id: string
  brother_id: string
  payment_type: CeremonyPaymentType
  description: string | null
  total_amount: number
  installments_count: number
  ceremony_date: string | null
  status: 'open' | 'paid' | 'cancelled'
  profiles?: { id: string; full_name: string | null }
  brother_ceremony_payment_installments?: InstallmentRow[]
}

interface InstallmentRow {
  id: string
  plan_id: string
  installment_number: number
  amount: number
  due_date: string | null
  status: CeremonyInstallmentStatus
  payment_date: string | null
  transaction_id: string | null
  account_id: string | null
  notes: string | null
}

function formatError(error: unknown): Error {
  return toError(error, 'Erro ao salvar taxa de grau.')
}

function mapInstallmentRow(row: InstallmentRow): CeremonyPaymentInstallment {
  return {
    id: row.id,
    planId: row.plan_id,
    installmentNumber: row.installment_number,
    amount: Number(row.amount),
    dueDate: row.due_date ?? undefined,
    status: row.status,
    paymentDate: row.payment_date ?? undefined,
    accountId: row.account_id ?? undefined,
    transactionId: row.transaction_id ?? undefined,
    notes: row.notes ?? undefined,
  }
}

function mapPlanRow(row: PlanRow): CeremonyPaymentPlan {
  const installments = (row.brother_ceremony_payment_installments ?? [])
    .map(mapInstallmentRow)
    .sort((a, b) => a.installmentNumber - b.installmentNumber)

  const paidAmount = installments
    .filter((i) => i.status === 'Pago')
    .reduce((sum, i) => sum + i.amount, 0)

  return {
    id: row.id,
    brotherId: row.brother_id,
    brotherName: row.profiles?.full_name ?? undefined,
    paymentType: row.payment_type,
    description: row.description ?? undefined,
    totalAmount: Number(row.total_amount),
    installmentsCount: row.installments_count,
    ceremonyDate: row.ceremony_date ?? undefined,
    status: row.status,
    paidAmount,
    remainingAmount: Math.max(0, Number(row.total_amount) - paidAmount),
    paidInstallmentsCount: installments.filter((i) => i.status === 'Pago').length,
    installments,
  }
}

function addMonthsToIsoDate(isoDate: string, monthsToAdd: number): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  const date = new Date(y, m - 1 + monthsToAdd, d)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

async function resolveCategoryId(
  supabaseAny: ReturnType<typeof supabase> & object,
  paymentType: CeremonyPaymentType,
): Promise<string> {
  const categoryName = CEREMONY_FINANCIAL_CATEGORIES[paymentType]
  const { data, error } = await supabaseAny
    .from('financial_categories')
    .select('id')
    .eq('name', categoryName)
    .eq('type', 'Receita')
    .maybeSingle()

  if (error) throw error
  if (data?.id) return data.id as string

  const { data: created, error: insertError } = await supabaseAny
    .from('financial_categories')
    .insert({
      name: categoryName,
      type: 'Receita',
      description: `Receitas de ${categoryName}`,
      color: '#64748b',
    })
    .select('id')
    .single()

  if (insertError) throw insertError
  return created.id as string
}

function buildInstallmentDescription(params: {
  brotherName: string
  paymentType: CeremonyPaymentType
  planDescription?: string
  installmentNumber: number
  installmentsCount: number
  paymentDate: string
}): string {
  const name = params.brotherName.trim() || 'Irmão'
  const typeLabel = CEREMONY_FINANCIAL_CATEGORIES[params.paymentType]
  const detail =
    params.paymentType === 'Outros' && params.planDescription?.trim()
      ? ` (${params.planDescription.trim()})`
      : ''
  return `${typeLabel}${detail} - ${name} (parcela ${params.installmentNumber}/${params.installmentsCount}) - ${params.paymentDate}`
}

async function syncInstallmentTransaction(
  supabaseAny: ReturnType<typeof supabase> & object,
  params: {
    installmentId: string
    brotherName: string
    paymentType: CeremonyPaymentType
    planDescription?: string
    installmentNumber: number
    installmentsCount: number
    amount: number
    status: CeremonyInstallmentStatus
    paymentDate?: string
    accountId?: string
    existingTransactionId?: string | null
  },
): Promise<string | null> {
  const isPaid = params.status === 'Pago'

  if (!isPaid) {
    if (params.existingTransactionId) {
      const { error } = await supabaseAny
        .from('financial_transactions')
        .delete()
        .eq('id', params.existingTransactionId)
      if (error) throw error
    }
    await supabaseAny
      .from('brother_ceremony_payment_installments')
      .update({ transaction_id: null })
      .eq('id', params.installmentId)
    return null
  }

  if (!params.accountId) {
    throw new Error('Selecione a conta bancária para registrar o pagamento.')
  }

  const paymentDate = params.paymentDate || todayLocalISODate()
  const categoryId = await resolveCategoryId(supabaseAny, params.paymentType)
  const categoryName = CEREMONY_FINANCIAL_CATEGORIES[params.paymentType]
  const description = buildInstallmentDescription({
    brotherName: params.brotherName,
    paymentType: params.paymentType,
    planDescription: params.planDescription,
    installmentNumber: params.installmentNumber,
    installmentsCount: params.installmentsCount,
    paymentDate,
  })

  const payload = {
    date: paymentDate,
    description,
    category: categoryName,
    category_id: categoryId,
    type: 'Receita' as const,
    amount: params.amount,
    account_id: params.accountId,
  }

  if (params.existingTransactionId) {
    const { error } = await supabaseAny
      .from('financial_transactions')
      .update(payload)
      .eq('id', params.existingTransactionId)
    if (error) throw error
    return params.existingTransactionId
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: created, error } = await supabaseAny
    .from('financial_transactions')
    .insert({
      ...payload,
      created_by: user?.id ?? null,
      idempotency_key:
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : undefined,
    })
    .select('id')
    .single()

  if (error) throw error

  await supabaseAny
    .from('brother_ceremony_payment_installments')
    .update({ transaction_id: created.id })
    .eq('id', params.installmentId)

  return created.id as string
}

async function refreshPlanStatus(
  supabaseAny: ReturnType<typeof supabase> & object,
  planId: string,
): Promise<void> {
  const { error } = await supabaseAny.rpc('refresh_ceremony_plan_status', {
    p_plan_id: planId,
  })
  if (error) throw error
}

const PLAN_SELECT = `
  *,
  profiles!brother_ceremony_payment_plans_brother_id_fkey ( id, full_name ),
  brother_ceremony_payment_installments (*)
`

export async function fetchCeremonyPaymentPlans(
  brotherId?: string | null,
): Promise<CeremonyPaymentPlan[]> {
  const supabaseAny = supabase as any
  let query = supabaseAny
    .from('brother_ceremony_payment_plans')
    .select(PLAN_SELECT)
    .neq('status', 'cancelled')
    .order('created_at', { ascending: false })

  if (brotherId) {
    query = query.eq('brother_id', brotherId)
  }

  const { data, error } = await query
  if (error) throw formatError(error)

  return (data as PlanRow[]).map(mapPlanRow)
}

export async function createCeremonyPaymentPlan(
  data: CeremonyPlanFormData,
): Promise<CeremonyPaymentPlan> {
  const supabaseAny = supabase as any
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const amounts = splitInstallmentAmounts(data.totalAmount, data.installmentsCount)
  const firstDue = data.firstDueDate || todayLocalISODate()

  const { data: plan, error: planError } = await supabaseAny
    .from('brother_ceremony_payment_plans')
    .insert({
      brother_id: data.brotherId,
      payment_type: data.paymentType,
      description: data.description?.trim() || null,
      total_amount: data.totalAmount,
      installments_count: data.installmentsCount,
      ceremony_date: data.ceremonyDate || null,
      recorded_by: user?.id ?? null,
    })
    .select('id')
    .single()

  if (planError) throw formatError(planError)

  const installmentsPayload = amounts.map((amount, index) => ({
    plan_id: plan.id,
    installment_number: index + 1,
    amount,
    due_date: data.installmentsCount > 1 ? addMonthsToIsoDate(firstDue, index) : firstDue,
    status: 'Pendente' as const,
    recorded_by: user?.id ?? null,
  }))

  const { error: installmentsError } = await supabaseAny
    .from('brother_ceremony_payment_installments')
    .insert(installmentsPayload)

  if (installmentsError) {
    await supabaseAny
      .from('brother_ceremony_payment_plans')
      .delete()
      .eq('id', plan.id)
    throw formatError(installmentsError)
  }

  const plans = await fetchCeremonyPaymentPlans(data.brotherId)
  const created = plans.find((p) => p.id === plan.id)
  if (!created) throw new Error('Plano criado, mas não foi possível recarregar.')

  if (data.registerPayment?.accountId) {
    const firstInstallment = created.installments?.[0]
    if (!firstInstallment) {
      throw new Error('Plano criado, mas nenhuma parcela foi encontrada para registrar o pagamento.')
    }

    await saveCeremonyInstallment(
      {
        installmentId: firstInstallment.id,
        brotherName: data.brotherName,
        paymentType: data.paymentType,
        planDescription: data.description,
        installmentNumber: firstInstallment.installmentNumber,
        installmentsCount: data.installmentsCount,
        amount: firstInstallment.amount,
        status: 'Pago',
        paymentDate: data.registerPayment.paymentDate,
        accountId: data.registerPayment.accountId,
        notes: data.registerPayment.notes,
      },
      { planId: created.id, existingTransactionId: null },
    )

    const refreshed = await fetchCeremonyPaymentPlans(data.brotherId)
    return refreshed.find((p) => p.id === plan.id) ?? created
  }

  return created
}

export async function saveCeremonyInstallment(
  data: CeremonyInstallmentFormData,
  options?: { existingTransactionId?: string | null; planId: string },
): Promise<void> {
  const supabaseAny = supabase as any
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const payload = {
    status: data.status,
    payment_date: data.status === 'Pago' ? data.paymentDate || todayLocalISODate() : null,
    account_id: data.status === 'Pago' ? data.accountId ?? null : null,
    notes: data.notes?.trim() || null,
    recorded_by: user?.id ?? null,
  }

  const { error } = await supabaseAny
    .from('brother_ceremony_payment_installments')
    .update(payload)
    .eq('id', data.installmentId)

  if (error) throw formatError(error)

  await syncInstallmentTransaction(supabaseAny, {
    installmentId: data.installmentId,
    brotherName: data.brotherName?.trim() || 'Irmão',
    paymentType: data.paymentType,
    planDescription: data.planDescription,
    installmentNumber: data.installmentNumber,
    installmentsCount: data.installmentsCount,
    amount: data.amount,
    status: data.status,
    paymentDate: payload.payment_date ?? undefined,
    accountId: data.accountId,
    existingTransactionId: options?.existingTransactionId,
  })

  if (options?.planId) {
    await refreshPlanStatus(supabaseAny, options.planId)
  }
}

export async function deleteCeremonyPaymentPlan(planId: string): Promise<void> {
  const supabaseAny = supabase as any

  const { data: installments, error: fetchError } = await supabaseAny
    .from('brother_ceremony_payment_installments')
    .select('id, transaction_id')
    .eq('plan_id', planId)

  if (fetchError) throw formatError(fetchError)

  for (const row of installments ?? []) {
    if (row.transaction_id) {
      const { error: txError } = await supabaseAny
        .from('financial_transactions')
        .delete()
        .eq('id', row.transaction_id)
      if (txError) throw txError
    }
  }

  const { error } = await supabaseAny
    .from('brother_ceremony_payment_plans')
    .delete()
    .eq('id', planId)

  if (error) throw formatError(error)
}

export async function cancelCeremonyPaymentPlan(planId: string): Promise<void> {
  const supabaseAny = supabase as any
  const { error } = await supabaseAny
    .from('brother_ceremony_payment_plans')
    .update({ status: 'cancelled' })
    .eq('id', planId)
  if (error) throw formatError(error)
}
