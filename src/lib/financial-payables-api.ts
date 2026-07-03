import { supabase } from '@/lib/supabase/client'
import { todayLocalISODate } from '@/lib/format-utils'
import { toError } from '@/lib/async-utils'
import type {
  FinancialPayable,
  PayableFormData,
  PayablePaymentFormData,
  PayableStatus,
} from '@/lib/financial-payable-types'
import { resolvePayableStatus } from '@/lib/financial-payables-status'

interface PayableRow {
  id: string
  description: string
  supplier_name: string | null
  category_id: string
  amount: number
  due_date: string
  status: PayableStatus
  payment_date: string | null
  account_id: string | null
  transaction_id: string | null
  forecast_item_id: string | null
  document_reference: string | null
  notes: string | null
  created_at: string
  updated_at: string
  financial_categories?: { name: string } | null
  financial_accounts?: { name: string } | null
}

function mapPayableRow(row: PayableRow): FinancialPayable {
  const status = resolvePayableStatus(row.due_date, row.status)
  return {
    id: row.id,
    description: row.description,
    supplierName: row.supplier_name ?? undefined,
    categoryId: row.category_id,
    categoryName: row.financial_categories?.name,
    amount: Number(row.amount),
    dueDate: row.due_date,
    status,
    paymentDate: row.payment_date ?? undefined,
    accountId: row.account_id ?? undefined,
    accountName: row.financial_accounts?.name,
    transactionId: row.transaction_id ?? undefined,
    forecastItemId: row.forecast_item_id ?? undefined,
    documentReference: row.document_reference ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

const PAYABLE_SELECT = `
  id,
  description,
  supplier_name,
  category_id,
  amount,
  due_date,
  status,
  payment_date,
  account_id,
  transaction_id,
  forecast_item_id,
  document_reference,
  notes,
  created_at,
  updated_at,
  financial_categories!financial_payables_category_id_fkey ( name ),
  financial_accounts!financial_payables_account_id_fkey ( name )
`

export async function fetchFinancialPayables(options?: {
  status?: PayableStatus | 'open' | 'all'
  dueFrom?: string
  dueTo?: string
}): Promise<FinancialPayable[]> {
  const supabaseAny = supabase as any
  let query = supabaseAny
    .from('financial_payables')
    .select(PAYABLE_SELECT)
    .order('due_date', { ascending: true })

  if (options?.dueFrom) {
    query = query.gte('due_date', options.dueFrom)
  }
  if (options?.dueTo) {
    query = query.lte('due_date', options.dueTo)
  }
  if (options?.status === 'open') {
    query = query.in('status', ['Pendente', 'Atrasado'])
  } else if (options?.status && options.status !== 'all') {
    query = query.eq('status', options.status)
  }

  const { data, error } = await query
  if (error) throw error

  const rows = (data ?? []) as PayableRow[]
  await refreshOverduePayableStatuses(rows)
  return rows.map((row) => mapPayableRow(row))
}

async function refreshOverduePayableStatuses(rows: PayableRow[]): Promise<void> {
  const supabaseAny = supabase as any
  const toUpdate = rows.filter((row) => {
    if (row.status === 'Pago' || row.status === 'Cancelado') return false
    return resolvePayableStatus(row.due_date, row.status) === 'Atrasado' && row.status !== 'Atrasado'
  })

  if (toUpdate.length === 0) return

  await Promise.all(
    toUpdate.map((row) =>
      supabaseAny
        .from('financial_payables')
        .update({ status: 'Atrasado' })
        .eq('id', row.id)
        .in('status', ['Pendente', 'Atrasado']),
    ),
  )

  for (const row of toUpdate) {
    row.status = 'Atrasado'
  }
}

async function assertExpenseCategory(categoryId: string): Promise<string> {
  const supabaseAny = supabase as any
  const { data, error } = await supabaseAny
    .from('financial_categories')
    .select('id, name, type')
    .eq('id', categoryId)
    .maybeSingle()

  if (error || !data) {
    throw new Error('Categoria não encontrada.')
  }
  if (data.type !== 'Despesa') {
    throw new Error('Selecione uma categoria de despesa.')
  }
  return data.name as string
}

async function syncPayableTransaction(params: {
  payableId: string
  description: string
  categoryName: string
  amount: number
  status: PayableStatus
  paymentDate?: string
  accountId?: string
  existingTransactionId?: string | null
  forecastItemId?: string | null
  attachmentNotes?: string
}): Promise<string | null> {
  const supabaseAny = supabase as any

  if (params.status !== 'Pago') {
    if (params.existingTransactionId) {
      const { error } = await supabaseAny
        .from('financial_transactions')
        .delete()
        .eq('id', params.existingTransactionId)
      if (error) throw error
    }
    return null
  }

  if (!params.accountId) {
    throw new Error('Selecione a conta bancária para registrar o pagamento.')
  }

  const paymentDate = params.paymentDate || todayLocalISODate()

  const payload = {
    date: paymentDate,
    description: params.description,
    category: params.categoryName,
    type: 'Despesa' as const,
    amount: params.amount,
    account_id: params.accountId,
    forecast_item_id: params.forecastItemId ?? null,
    attachment_notes: params.attachmentNotes?.trim() || null,
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
  return created.id as string
}

export async function saveFinancialPayable(
  data: PayableFormData,
  existingId?: string | null,
): Promise<string> {
  const supabaseAny = supabase as any
  await assertExpenseCategory(data.categoryId)

  const status = resolvePayableStatus(data.dueDate, 'Pendente')

  const payload = {
    description: data.description.trim(),
    supplier_name: data.supplierName?.trim() || null,
    category_id: data.categoryId,
    amount: data.amount,
    due_date: data.dueDate,
    status,
    forecast_item_id: data.forecastItemId ?? null,
    document_reference: data.documentReference?.trim() || null,
    notes: data.notes?.trim() || null,
    payment_date: null,
    account_id: null,
    transaction_id: null,
  }

  if (existingId) {
    const { data: existing, error: fetchError } = await supabaseAny
      .from('financial_payables')
      .select('status, transaction_id')
      .eq('id', existingId)
      .maybeSingle()

    if (fetchError || !existing) {
      throw new Error('Conta a pagar não encontrada.')
    }
    if (existing.status === 'Pago') {
      throw new Error('Não é possível editar uma conta já paga. Estorne o pagamento primeiro.')
    }

    const { error } = await supabaseAny
      .from('financial_payables')
      .update({
        description: payload.description,
        supplier_name: payload.supplier_name,
        category_id: payload.category_id,
        amount: payload.amount,
        due_date: payload.due_date,
        status: resolvePayableStatus(data.dueDate, existing.status === 'Cancelado' ? 'Cancelado' : 'Pendente'),
        forecast_item_id: payload.forecast_item_id,
        document_reference: payload.document_reference,
        notes: payload.notes,
      })
      .eq('id', existingId)

    if (error) throw toError(error, 'Falha ao salvar conta a pagar.')
    return existingId
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: created, error } = await supabaseAny
    .from('financial_payables')
    .insert({
      ...payload,
      created_by: user?.id ?? null,
    })
    .select('id')
    .single()

  if (error) throw toError(error, 'Falha ao criar conta a pagar.')
  return created.id as string
}

export async function updatePayablePayment(
  payableId: string,
  data: PayablePaymentFormData,
): Promise<void> {
  const supabaseAny = supabase as any

  const { data: payable, error: fetchError } = await supabaseAny
    .from('financial_payables')
    .select(PAYABLE_SELECT)
    .eq('id', payableId)
    .maybeSingle()

  if (fetchError || !payable) {
    throw new Error('Conta a pagar não encontrada.')
  }

  const row = payable as PayableRow
  const categoryName = row.financial_categories?.name
  if (!categoryName) {
    throw new Error('Categoria da conta a pagar inválida.')
  }

  let nextStatus: PayableStatus = data.status
  if (data.status === 'Pendente' || data.status === 'Atrasado') {
    nextStatus = resolvePayableStatus(row.due_date, data.status)
  }

  const transactionId = await syncPayableTransaction({
    payableId,
    description: row.description,
    categoryName,
    amount: Number(row.amount),
    status: nextStatus,
    paymentDate: data.paymentDate,
    accountId: data.accountId,
    existingTransactionId: row.transaction_id,
    forecastItemId: row.forecast_item_id,
    attachmentNotes: data.attachmentNotes,
  })

  const updatePayload: Record<string, unknown> = {
    status: nextStatus,
    payment_date: nextStatus === 'Pago' ? data.paymentDate || todayLocalISODate() : null,
    account_id: nextStatus === 'Pago' ? data.accountId ?? null : null,
    transaction_id: transactionId,
  }

  const { error } = await supabaseAny
    .from('financial_payables')
    .update(updatePayload)
    .eq('id', payableId)

  if (error) throw toError(error, 'Falha ao atualizar pagamento.')
}

export async function cancelFinancialPayable(payableId: string): Promise<void> {
  await updatePayablePayment(payableId, { status: 'Cancelado' })

  const supabaseAny = supabase as any
  const { error } = await supabaseAny
    .from('financial_payables')
    .update({
      status: 'Cancelado',
      payment_date: null,
      account_id: null,
      transaction_id: null,
    })
    .eq('id', payableId)

  if (error) throw error
}

export async function deleteFinancialPayable(payableId: string): Promise<void> {
  const supabaseAny = supabase as any
  const { data: payable, error: fetchError } = await supabaseAny
    .from('financial_payables')
    .select('status, transaction_id')
    .eq('id', payableId)
    .maybeSingle()

  if (fetchError) throw fetchError
  if (!payable) return

  if (payable.status === 'Pago' && payable.transaction_id) {
    throw new Error(
      'Estorne o pagamento antes de excluir. Use "Voltar para pendente" ou exclua a despesa vinculada.',
    )
  }

  const { error } = await supabaseAny
    .from('financial_payables')
    .delete()
    .eq('id', payableId)

  if (error) throw error
}

export interface CreatePayableFromForecastInput {
  description: string
  categoryId: string
  amount: number
  dueDate: string
  forecastItemId: string
  notes?: string
}

export async function createPayableFromForecast(
  input: CreatePayableFromForecastInput,
): Promise<string> {
  return saveFinancialPayable({
    description: input.description,
    categoryId: input.categoryId,
    amount: input.amount,
    dueDate: input.dueDate,
    forecastItemId: input.forecastItemId,
    notes: input.notes,
  })
}

export async function fetchOpenPayablesCount(): Promise<number> {
  const payables = await fetchFinancialPayables({ status: 'open' })
  return payables.length
}
