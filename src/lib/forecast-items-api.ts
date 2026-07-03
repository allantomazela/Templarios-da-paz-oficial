import { supabase } from '@/lib/supabase/client'
import type {
  ForecastItem,
  ForecastMonthOverride,
  MembershipForecastOverride,
} from '@/lib/forecast-types'

interface ForecastItemRow {
  id: string
  description: string
  type: 'Receita' | 'Despesa'
  category_id: string | null
  expected_amount: number | string
  due_day: number
  recurrence: 'monthly' | 'annual' | 'once'
  recurrence_month: number | null
  preferred_account_id: string | null
  is_active: boolean
  notes: string | null
  sort_order: number
  financial_categories?: { name: string } | null
  financial_accounts?: { name: string } | null
}

interface ForecastMonthOverrideRow {
  id: string
  forecast_item_id: string
  year: number
  month: number
  expected_amount_override: number | string
  notes: string | null
}

interface MembershipForecastOverrideRow {
  id: string
  year: number
  month: number
  expected_amount_override: number | string
  notes: string | null
}

export interface ForecastItemInput {
  description: string
  type: 'Receita' | 'Despesa'
  categoryId?: string | null
  expectedAmount: number
  dueDay: number
  recurrence: 'monthly' | 'annual' | 'once'
  recurrenceMonth?: number | null
  preferredAccountId?: string | null
  isActive?: boolean
  notes?: string
  sortOrder?: number
}

function mapForecastItem(row: ForecastItemRow): ForecastItem {
  return {
    id: row.id,
    description: row.description,
    type: row.type,
    categoryId: row.category_id,
    categoryName: row.financial_categories?.name,
    expectedAmount: Number(row.expected_amount),
    dueDay: row.due_day,
    recurrence: row.recurrence,
    recurrenceMonth: row.recurrence_month,
    preferredAccountId: row.preferred_account_id,
    preferredAccountName: row.financial_accounts?.name,
    isActive: row.is_active,
    notes: row.notes ?? undefined,
    sortOrder: row.sort_order,
  }
}

function mapMonthOverride(row: ForecastMonthOverrideRow): ForecastMonthOverride {
  return {
    id: row.id,
    forecastItemId: row.forecast_item_id,
    year: row.year,
    month: row.month,
    expectedAmountOverride: Number(row.expected_amount_override),
    notes: row.notes ?? undefined,
  }
}

function mapMembershipOverride(
  row: MembershipForecastOverrideRow,
): MembershipForecastOverride {
  return {
    id: row.id,
    year: row.year,
    month: row.month,
    expectedAmountOverride: Number(row.expected_amount_override),
    notes: row.notes ?? undefined,
  }
}

export async function fetchForecastItems(): Promise<ForecastItem[]> {
  const supabaseAny = supabase as any
  const { data, error } = await supabaseAny
    .from('financial_forecast_items')
    .select(
      `
      *,
      financial_categories(name),
      financial_accounts(name)
    `,
    )
    .order('sort_order', { ascending: true })
    .order('description', { ascending: true })

  if (error) throw error
  return (data ?? []).map((row: ForecastItemRow) => mapForecastItem(row))
}

export async function saveForecastItem(
  input: ForecastItemInput,
  existingId?: string | null,
): Promise<string> {
  const supabaseAny = supabase as any
  const payload = {
    description: input.description.trim(),
    type: input.type,
    category_id: input.categoryId ?? null,
    expected_amount: input.expectedAmount,
    due_day: input.dueDay,
    recurrence: input.recurrence,
    recurrence_month:
      input.recurrence === 'monthly' ? null : input.recurrenceMonth ?? null,
    preferred_account_id: input.preferredAccountId ?? null,
    is_active: input.isActive ?? true,
    notes: input.notes?.trim() || null,
    sort_order: input.sortOrder ?? 0,
  }

  if (existingId) {
    const { error } = await supabaseAny
      .from('financial_forecast_items')
      .update(payload)
      .eq('id', existingId)
    if (error) throw error
    return existingId
  }

  const { data, error } = await supabaseAny
    .from('financial_forecast_items')
    .insert(payload)
    .select('id')
    .single()

  if (error) throw error
  return data.id as string
}

export async function deleteForecastItem(id: string): Promise<void> {
  const supabaseAny = supabase as any
  const { error } = await supabaseAny
    .from('financial_forecast_items')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function fetchForecastMonthOverrides(
  year: number,
  month: number,
): Promise<ForecastMonthOverride[]> {
  const supabaseAny = supabase as any
  const { data, error } = await supabaseAny
    .from('financial_forecast_month_overrides')
    .select('*')
    .eq('year', year)
    .eq('month', month)

  if (error) throw error
  return (data ?? []).map((row: ForecastMonthOverrideRow) => mapMonthOverride(row))
}

export async function fetchForecastMonthOverridesForRange(
  periods: Array<{ year: number; month: number }>,
): Promise<ForecastMonthOverride[]> {
  if (periods.length === 0) return []

  const supabaseAny = supabase as any
  const { data, error } = await supabaseAny
    .from('financial_forecast_month_overrides')
    .select('*')

  if (error) throw error

  const keys = new Set(periods.map((period) => `${period.year}-${period.month}`))
  return (data ?? [])
    .filter((row: ForecastMonthOverrideRow) =>
      keys.has(`${row.year}-${row.month}`),
    )
    .map((row: ForecastMonthOverrideRow) => mapMonthOverride(row))
}

export async function upsertForecastMonthOverride(params: {
  forecastItemId: string
  year: number
  month: number
  expectedAmountOverride: number
  notes?: string
}): Promise<void> {
  const supabaseAny = supabase as any
  const { error } = await supabaseAny.from('financial_forecast_month_overrides').upsert(
    {
      forecast_item_id: params.forecastItemId,
      year: params.year,
      month: params.month,
      expected_amount_override: params.expectedAmountOverride,
      notes: params.notes?.trim() || null,
    },
    { onConflict: 'forecast_item_id,year,month' },
  )
  if (error) throw error
}

export async function deleteForecastMonthOverride(id: string): Promise<void> {
  const supabaseAny = supabase as any
  const { error } = await supabaseAny
    .from('financial_forecast_month_overrides')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function fetchMembershipForecastOverridesForRange(
  periods: Array<{ year: number; month: number }>,
): Promise<MembershipForecastOverride[]> {
  if (periods.length === 0) return []

  const supabaseAny = supabase as any
  const { data, error } = await supabaseAny
    .from('financial_membership_forecast_overrides')
    .select('*')

  if (error) throw error

  const keys = new Set(periods.map((period) => `${period.year}-${period.month}`))
  return (data ?? [])
    .filter((row: MembershipForecastOverrideRow) =>
      keys.has(`${row.year}-${row.month}`),
    )
    .map((row: MembershipForecastOverrideRow) => mapMembershipOverride(row))
}

export async function upsertMembershipForecastOverride(params: {
  year: number
  month: number
  expectedAmountOverride: number
  notes?: string
}): Promise<void> {
  const supabaseAny = supabase as any
  const { error } = await supabaseAny
    .from('financial_membership_forecast_overrides')
    .upsert(
      {
        year: params.year,
        month: params.month,
        expected_amount_override: params.expectedAmountOverride,
        notes: params.notes?.trim() || null,
      },
      { onConflict: 'year,month' },
    )
  if (error) throw error
}

export async function deleteMembershipForecastOverride(id: string): Promise<void> {
  const supabaseAny = supabase as any
  const { error } = await supabaseAny
    .from('financial_membership_forecast_overrides')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function fetchTransactionsForForecast(): Promise<
  Array<{
    id: string
    date: string
    type: 'Receita' | 'Despesa'
    amount: number
    category: string
    accountId?: string
    forecastItemId?: string
    description: string
  }>
> {
  const supabaseAny = supabase as any
  const { data, error } = await supabaseAny
    .from('financial_transactions')
    .select('id, date, type, amount, category, account_id, forecast_item_id, description')
    .order('date', { ascending: false })

  if (error) throw error

  return (data ?? []).map(
    (row: {
      id: string
      date: string
      type: 'Receita' | 'Despesa'
      amount: number | string
      category: string
      account_id: string | null
      forecast_item_id: string | null
      description: string
    }) => ({
      id: row.id,
      date: row.date,
      type: row.type,
      amount: Number(row.amount),
      category: row.category,
      accountId: row.account_id ?? undefined,
      forecastItemId: row.forecast_item_id ?? undefined,
      description: row.description,
    }),
  )
}
