import { supabase } from '@/lib/supabase/client'
import type { Contribution } from '@/lib/data'
import { monthNameToNumber } from '@/lib/contribution-months'
import type { ContributionFormData } from '@/lib/contribution-mappers'
import { formatContributionNotesForFinancialTransaction } from '@/lib/contribution-notes'
import {
  assertTransactionLinkable,
  syncFinancialTransaction,
} from '@/lib/contribution-treasury-sync'
import {
  buildContributionPayload,
  findExistingContributionForPeriod,
  formatSupabaseError,
  insertWithRollback,
  updateWithRollback,
} from '@/lib/contribution-persistence'

interface SaveContributionOptions {
  contributionId?: string
  existingTransactionId?: string | null
  /** Vincula a uma receita já criada (ex.: pagamento único de vários meses). */
  sharedTransactionId?: string | null
}

async function resolveLinkedAccountId(
  linkedTransactionId: string,
  contributionId?: string,
): Promise<string | null> {
  await assertTransactionLinkable(supabase, linkedTransactionId, contributionId)
  const { data: linkedTx, error: linkedError } = await supabase
    .from('financial_transactions')
    .select('account_id')
    .eq('id', linkedTransactionId)
    .single()
  if (linkedError) throw formatSupabaseError(linkedError)
  return linkedTx?.account_id ?? null
}

async function linkToSharedTransaction(params: {
  contributionId: string
  existingTransactionId?: string | null
  sharedTransactionId: string
  notes: string | null
  accountId: string | null
}): Promise<void> {
  if (
    params.existingTransactionId &&
    params.existingTransactionId !== params.sharedTransactionId
  ) {
    const { error: deleteError } = await supabase
      .from('financial_transactions')
      .delete()
      .eq('id', params.existingTransactionId)
    if (deleteError) throw deleteError
  }

  const attachmentNotes = formatContributionNotesForFinancialTransaction(params.notes)
  if (attachmentNotes) {
    const { error: notesError } = await supabase
      .from('financial_transactions')
      .update({ attachment_notes: attachmentNotes })
      .eq('id', params.sharedTransactionId)
    if (notesError) throw notesError
  }

  const { error: linkError } = await supabase
    .from('contributions')
    .update({
      transaction_id: params.sharedTransactionId,
      account_id: params.accountId,
    })
    .eq('id', params.contributionId)
  if (linkError) throw linkError
}

export async function saveContribution(
  data: ContributionFormData,
  options?: SaveContributionOptions,
): Promise<void> {
  const month = monthNameToNumber(data.month)
  const brotherName = data.brotherName?.trim() || 'Irmão'
  const treasuryMode = data.treasuryMode ?? 'standard'
  const isControlOnly =
    treasuryMode === 'control_only' && data.status === 'Pago'
  const linkedTransactionId =
    treasuryMode === 'link_existing' &&
    data.status === 'Pago' &&
    data.linkedTransactionId
      ? data.linkedTransactionId
      : null

  const linkedAccountId = linkedTransactionId
    ? await resolveLinkedAccountId(linkedTransactionId, options?.contributionId)
    : null

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const basePayload = buildContributionPayload(data, month, {
    isControlOnly,
    linkedTransactionId,
    linkedAccountId,
    userId: user?.id ?? null,
  })

  const persistAndSync = async (
    contributionId: string,
    existingTransactionId?: string | null,
  ) => {
    const sharedTransactionId =
      options?.sharedTransactionId ?? linkedTransactionId

    if (sharedTransactionId && data.status === 'Pago') {
      await linkToSharedTransaction({
        contributionId,
        existingTransactionId,
        sharedTransactionId,
        notes: basePayload.notes,
        accountId: linkedAccountId ?? data.accountId ?? null,
      })
      return
    }

    if (isControlOnly) {
      await syncFinancialTransaction(supabase, {
        contributionId,
        brotherName,
        month,
        year: data.year,
        amount: data.amount,
        status: data.status,
        controlOnly: true,
      })
      return
    }

    await syncFinancialTransaction(supabase, {
      contributionId,
      brotherName,
      month,
      year: data.year,
      amount: data.amount,
      status: data.status,
      paymentDate: basePayload.payment_date ?? undefined,
      accountId: data.accountId,
      existingTransactionId,
      notes: basePayload.notes,
    })
  }

  // Lançamento idempotente: se já existe mensalidade para (irmão, mês, ano),
  // atualiza a existente em vez de inserir outra — evita duplicidade mesmo
  // quando o lançamento vem do botão "Lançar para este irmão".
  let effectiveContributionId = options?.contributionId
  let effectiveExistingTransactionId = options?.existingTransactionId
  if (!effectiveContributionId) {
    const existing = await findExistingContributionForPeriod(
      supabase,
      data.brotherId,
      month,
      data.year,
    )
    if (existing) {
      effectiveContributionId = existing.id
      effectiveExistingTransactionId = existing.transaction_id ?? null
    }
  }

  if (effectiveContributionId) {
    const contributionId = effectiveContributionId
    await updateWithRollback(contributionId, basePayload, () =>
      persistAndSync(contributionId, effectiveExistingTransactionId),
    )
    return
  }

  await insertWithRollback(basePayload, persistAndSync)
}

export async function deleteContribution(contribution: Contribution): Promise<void> {
  if (contribution.transactionId) {
    const { error: txError } = await supabase
      .from('financial_transactions')
      .delete()
      .eq('id', contribution.transactionId)
    if (txError) throw txError
  }

  const { error } = await supabase
    .from('contributions')
    .delete()
    .eq('id', contribution.id)

  if (error) throw error
}
