import { supabase } from '@/lib/supabase/client'
import { toErrorMessage } from '@/lib/async-utils'

export interface TransactionDeleteDependency {
  source: 'mensalidade' | 'cerimonia' | 'agape'
  label: string
  recordId: string
}

export interface TransactionDeleteResult {
  dependencies: TransactionDeleteDependency[]
  unlinkedContributions: number
  unlinkedAgapeCharges: number
  unlinkedCeremonyInstallments: number
}

/** Referência de mês/ano anterior ao corrente → Atrasado; senão Pendente. */
export function unpaidStatusForReferenceMonth(
  month: number,
  year: number,
): 'Pendente' | 'Atrasado' {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  if (year > currentYear) return 'Pendente'
  if (year === currentYear && month >= currentMonth) return 'Pendente'
  return 'Atrasado'
}

export async function fetchTransactionDeleteDependencies(
  transactionId: string,
): Promise<TransactionDeleteDependency[]> {
  const supabaseAny = supabase as any
  const dependencies: TransactionDeleteDependency[] = []

  const [contributionsRes, ceremonyRes, agapeRes] = await Promise.all([
    supabaseAny
      .from('contributions')
      .select('id, month, year, status, profiles!contributions_brother_id_fkey(full_name)')
      .eq('transaction_id', transactionId),
    supabaseAny
      .from('brother_ceremony_payment_installments')
      .select('id, installment_number, status')
      .eq('transaction_id', transactionId),
    supabaseAny
      .from('agape_brother_charges')
      .select('id, month, year')
      .eq('transaction_id', transactionId),
  ])

  for (const row of contributionsRes.data ?? []) {
    const brotherName = row.profiles?.full_name?.trim() || 'Irmão'
    dependencies.push({
      source: 'mensalidade',
      recordId: row.id,
      label: `Mensalidade ${row.month}/${row.year} — ${brotherName} (${row.status})`,
    })
  }

  for (const row of ceremonyRes.data ?? []) {
    dependencies.push({
      source: 'cerimonia',
      recordId: row.id,
      label: `Parcela de cerimônia #${row.installment_number} (${row.status})`,
    })
  }

  for (const row of agapeRes.data ?? []) {
    dependencies.push({
      source: 'agape',
      recordId: row.id,
      label: `Cobrança ágape ${row.month}/${row.year}`,
    })
  }

  return dependencies
}

/**
 * Desfaz vínculos antes do DELETE para evitar que mensalidades pagas órfãs
 * sejam recriadas por repairOrphanTreasuryContributions.
 */
export async function unlinkFinancialTransactionDependencies(
  transactionId: string,
): Promise<TransactionDeleteResult> {
  const supabaseAny = supabase as any
  const dependencies = await fetchTransactionDeleteDependencies(transactionId)

  let unlinkedContributions = 0
  let unlinkedAgapeCharges = 0
  let unlinkedCeremonyInstallments = 0

  const contributionIds = dependencies
    .filter((item) => item.source === 'mensalidade')
    .map((item) => item.recordId)

  if (contributionIds.length > 0) {
    const { data: contributions, error: fetchError } = await supabaseAny
      .from('contributions')
      .select('id, month, year')
      .in('id', contributionIds)

    if (fetchError) {
      throw new Error(toErrorMessage(fetchError, 'Falha ao preparar exclusão da mensalidade.'))
    }

    for (const contribution of contributions ?? []) {
      const { error } = await supabaseAny
        .from('contributions')
        .update({
          transaction_id: null,
          account_id: null,
          payment_date: null,
          status: unpaidStatusForReferenceMonth(contribution.month, contribution.year),
        })
        .eq('id', contribution.id)

      if (error) {
        throw new Error(toErrorMessage(error, 'Falha ao desvincular mensalidade.'))
      }
      unlinkedContributions++
    }
  }

  const agapeIds = dependencies
    .filter((item) => item.source === 'agape')
    .map((item) => item.recordId)

  if (agapeIds.length > 0) {
    const { data: charges, error: fetchError } = await supabaseAny
      .from('agape_brother_charges')
      .select('id, month, year')
      .in('id', agapeIds)

    if (fetchError) {
      throw new Error(toErrorMessage(fetchError, 'Falha ao preparar exclusão do ágape.'))
    }

    for (const charge of charges ?? []) {
      const { error } = await supabaseAny
        .from('agape_brother_charges')
        .update({
          transaction_id: null,
          account_id: null,
          payment_date: null,
          status: unpaidStatusForReferenceMonth(charge.month, charge.year),
        })
        .eq('id', charge.id)

      if (error) {
        throw new Error(toErrorMessage(error, 'Falha ao desvincular cobrança de ágape.'))
      }
      unlinkedAgapeCharges++
    }
  }

  const ceremonyIds = dependencies
    .filter((item) => item.source === 'cerimonia')
    .map((item) => item.recordId)

  if (ceremonyIds.length > 0) {
    const { error } = await supabaseAny
      .from('brother_ceremony_payment_installments')
      .update({
        transaction_id: null,
        account_id: null,
        payment_date: null,
        status: 'Pendente',
      })
      .in('id', ceremonyIds)

    if (error) {
      throw new Error(toErrorMessage(error, 'Falha ao desvincular parcela de cerimônia.'))
    }
    unlinkedCeremonyInstallments = ceremonyIds.length
  }

  return {
    dependencies,
    unlinkedContributions,
    unlinkedAgapeCharges,
    unlinkedCeremonyInstallments,
  }
}

export async function deleteFinancialTransactionWithDependencies(
  transactionId: string,
): Promise<TransactionDeleteResult> {
  const result = await unlinkFinancialTransactionDependencies(transactionId)

  const supabaseAny = supabase as any
  const { error } = await supabaseAny
    .from('financial_transactions')
    .delete()
    .eq('id', transactionId)

  if (error) {
    throw new Error(toErrorMessage(error, 'Falha ao excluir lançamento.'))
  }

  return result
}

export async function deleteFinancialTransactionsWithDependencies(
  transactionIds: string[],
): Promise<TransactionDeleteResult> {
  const aggregate: TransactionDeleteResult = {
    dependencies: [],
    unlinkedContributions: 0,
    unlinkedAgapeCharges: 0,
    unlinkedCeremonyInstallments: 0,
  }

  for (const transactionId of transactionIds) {
    const result = await deleteFinancialTransactionWithDependencies(transactionId)
    aggregate.dependencies.push(...result.dependencies)
    aggregate.unlinkedContributions += result.unlinkedContributions
    aggregate.unlinkedAgapeCharges += result.unlinkedAgapeCharges
    aggregate.unlinkedCeremonyInstallments += result.unlinkedCeremonyInstallments
  }

  return aggregate
}

export function buildTransactionDeleteSuccessMessage(
  result: TransactionDeleteResult,
): string {
  const parts: string[] = ['Lançamento excluído e saldo atualizado.']

  if (result.unlinkedContributions > 0) {
    parts.push(
      `${result.unlinkedContributions} mensalidade(s) voltaram para pendência.`,
    )
  }
  if (result.unlinkedAgapeCharges > 0) {
    parts.push(`${result.unlinkedAgapeCharges} cobrança(s) de ágape desvinculada(s).`)
  }
  if (result.unlinkedCeremonyInstallments > 0) {
    parts.push(
      `${result.unlinkedCeremonyInstallments} parcela(s) de cerimônia desvinculada(s).`,
    )
  }

  return parts.join(' ')
}
