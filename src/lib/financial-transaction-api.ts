import type { MutableRefObject } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Transaction } from '@/lib/data'
import { mapTransactionFromDB } from '@/lib/financial-mappers'
import {
  fetchTransactionsWithAccountNames,
  type FinancialTransactionRow,
} from '@/lib/financial-queries'
import { fetchAttachmentCountsByTransaction } from '@/lib/financial-attachments'

export type FinancialTransactionType = 'Receita' | 'Despesa'

export interface FinancialTransactionSaveInput {
  description: string
  amount: number
  date: string
  category: string
  accountId: string
  attachmentNotes?: string
  forecastItemId?: string | null
  controlOnly?: boolean
}

export interface LoadTransactionsOptions {
  includeAttachmentCounts?: boolean
}

export interface LoadTransactionsResult {
  transactions: Transaction[]
  accountNames: Record<string, string>
}

function mapRowToTransaction(row: FinancialTransactionRow): Transaction {
  return mapTransactionFromDB({
    ...row,
    amount: Number(row.amount),
    created_at: '',
    updated_at: '',
  })
}

export async function loadTransactionsByType(
  type: FinancialTransactionType,
  options: LoadTransactionsOptions = {},
): Promise<LoadTransactionsResult> {
  const { transactions: rows, accountNames } =
    await fetchTransactionsWithAccountNames(type)

  const transactions = rows.map((row) => {
    const transaction = mapRowToTransaction(row)
    if (!transaction.category) {
      transaction.category = 'Sem categoria'
    }
    return transaction
  })

  if (options.includeAttachmentCounts && transactions.length > 0) {
    const counts = await fetchAttachmentCountsByTransaction(
      transactions.map((item) => item.id),
    )
    for (const transaction of transactions) {
      transaction.attachmentCount = counts[transaction.id] ?? 0
    }
  }

  return { transactions, accountNames }
}

async function assertCategoryExists(
  categoryName: string,
  type: FinancialTransactionType,
): Promise<void> {
  const supabaseAny = supabase as any
  const { data, error } = await supabaseAny
    .from('financial_categories')
    .select('id')
    .eq('name', categoryName)
    .eq('type', type)
    .maybeSingle()

  if (error || !data) {
    throw new Error('Categoria não encontrada.')
  }
}

function buildTransactionPayload(
  data: FinancialTransactionSaveInput,
  type: FinancialTransactionType,
) {
  const controlOnly = type === 'Despesa' && Boolean(data.controlOnly)

  return {
    description: data.description,
    amount: data.amount,
    date: data.date,
    category: data.category,
    account_id: controlOnly ? null : data.accountId || null,
    attachment_notes: data.attachmentNotes?.trim() || null,
    forecast_item_id: data.forecastItemId ?? null,
    is_control_only: controlOnly,
  }
}

export async function saveFinancialTransaction(params: {
  type: FinancialTransactionType
  data: FinancialTransactionSaveInput
  existingId?: string | null
  idempotencyKeyRef?: MutableRefObject<string | null>
}): Promise<string | null> {
  const { type, data, existingId, idempotencyKeyRef } = params
  const supabaseAny = supabase as any

  await assertCategoryExists(data.category, type)
  if (type === 'Despesa' && data.controlOnly && data.accountId) {
    throw new Error(
      'Despesas somente controle não devem ter conta bancária vinculada.',
    )
  }
  if (!data.controlOnly && !data.accountId?.trim()) {
    throw new Error('Selecione a conta bancária.')
  }

  const payload = buildTransactionPayload(data, type)

  if (existingId) {
    const { error } = await supabaseAny
      .from('financial_transactions')
      .update(payload)
      .eq('id', existingId)

    if (error) throw error
    return existingId
  }

  const idempotencyKey =
    idempotencyKeyRef &&
    typeof crypto !== 'undefined' &&
    crypto.randomUUID
      ? idempotencyKeyRef.current ?? crypto.randomUUID()
      : undefined

  if (idempotencyKeyRef && idempotencyKey) {
    idempotencyKeyRef.current = idempotencyKey
  }

  try {
    const { data: inserted, error } = await supabaseAny
      .from('financial_transactions')
      .insert({
        ...payload,
        type,
        ...(idempotencyKey && { idempotency_key: idempotencyKey }),
      })
      .select('id')
      .single()

    if (error) {
      const pgErr = error as { code?: string }
      if (pgErr.code === '23505' && idempotencyKey) {
        return null
      }
      throw error
    }

    return inserted?.id ?? null
  } finally {
    if (idempotencyKeyRef) {
      idempotencyKeyRef.current = null
    }
  }
}

export async function deleteFinancialTransaction(id: string): Promise<void> {
  const supabaseAny = supabase as any
  const { error } = await supabaseAny
    .from('financial_transactions')
    .delete()
    .eq('id', id)

  if (error) throw error
}
