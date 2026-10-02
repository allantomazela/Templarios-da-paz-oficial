import { supabase } from '@/lib/supabase/client'
import { toError } from '@/lib/async-utils'
import type { Transaction } from '@/lib/data'
import { stripControlOnlyNote } from '@/lib/membership-control-only'

/** Evita reexecutar reparo pesado de observações em cada abertura de tela financeira. */
let contributionNotesRepairDoneThisSession = false

/** Observações da mensalidade prontas para `attachment_notes` da receita no caixa. */
export function formatContributionNotesForFinancialTransaction(
  notes?: string | null,
): string | null {
  const cleaned = stripControlOnlyNote(notes)
  return cleaned || null
}

export function enrichTransactionsWithContributionNotes(
  transactions: Transaction[],
  notesByTransactionId: Record<string, string>,
): Transaction[] {
  return transactions.map((transaction) => {
    const fromContribution = notesByTransactionId[transaction.id]?.trim()
    if (!fromContribution || transaction.attachmentNotes?.trim()) {
      return transaction
    }
    return { ...transaction, attachmentNotes: fromContribution }
  })
}

export async function fetchContributionNotesByTransactionIds(
  transactionIds: string[],
): Promise<Record<string, string>> {
  if (transactionIds.length === 0) return {}

  const { data, error } = await supabase
    .from('contributions')
    .select('transaction_id, notes')
    .in('transaction_id', transactionIds)
    .not('transaction_id', 'is', null)

  if (error) {
    throw toError(error, 'Falha ao carregar observações das mensalidades.')
  }

  const result: Record<string, string> = {}

  for (const row of data ?? []) {
    const transactionId = row.transaction_id as string | null
    if (!transactionId) continue

    const formatted = formatContributionNotesForFinancialTransaction(row.notes)
    if (!formatted) continue

    if (result[transactionId] && result[transactionId] !== formatted) {
      if (!result[transactionId].includes(formatted)) {
        result[transactionId] = `${result[transactionId]}\n${formatted}`
      }
      continue
    }

    result[transactionId] = formatted
  }

  return result
}

/** Copia observações das mensalidades para receitas que ainda não têm `attachment_notes`. */
export async function repairContributionNotesOnTransactions(
  force = false,
): Promise<number> {
  if (contributionNotesRepairDoneThisSession && !force) {
    return 0
  }

  const { data, error } = await supabase
    .from('contributions')
    .select('transaction_id, notes')
    .not('transaction_id', 'is', null)
    .not('notes', 'is', null)

  if (error) {
    throw toError(error, 'Falha ao reparar observações das mensalidades.')
  }

  const notesByTransactionId: Record<string, string> = {}

  for (const row of data ?? []) {
    const transactionId = row.transaction_id as string | null
    if (!transactionId) continue

    const formatted = formatContributionNotesForFinancialTransaction(row.notes)
    if (!formatted) continue

    if (!notesByTransactionId[transactionId]) {
      notesByTransactionId[transactionId] = formatted
    } else if (!notesByTransactionId[transactionId].includes(formatted)) {
      notesByTransactionId[transactionId] = `${notesByTransactionId[transactionId]}\n${formatted}`
    }
  }

  let repaired = 0

  for (const [transactionId, notes] of Object.entries(notesByTransactionId)) {
    const { data: transaction, error: fetchError } = await supabase
      .from('financial_transactions')
      .select('attachment_notes')
      .eq('id', transactionId)
      .maybeSingle()

    if (fetchError) throw toError(fetchError, 'Falha ao verificar receita da mensalidade.')
    if (transaction?.attachment_notes?.trim()) continue

    const { error: updateError } = await supabase
      .from('financial_transactions')
      .update({ attachment_notes: notes })
      .eq('id', transactionId)

    if (updateError) throw toError(updateError, 'Falha ao gravar observação na receita.')
    repaired++
  }

  contributionNotesRepairDoneThisSession = true
  return repaired
}
