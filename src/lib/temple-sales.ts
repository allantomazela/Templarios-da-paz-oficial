import { supabase } from '@/lib/supabase/client'
import { toError } from '@/lib/async-utils'
import { todayLocalISODate } from '@/lib/format-utils'
import {
  TEMPLE_SALE_CATEGORY,
  type TempleSale,
  type TempleSaleFormData,
  type TempleSaleMarkPaidData,
  type TempleSaleStatus,
} from '@/lib/temple-sale-types'

interface TempleSaleRow {
  id: string
  brother_id: string
  description: string
  amount: number
  sale_date: string
  due_date: string | null
  payment_mode: 'avista' | 'prazo'
  status: TempleSaleStatus
  payment_date: string | null
  transaction_id: string | null
  account_id: string | null
  notes: string | null
  recorded_by: string | null
  created_at: string
  profiles?: { id: string; full_name: string | null }
}

function formatError(error: unknown): Error {
  return toError(error, 'Erro ao salvar venda do templo.')
}

function mapRow(row: TempleSaleRow): TempleSale {
  return {
    id: row.id,
    brotherId: row.brother_id,
    brotherName: row.profiles?.full_name ?? undefined,
    description: row.description,
    amount: Number(row.amount),
    saleDate: row.sale_date,
    dueDate: row.due_date ?? undefined,
    paymentMode: row.payment_mode,
    status: row.status,
    paymentDate: row.payment_date ?? undefined,
    accountId: row.account_id ?? undefined,
    transactionId: row.transaction_id ?? undefined,
    notes: row.notes ?? undefined,
    recordedBy: row.recorded_by ?? undefined,
    createdAt: row.created_at,
  }
}

async function resolveTempleSaleCategoryId(
  supabaseAny: ReturnType<typeof supabase> & object,
): Promise<string> {
  const { data, error } = await supabaseAny
    .from('financial_categories')
    .select('id')
    .eq('name', TEMPLE_SALE_CATEGORY)
    .eq('type', 'Receita')
    .maybeSingle()

  if (error) throw error
  if (data?.id) return data.id as string

  const { data: created, error: insertError } = await supabaseAny
    .from('financial_categories')
    .insert({
      name: TEMPLE_SALE_CATEGORY,
      type: 'Receita',
      description: 'Vendas e cobranças avulsas do templo por irmão',
      color: '#0f766e',
    })
    .select('id')
    .single()

  if (insertError) throw insertError
  return created.id as string
}

function buildSaleDescription(params: {
  brotherName: string
  description: string
  paymentDate: string
}): string {
  return `Venda do Templo — ${params.brotherName}: ${params.description} (${params.paymentDate})`
}

async function syncSaleTransaction(
  supabaseAny: ReturnType<typeof supabase> & object,
  params: {
    saleId: string
    brotherName: string
    description: string
    amount: number
    status: TempleSaleStatus
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
      .from('temple_sales')
      .update({ transaction_id: null })
      .eq('id', params.saleId)
    return null
  }

  if (!params.accountId) {
    throw new Error('Selecione a conta bancária para registrar o pagamento.')
  }

  const paymentDate = params.paymentDate || todayLocalISODate()
  const categoryId = await resolveTempleSaleCategoryId(supabaseAny)
  const description = buildSaleDescription({
    brotherName: params.brotherName,
    description: params.description,
    paymentDate,
  })

  const payload = {
    date: paymentDate,
    description,
    category: TEMPLE_SALE_CATEGORY,
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

  const { error: linkError } = await supabaseAny
    .from('temple_sales')
    .update({ transaction_id: created.id })
    .eq('id', params.saleId)

  if (linkError) throw linkError
  return created.id as string
}

export async function fetchTempleSales(filters?: {
  brotherId?: string
  status?: TempleSaleStatus | 'all'
}): Promise<TempleSale[]> {
  const supabaseAny = supabase as any
  let query = supabaseAny
    .from('temple_sales')
    .select(
      'id, brother_id, description, amount, sale_date, due_date, payment_mode, status, payment_date, transaction_id, account_id, notes, recorded_by, created_at, profiles!temple_sales_brother_id_fkey(id, full_name)',
    )
    .order('sale_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (filters?.brotherId) {
    query = query.eq('brother_id', filters.brotherId)
  }
  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }

  const { data, error } = await query
  if (error) throw formatError(error)
  return ((data ?? []) as TempleSaleRow[]).map(mapRow)
}

export async function saveTempleSale(data: TempleSaleFormData): Promise<TempleSale> {
  const supabaseAny = supabase as any
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isPaid = data.status === 'Pago'
  const payload = {
    brother_id: data.brotherId,
    description: data.description.trim(),
    amount: data.amount,
    sale_date: data.saleDate,
    due_date: data.paymentMode === 'prazo' ? data.dueDate || null : null,
    payment_mode: data.paymentMode,
    status: data.status,
    payment_date: isPaid ? data.paymentDate || todayLocalISODate() : null,
    account_id: isPaid ? data.accountId ?? null : null,
    notes: data.notes?.trim() || null,
    recorded_by: user?.id ?? null,
  }

  let saleId = data.id
  let existingTransactionId: string | null = null

  if (saleId) {
    const { data: existing, error: existingError } = await supabaseAny
      .from('temple_sales')
      .select('transaction_id')
      .eq('id', saleId)
      .maybeSingle()
    if (existingError) throw formatError(existingError)
    existingTransactionId = existing?.transaction_id ?? null

    const { error } = await supabaseAny
      .from('temple_sales')
      .update(payload)
      .eq('id', saleId)
    if (error) throw formatError(error)
  } else {
    const { data: created, error } = await supabaseAny
      .from('temple_sales')
      .insert(payload)
      .select('id')
      .single()
    if (error) throw formatError(error)
    saleId = created.id as string
  }

  await syncSaleTransaction(supabaseAny, {
    saleId: saleId!,
    brotherName: data.brotherName?.trim() || 'Irmão',
    description: payload.description,
    amount: data.amount,
    status: data.status,
    paymentDate: payload.payment_date ?? undefined,
    accountId: data.accountId,
    existingTransactionId,
  })

  const { data: savedRow, error: reloadError } = await supabaseAny
    .from('temple_sales')
    .select(
      'id, brother_id, description, amount, sale_date, due_date, payment_mode, status, payment_date, transaction_id, account_id, notes, recorded_by, created_at, profiles!temple_sales_brother_id_fkey(id, full_name)',
    )
    .eq('id', saleId)
    .single()

  if (reloadError) throw formatError(reloadError)
  return mapRow(savedRow as TempleSaleRow)
}

export async function markTempleSalePaid(
  data: TempleSaleMarkPaidData,
): Promise<void> {
  const supabaseAny = supabase as any
  const { data: existing, error: fetchError } = await supabaseAny
    .from('temple_sales')
    .select(
      'id, brother_id, description, amount, transaction_id, profiles!temple_sales_brother_id_fkey(full_name)',
    )
    .eq('id', data.saleId)
    .single()

  if (fetchError) throw formatError(fetchError)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const paymentDate = data.paymentDate || todayLocalISODate()

  const { error } = await supabaseAny
    .from('temple_sales')
    .update({
      status: 'Pago',
      payment_date: paymentDate,
      account_id: data.accountId,
      notes: data.notes?.trim() || null,
      recorded_by: user?.id ?? null,
    })
    .eq('id', data.saleId)

  if (error) throw formatError(error)

  await syncSaleTransaction(supabaseAny, {
    saleId: data.saleId,
    brotherName:
      data.brotherName?.trim() ||
      existing.profiles?.full_name ||
      'Irmão',
    description: existing.description,
    amount: Number(existing.amount),
    status: 'Pago',
    paymentDate,
    accountId: data.accountId,
    existingTransactionId: existing.transaction_id,
  })
}

export async function cancelTempleSale(saleId: string): Promise<void> {
  const supabaseAny = supabase as any
  const { data: existing, error: fetchError } = await supabaseAny
    .from('temple_sales')
    .select('id, transaction_id')
    .eq('id', saleId)
    .single()

  if (fetchError) throw formatError(fetchError)

  if (existing.transaction_id) {
    const { deleteFinancialTransactionWithDependencies } = await import(
      '@/lib/financial-transaction-delete'
    )
    await deleteFinancialTransactionWithDependencies(existing.transaction_id)
  }

  const { error } = await supabaseAny
    .from('temple_sales')
    .update({
      status: 'Cancelado',
      payment_date: null,
      account_id: null,
      transaction_id: null,
    })
    .eq('id', saleId)

  if (error) throw formatError(error)
}

export async function deleteTempleSale(saleId: string): Promise<void> {
  const supabaseAny = supabase as any
  const { data: existing, error: fetchError } = await supabaseAny
    .from('temple_sales')
    .select('id, transaction_id')
    .eq('id', saleId)
    .single()

  if (fetchError) throw formatError(fetchError)

  if (existing.transaction_id) {
    const { deleteFinancialTransactionWithDependencies } = await import(
      '@/lib/financial-transaction-delete'
    )
    await deleteFinancialTransactionWithDependencies(existing.transaction_id)
  }

  const { error } = await supabaseAny
    .from('temple_sales')
    .delete()
    .eq('id', saleId)

  if (error) throw formatError(error)
}
