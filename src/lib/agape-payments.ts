import { supabase } from '@/lib/supabase/client'
import { toError, isDuplicateKeyError } from '@/lib/async-utils'
import { todayLocalISODate } from '@/lib/format-utils'
import type { AgapeBrotherCharge, AgapeMonthlyClosing } from '@/lib/data'
import {
  CONTRIBUTION_MONTHS,
  fetchApprovedBrothers,
  fetchBankAccounts,
  monthNameToNumber,
  monthNumberToName,
} from '@/lib/contribution-payments'

export const AGAPE_CATEGORY = 'Ágape'

export { CONTRIBUTION_MONTHS, monthNameToNumber, monthNumberToName, fetchBankAccounts }

export interface AgapeChargeFormData {
  brotherId: string
  brotherName?: string
  month: string
  year: number
  consumedAmount: number
  amount: number
  status: 'Pago' | 'Pendente' | 'Atrasado'
  paymentDate?: string
  accountId?: string
  notes?: string
}

export interface GenerateAgapeChargesResult {
  created: number
  updated: number
  totalConsumed: number
  brothersWithConsumption: number
}

interface ChargeRow {
  id: string
  brother_id: string
  month: number
  year: number
  consumed_amount: number
  amount: number
  status: 'Pago' | 'Pendente' | 'Atrasado'
  payment_date: string | null
  transaction_id: string | null
  account_id: string | null
  notes: string | null
  closing_id: string | null
  profiles?: { id: string; full_name: string | null }
}

interface ClosingRow {
  id: string
  month: number
  year: number
  total_consumed: number
  total_beverages_spent: number | null
  total_paid: number
  status: 'open' | 'closed'
  notes: string | null
  closed_at: string | null
}

interface ConsumptionTotalRow {
  brother_id: string
  brother_name: string
  total_amount: number
  total_items: number
}

function formatSupabaseError(error: unknown): Error {
  return toError(error, 'Erro ao salvar cobrança do ágape.')
}

export function mapAgapeChargeRow(row: ChargeRow): AgapeBrotherCharge {
  return {
    id: row.id,
    brotherId: row.brother_id,
    brotherName: row.profiles?.full_name ?? undefined,
    month: row.month,
    year: row.year,
    consumedAmount: Number(row.consumed_amount),
    amount: Number(row.amount),
    status: row.status,
    paymentDate: row.payment_date ?? undefined,
    accountId: row.account_id ?? undefined,
    transactionId: row.transaction_id ?? undefined,
    notes: row.notes ?? undefined,
    closingId: row.closing_id ?? undefined,
  }
}

export function mapAgapeClosingRow(row: ClosingRow): AgapeMonthlyClosing {
  return {
    id: row.id,
    month: row.month,
    year: row.year,
    totalConsumed: Number(row.total_consumed),
    totalBeveragesSpent:
      row.total_beverages_spent != null
        ? Number(row.total_beverages_spent)
        : undefined,
    totalPaid: Number(row.total_paid),
    status: row.status,
    notes: row.notes ?? undefined,
    closedAt: row.closed_at ?? undefined,
  }
}

async function ensureOpenClosing(
  supabaseAny: ReturnType<typeof supabase> & object,
  month: number,
  year: number,
): Promise<AgapeMonthlyClosing> {
  const existing = await fetchAgapeMonthlyClosing(month, year)
  if (existing) {
    if (existing.status === 'closed') {
      throw new Error('O fechamento deste mês já está encerrado.')
    }
    return existing
  }

  const { data, error } = await supabaseAny
    .from('agape_monthly_closings')
    .insert({
      month,
      year,
      total_consumed: 0,
      total_paid: 0,
      status: 'open',
    })
    .select('*')
    .single()

  if (error) throw formatSupabaseError(error)
  return mapAgapeClosingRow(data as ClosingRow)
}

/** Define o valor total gasto em bebidas no mês (informado no fechamento). */
export async function saveAgapeMonthlyTotal(
  month: number,
  year: number,
  totalBeveragesSpent: number,
): Promise<AgapeMonthlyClosing> {
  if (totalBeveragesSpent <= 0) {
    throw new Error('Informe um valor total maior que zero.')
  }

  const supabaseAny = supabase as any
  const closing = await ensureOpenClosing(supabaseAny, month, year)

  const { data, error } = await supabaseAny
    .from('agape_monthly_closings')
    .update({ total_beverages_spent: totalBeveragesSpent })
    .eq('id', closing.id)
    .select('*')
    .single()

  if (error) throw formatSupabaseError(error)
  return mapAgapeClosingRow(data as ClosingRow)
}

export function buildAgapeDescription(
  brotherName: string,
  month: number,
  year: number,
): string {
  const name = brotherName.trim() || 'Irmão'
  return `Ágape - ${name} (${String(month).padStart(2, '0')}/${year})`
}

async function resolveAgapeCategoryId(
  supabaseAny: ReturnType<typeof supabase> & object,
): Promise<string> {
  const { data, error: fetchError } = await supabaseAny
    .from('financial_categories')
    .select('id')
    .eq('name', AGAPE_CATEGORY)
    .eq('type', 'Receita')
    .maybeSingle()

  if (fetchError) throw fetchError
  if (data?.id) return data.id as string

  const { data: created, error: insertError } = await supabaseAny
    .from('financial_categories')
    .insert({
      name: AGAPE_CATEGORY,
      type: 'Receita',
      description: 'Pagamentos de consumo no ágape pelos irmãos',
      color: '#2563eb',
    })
    .select('id')
    .single()

  if (insertError) throw insertError
  return created.id as string
}

async function findExistingCharge(
  supabaseAny: ReturnType<typeof supabase> & object,
  brotherId: string,
  month: number,
  year: number,
): Promise<{ id: string; transaction_id: string | null; status: string } | null> {
  const { data, error } = await supabaseAny
    .from('agape_brother_charges')
    .select('id, transaction_id, status')
    .eq('brother_id', brotherId)
    .eq('month', month)
    .eq('year', year)
    .maybeSingle()

  if (error) throw formatSupabaseError(error)
  return data ?? null
}

async function syncFinancialTransaction(
  supabaseAny: ReturnType<typeof supabase> & object,
  params: {
    chargeId: string
    brotherName: string
    month: number
    year: number
    amount: number
    status: AgapeChargeFormData['status']
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
      .from('agape_brother_charges')
      .update({ transaction_id: null })
      .eq('id', params.chargeId)
    return null
  }

  if (!params.accountId) {
    throw new Error('Selecione a conta bancária para registrar o pagamento.')
  }

  const paymentDate = params.paymentDate || todayLocalISODate()
  const categoryId = await resolveAgapeCategoryId(supabaseAny)
  const description = buildAgapeDescription(
    params.brotherName,
    params.month,
    params.year,
  )

  const payload = {
    date: paymentDate,
    description,
    category: AGAPE_CATEGORY,
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
    .from('agape_brother_charges')
    .update({ transaction_id: created.id })
    .eq('id', params.chargeId)

  return created.id as string
}

async function refreshClosingTotals(
  supabaseAny: ReturnType<typeof supabase> & object,
  month: number,
  year: number,
  closingId: string,
): Promise<void> {
  const { data: charges, error } = await supabaseAny
    .from('agape_brother_charges')
    .select('consumed_amount, amount, status')
    .eq('month', month)
    .eq('year', year)

  if (error) throw error

  const rows = charges || []
  const totalConsumed = rows.reduce(
    (sum: number, r: { amount: number }) => sum + Number(r.amount),
    0,
  )
  const totalPaid = rows
    .filter((r: { status: string }) => r.status === 'Pago')
    .reduce(
      (sum: number, r: { amount: number }) => sum + Number(r.amount),
      0,
    )

  const { error: updateError } = await supabaseAny
    .from('agape_monthly_closings')
    .update({ total_consumed: totalConsumed, total_paid: totalPaid })
    .eq('id', closingId)

  if (updateError) throw updateError
}

export async function fetchAgapeMonthlyClosing(
  month: number,
  year: number,
): Promise<AgapeMonthlyClosing | null> {
  const supabaseAny = supabase as any
  const { data, error } = await supabaseAny
    .from('agape_monthly_closings')
    .select('*')
    .eq('month', month)
    .eq('year', year)
    .maybeSingle()

  if (error) throw formatSupabaseError(error)
  return data ? mapAgapeClosingRow(data as ClosingRow) : null
}

export async function fetchAgapeChargesForMonth(
  month: number,
  year: number,
): Promise<{
  charges: AgapeBrotherCharge[]
  brotherNames: Record<string, string>
}> {
  const supabaseAny = supabase as any
  const { data, error } = await supabaseAny
    .from('agape_brother_charges')
    .select(`
      *,
      profiles!agape_brother_charges_brother_id_fkey ( id, full_name )
    `)
    .eq('month', month)
    .eq('year', year)
    .order('profiles(full_name)', { ascending: true })

  if (error) throw formatSupabaseError(error)

  const brotherNames: Record<string, string> = {}
  const charges = (data || []).map((row: ChargeRow) => {
    if (row.profiles?.full_name) {
      brotherNames[row.brother_id] = row.profiles.full_name
    }
    return mapAgapeChargeRow(row)
  })

  return { charges, brotherNames }
}

export async function fetchLiveConsumptionTotals(
  month: number,
  year: number,
): Promise<ConsumptionTotalRow[]> {
  const supabaseAny = supabase as any
  const { data, error } = await supabaseAny.rpc(
    'get_agape_monthly_consumption_totals',
    { p_month: month, p_year: year },
  )

  if (error) throw formatSupabaseError(error)
  return (data || []) as ConsumptionTotalRow[]
}

/** Gera/atualiza cobranças a partir dos consumos das sessões fechadas do mês. */
export async function generateAgapeChargesForMonth(
  month: number,
  year: number,
): Promise<GenerateAgapeChargesResult> {
  const supabaseAny = supabase as any
  const consumptionTotals = await fetchLiveConsumptionTotals(month, year)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const closing = await ensureOpenClosing(supabaseAny, month, year)

  let created = 0
  let updated = 0

  for (const row of consumptionTotals) {
    const consumedAmount = Number(row.total_amount)
    if (consumedAmount <= 0) continue

    const existing = await findExistingCharge(
      supabaseAny,
      row.brother_id,
      month,
      year,
    )

    if (existing) {
      const updatePayload: Record<string, unknown> = {
        consumed_amount: consumedAmount,
        closing_id: closing.id,
      }

      if (existing.status !== 'Pago') {
        updatePayload.amount = consumedAmount
      }

      const { error } = await supabaseAny
        .from('agape_brother_charges')
        .update(updatePayload)
        .eq('id', existing.id)

      if (error) throw formatSupabaseError(error)
      updated += 1
    } else {
      const { error } = await supabaseAny.from('agape_brother_charges').insert({
        brother_id: row.brother_id,
        month,
        year,
        consumed_amount: consumedAmount,
        amount: consumedAmount,
        status: 'Pendente',
        closing_id: closing.id,
        recorded_by: user?.id ?? null,
      })

      if (error) throw formatSupabaseError(error)
      created += 1
    }
  }

  await refreshClosingTotals(supabaseAny, month, year, closing.id)

  const totalConsumed = consumptionTotals.reduce(
    (sum, r) => sum + Number(r.total_amount),
    0,
  )

  return {
    created,
    updated,
    totalConsumed,
    brothersWithConsumption: consumptionTotals.length,
  }
}

export async function saveAgapeCharge(
  data: AgapeChargeFormData,
  options?: { chargeId?: string; existingTransactionId?: string | null },
): Promise<void> {
  const supabaseAny = supabase as any
  const month = monthNameToNumber(data.month)
  const brotherName = data.brotherName?.trim() || 'Irmão'

  const existingClosing = await fetchAgapeMonthlyClosing(month, data.year)
  if (existingClosing?.status === 'closed') {
    throw new Error('O fechamento deste mês está encerrado e não pode ser alterado.')
  }

  const closing =
    existingClosing ?? (await ensureOpenClosing(supabaseAny, month, data.year))

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const basePayload = {
    brother_id: data.brotherId,
    month,
    year: data.year,
    consumed_amount: data.consumedAmount,
    amount: data.amount,
    status: data.status,
    payment_date:
      data.status === 'Pago'
        ? data.paymentDate || todayLocalISODate()
        : null,
    account_id: data.status === 'Pago' ? data.accountId ?? null : null,
    notes: data.notes?.trim() || null,
    recorded_by: user?.id ?? null,
    closing_id: closing.id,
  }

  const persistAndSync = async (
    chargeId: string,
    existingTransactionId?: string | null,
  ) => {
    await syncFinancialTransaction(supabaseAny, {
      chargeId,
      brotherName,
      month,
      year: data.year,
      amount: data.amount,
      status: data.status,
      paymentDate: basePayload.payment_date ?? undefined,
      accountId: data.accountId,
      existingTransactionId,
    })

    await refreshClosingTotals(supabaseAny, month, data.year, closing.id)
  }

  if (options?.chargeId) {
    const { error } = await supabaseAny
      .from('agape_brother_charges')
      .update(basePayload)
      .eq('id', options.chargeId)
    if (error) throw formatSupabaseError(error)

    await persistAndSync(options.chargeId, options.existingTransactionId)
    return
  }

  const existing = await findExistingCharge(
    supabaseAny,
    data.brotherId,
    month,
    data.year,
  )

  if (existing) {
    const { error } = await supabaseAny
      .from('agape_brother_charges')
      .update(basePayload)
      .eq('id', existing.id)
    if (error) throw formatSupabaseError(error)

    await persistAndSync(existing.id, existing.transaction_id)
    return
  }

  const { data: created, error } = await supabaseAny
    .from('agape_brother_charges')
    .insert(basePayload)
    .select('id, transaction_id')
    .single()

  if (error) {
    if (isDuplicateKeyError(error)) {
      const raced = await findExistingCharge(
        supabaseAny,
        data.brotherId,
        month,
        data.year,
      )
      if (raced) {
        const { error: updateError } = await supabaseAny
          .from('agape_brother_charges')
          .update(basePayload)
          .eq('id', raced.id)
        if (updateError) throw formatSupabaseError(updateError)
        await persistAndSync(raced.id, raced.transaction_id)
        return
      }
    }
    throw formatSupabaseError(error)
  }

  try {
    await persistAndSync(created.id, created.transaction_id)
  } catch (syncError) {
    await supabaseAny.from('agape_brother_charges').delete().eq('id', created.id)
    throw formatSupabaseError(syncError)
  }
}

export async function deleteAgapeCharge(charge: AgapeBrotherCharge): Promise<void> {
  const supabaseAny = supabase as any

  const closing = await fetchAgapeMonthlyClosing(charge.month, charge.year)
  if (closing?.status === 'closed') {
    throw new Error('Não é possível excluir cobrança de um mês já encerrado.')
  }

  if (charge.transactionId) {
    const { error: txError } = await supabaseAny
      .from('financial_transactions')
      .delete()
      .eq('id', charge.transactionId)
    if (txError) throw txError
  }

  const { error } = await supabaseAny
    .from('agape_brother_charges')
    .delete()
    .eq('id', charge.id)

  if (error) throw error

  if (closing?.id) {
    await refreshClosingTotals(supabaseAny, charge.month, charge.year, closing.id)
  }
}

export async function closeAgapeMonth(
  month: number,
  year: number,
  notes?: string,
): Promise<AgapeMonthlyClosing> {
  const supabaseAny = supabase as any
  const closing = await fetchAgapeMonthlyClosing(month, year)

  if (!closing) {
    throw new Error('Informe o valor total das bebidas antes de encerrar.')
  }

  if (closing.status === 'closed') {
    throw new Error('Este mês já está encerrado.')
  }

  const totalBeverages = closing.totalBeveragesSpent ?? 0
  if (totalBeverages <= 0) {
    throw new Error('Informe o valor total gasto em bebidas antes de encerrar.')
  }

  const { charges } = await fetchAgapeChargesForMonth(month, year)
  if (charges.length === 0) {
    throw new Error('Gere ou registre as cobranças dos irmãos antes de encerrar.')
  }

  const pending = charges.filter((c) => c.status !== 'Pago')
  if (pending.length > 0) {
    throw new Error(
      `Ainda há ${pending.length} irmão(s) com pagamento pendente. Registre todos os pagamentos antes de encerrar.`,
    )
  }

  const brothersTotal = charges.reduce((s, c) => s + c.amount, 0)
  const totalPaid = charges.reduce((s, c) => s + c.amount, 0)

  if (Math.abs(brothersTotal - totalBeverages) > 0.009) {
    throw new Error(
      `A soma dos irmãos (R$ ${brothersTotal.toFixed(2)}) não confere com o total das bebidas (R$ ${totalBeverages.toFixed(2)}).`,
    )
  }

  if (Math.abs(totalPaid - totalBeverages) > 0.009) {
    throw new Error(
      `O total recebido (R$ ${totalPaid.toFixed(2)}) ainda não confere com o total das bebidas (R$ ${totalBeverages.toFixed(2)}).`,
    )
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data, error } = await supabaseAny
    .from('agape_monthly_closings')
    .update({
      status: 'closed',
      total_consumed: brothersTotal,
      total_paid: totalPaid,
      total_beverages_spent: totalBeverages,
      notes: notes?.trim() || closing.notes || null,
      closed_at: new Date().toISOString(),
      closed_by: user?.id ?? null,
    })
    .eq('id', closing.id)
    .select('*')
    .single()

  if (error) throw formatSupabaseError(error)
  return mapAgapeClosingRow(data as ClosingRow)
}

export async function reopenAgapeMonth(
  month: number,
  year: number,
): Promise<AgapeMonthlyClosing> {
  const supabaseAny = supabase as any
  const closing = await fetchAgapeMonthlyClosing(month, year)

  if (!closing) {
    throw new Error('Não há fechamento para este mês.')
  }

  if (closing.status !== 'closed') {
    throw new Error('Este mês ainda não está encerrado.')
  }

  const { data, error } = await supabaseAny
    .from('agape_monthly_closings')
    .update({
      status: 'open',
      closed_at: null,
      closed_by: null,
    })
    .eq('id', closing.id)
    .select('*')
    .single()

  if (error) throw formatSupabaseError(error)
  return mapAgapeClosingRow(data as ClosingRow)
}

export { fetchApprovedBrothers }
