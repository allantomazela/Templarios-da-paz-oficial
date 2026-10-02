import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import { todayLocalISODate } from '@/lib/format-utils'
import { isMembershipHistoricalPeriod } from '@/lib/membership-schedule'
import {
  buildMensalidadeDescription,
  MENSALIDADE_CATEGORY,
  type ContributionFormData,
} from '@/lib/contribution-mappers'
import { formatContributionNotesForFinancialTransaction } from '@/lib/contribution-notes'

export interface SyncFinancialTransactionParams {
  contributionId: string
  brotherName: string
  month: number
  year: number
  amount: number
  status: ContributionFormData['status']
  paymentDate?: string
  accountId?: string
  existingTransactionId?: string | null
  controlOnly?: boolean
  notes?: string | null
}

async function resolveMensalidadeCategoryId(
  supabase: SupabaseClient<Database>,
): Promise<string> {
  const { data, error: fetchError } = await supabase
    .from('financial_categories')
    .select('id')
    .eq('name', MENSALIDADE_CATEGORY)
    .eq('type', 'Receita')
    .maybeSingle()

  if (fetchError) throw fetchError
  if (data?.id) return data.id as string

  const { data: created, error: insertError } = await supabase
    .from('financial_categories')
    .insert({
      name: MENSALIDADE_CATEGORY,
      type: 'Receita',
      description: 'Contribuições mensais dos irmãos',
      color: '#16a34a',
    })
    .select('id')
    .single()

  if (insertError) throw insertError
  return created.id as string
}

async function removeTreasuryLink(
  supabase: SupabaseClient<Database>,
  params: SyncFinancialTransactionParams,
  options: { deleteExisting: boolean; clearAccount: boolean },
): Promise<null> {
  if (options.deleteExisting && params.existingTransactionId) {
    const { error } = await supabase
      .from('financial_transactions')
      .delete()
      .eq('id', params.existingTransactionId)
    if (error) throw error
  }
  await supabase
    .from('contributions')
    .update(
      options.clearAccount
        ? { transaction_id: null, account_id: null }
        : { transaction_id: null },
    )
    .eq('id', params.contributionId)
  return null
}

/**
 * Mantém a receita do caixa coerente com a mensalidade: cria/atualiza quando
 * paga com conta, remove quando volta a pendente e não gera receita para meses
 * de migração da planilha ou pagamentos "só controle".
 */
export async function syncFinancialTransaction(
  supabase: SupabaseClient<Database>,
  params: SyncFinancialTransactionParams,
): Promise<string | null> {
  const isPaid = params.status === 'Pago'
  const isHistorical = isMembershipHistoricalPeriod(params.year, params.month)
  const isBackfillOnly = isHistorical && isPaid && !params.accountId && !params.controlOnly

  if (isBackfillOnly) {
    return removeTreasuryLink(supabase, params, { deleteExisting: true, clearAccount: true })
  }
  if (isPaid && params.controlOnly) {
    return removeTreasuryLink(supabase, params, { deleteExisting: false, clearAccount: true })
  }
  if (!isPaid) {
    return removeTreasuryLink(supabase, params, { deleteExisting: true, clearAccount: false })
  }

  if (!params.accountId) {
    throw new Error('Selecione a conta bancária para registrar o pagamento.')
  }

  const paymentDate = params.paymentDate || todayLocalISODate()
  const categoryId = await resolveMensalidadeCategoryId(supabase)

  const payload = {
    date: paymentDate,
    description: buildMensalidadeDescription(
      params.brotherName,
      params.month,
      params.year,
      paymentDate,
    ),
    category: MENSALIDADE_CATEGORY,
    category_id: categoryId,
    type: 'Receita' as const,
    amount: params.amount,
    account_id: params.accountId,
    attachment_notes: formatContributionNotesForFinancialTransaction(params.notes),
  }

  if (params.existingTransactionId) {
    const { error } = await supabase
      .from('financial_transactions')
      .update(payload)
      .eq('id', params.existingTransactionId)
    if (error) throw error

    await supabase
      .from('contributions')
      .update({
        transaction_id: params.existingTransactionId,
        account_id: params.accountId,
      })
      .eq('id', params.contributionId)

    return params.existingTransactionId
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: created, error } = await supabase
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

  await supabase
    .from('contributions')
    .update({
      transaction_id: created.id,
      account_id: params.accountId,
    })
    .eq('id', params.contributionId)

  return created.id as string
}

export async function assertTransactionLinkable(
  supabase: SupabaseClient<Database>,
  transactionId: string,
  excludeContributionId?: string,
): Promise<void> {
  let query = supabase
    .from('contributions')
    .select('id')
    .eq('transaction_id', transactionId)

  if (excludeContributionId) {
    query = query.neq('id', excludeContributionId)
  }

  const { data, error } = await query.maybeSingle()
  if (error) throw error
  if (data) {
    throw new Error('Esta receita já está vinculada a outra mensalidade.')
  }
}
