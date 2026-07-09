import { supabase } from '@/lib/supabase/client'
import { toErrorMessage } from '@/lib/async-utils'

export interface AccountReconciliationExtrato {
  accountId: string
  extratoBalance: number | null
  note: string | null
  updatedAt: string
  updatedBy: string | null
}

export function mapAccountReconciliationExtratoRow(
  row: Record<string, unknown>,
): AccountReconciliationExtrato {
  const rawBalance = row.extrato_balance
  let extratoBalance: number | null = null
  if (rawBalance !== null && rawBalance !== undefined && rawBalance !== '') {
    const parsed = Number(rawBalance)
    extratoBalance = Number.isFinite(parsed) ? parsed : null
  }

  return {
    accountId: String(row.account_id),
    extratoBalance,
    note: row.note ? String(row.note) : null,
    updatedAt: String(row.updated_at),
    updatedBy: row.updated_by ? String(row.updated_by) : null,
  }
}

export function buildExtratoStateMap(
  rows: AccountReconciliationExtrato[],
): Record<string, { balance: string; note: string }> {
  return Object.fromEntries(
    rows.map((row) => [
      row.accountId,
      {
        balance:
          row.extratoBalance === null ? '' : String(row.extratoBalance),
        note: row.note ?? '',
      },
    ]),
  )
}

export async function fetchAccountReconciliationExtrato(): Promise<
  AccountReconciliationExtrato[]
> {
  const supabaseAny = supabase as any
  const { data, error } = await supabaseAny
    .from('financial_account_reconciliation_extrato')
    .select('account_id, extrato_balance, note, updated_at, updated_by')

  if (error) {
    throw new Error(
      toErrorMessage(error, 'Falha ao carregar saldos de extrato.'),
    )
  }

  return (data ?? []).map((row: Record<string, unknown>) =>
    mapAccountReconciliationExtratoRow(row),
  )
}

export async function upsertAccountReconciliationExtrato(input: {
  accountId: string
  extratoBalance?: number | null
  note?: string | null
}): Promise<AccountReconciliationExtrato> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const payload: Record<string, unknown> = {
    account_id: input.accountId,
    updated_by: user?.id ?? null,
    updated_at: new Date().toISOString(),
  }

  if (input.extratoBalance !== undefined) {
    payload.extrato_balance = input.extratoBalance
  }

  if (input.note !== undefined) {
    const trimmed = input.note?.trim() ?? ''
    payload.note = trimmed.length > 0 ? trimmed : null
  }

  const supabaseAny = supabase as any
  const { data, error } = await supabaseAny
    .from('financial_account_reconciliation_extrato')
    .upsert(payload, { onConflict: 'account_id' })
    .select('account_id, extrato_balance, note, updated_at, updated_by')
    .single()

  if (error) {
    throw new Error(
      toErrorMessage(error, 'Falha ao salvar conferência de extrato.'),
    )
  }

  return mapAccountReconciliationExtratoRow(data as Record<string, unknown>)
}
