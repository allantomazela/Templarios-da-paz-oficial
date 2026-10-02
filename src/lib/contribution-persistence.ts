import type { SupabaseClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'
import { toError } from '@/lib/async-utils'
import { todayLocalISODate } from '@/lib/format-utils'
import { buildControlOnlyNotes } from '@/lib/membership-control-only'
import type { ContributionFormData } from '@/lib/contribution-mappers'

interface ExistingContributionRef {
  id: string
  transaction_id: string | null
  status: string
}

export type ContributionPayload = ReturnType<typeof buildContributionPayload>

export function formatSupabaseError(error: unknown): Error {
  return toError(error, 'Erro ao salvar mensalidade.')
}

export function buildContributionPayload(
  data: ContributionFormData,
  month: number,
  context: {
    isControlOnly: boolean
    linkedTransactionId: string | null
    linkedAccountId: string | null
    userId: string | null
  },
) {
  const isPaid = data.status === 'Pago'
  const paidAccountId = context.isControlOnly
    ? null
    : context.linkedTransactionId
      ? context.linkedAccountId
      : data.accountId ?? null

  return {
    brother_id: data.brotherId,
    month,
    year: data.year,
    amount: data.amount,
    status: data.status,
    payment_date: isPaid ? data.paymentDate || todayLocalISODate() : null,
    account_id: isPaid ? paidAccountId : null,
    notes: context.isControlOnly
      ? buildControlOnlyNotes(data.notes)
      : data.notes?.trim() || null,
    recorded_by: context.userId,
  }
}

/**
 * Busca uma mensalidade já lançada para o período. Se houver duplicatas legadas,
 * escolhe a "melhor" para atualizar: prioriza a vinculada à tesouraria e, depois,
 * a que está paga — evitando criar novas linhas e sobrescrever a receita real.
 */
export async function findExistingContributionForPeriod(
  supabase: SupabaseClient<Database>,
  brotherId: string,
  month: number,
  year: number,
): Promise<ExistingContributionRef | null> {
  const { data, error } = await supabase
    .from('contributions')
    .select('id, transaction_id, status')
    .eq('brother_id', brotherId)
    .eq('month', month)
    .eq('year', year)

  if (error) throw formatSupabaseError(error)
  const rows = (data ?? []) as ExistingContributionRef[]
  if (rows.length === 0) return null

  return [...rows].sort((a, b) => {
    const aLinked = a.transaction_id ? 1 : 0
    const bLinked = b.transaction_id ? 1 : 0
    if (aLinked !== bLinked) return bLinked - aLinked
    const aPaid = a.status === 'Pago' ? 1 : 0
    const bPaid = b.status === 'Pago' ? 1 : 0
    return bPaid - aPaid
  })[0]
}

/** Atualiza a mensalidade e, se a tesouraria falhar, restaura os valores anteriores. */
export async function updateWithRollback(
  contributionId: string,
  payload: ContributionPayload,
  sync: () => Promise<void>,
): Promise<void> {
  const { data: previous, error: previousError } = await supabase
    .from('contributions')
    .select(
      'brother_id, month, year, amount, status, payment_date, account_id, notes, recorded_by',
    )
    .eq('id', contributionId)
    .single()

  if (previousError) throw formatSupabaseError(previousError)

  const { error } = await supabase
    .from('contributions')
    .update(payload)
    .eq('id', contributionId)
  if (error) throw formatSupabaseError(error)

  try {
    await sync()
  } catch (syncError) {
    const { error: rollbackError } = await supabase
      .from('contributions')
      .update(previous)
      .eq('id', contributionId)

    if (rollbackError) {
      throw formatSupabaseError(
        new Error(
          'Falha ao sincronizar a tesouraria e ao reverter a mensalidade. Recarregue a página e tente novamente.',
        ),
      )
    }

    throw formatSupabaseError(syncError)
  }
}

/** Insere a mensalidade e a remove se a sincronização com a tesouraria falhar. */
export async function insertWithRollback(
  payload: ContributionPayload,
  sync: (contributionId: string, existingTransactionId: string | null) => Promise<void>,
): Promise<void> {
  const { data: created, error } = await supabase
    .from('contributions')
    .insert(payload)
    .select('id, transaction_id')
    .single()

  if (error) throw formatSupabaseError(error)

  try {
    await sync(created.id, created.transaction_id)
  } catch (syncError) {
    await supabase.from('contributions').delete().eq('id', created.id)
    throw formatSupabaseError(syncError)
  }
}
