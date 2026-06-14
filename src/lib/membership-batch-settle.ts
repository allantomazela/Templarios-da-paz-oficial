import { supabase } from '@/lib/supabase/client'
import { todayLocalISODate } from '@/lib/format-utils'
import type { Contribution } from '@/lib/data'
import {
  monthNameToNumber,
  monthNumberToName,
  MENSALIDADE_CATEGORY,
  saveContribution,
  type ContributionFormData,
} from '@/lib/contribution-payments'
import type { BatchSettlePeriod } from '@/lib/membership-batch-settle-types'

export type { BatchSettlePeriod } from '@/lib/membership-batch-settle-types'
export { buildBatchMensalidadeDescription, periodKey } from '@/lib/membership-batch-settle-format'

function filterPeriodContributions(
  contributions: Contribution[],
  year: number,
  month: number,
): Contribution[] {
  return contributions.filter(
    (c) => c.year === year && monthNameToNumber(c.month) === month,
  )
}

async function resolveMensalidadeCategoryId(
  supabaseAny: ReturnType<typeof supabase> & object,
): Promise<string> {
  const { data, error: fetchError } = await supabaseAny
    .from('financial_categories')
    .select('id')
    .eq('name', MENSALIDADE_CATEGORY)
    .eq('type', 'Receita')
    .maybeSingle()

  if (fetchError) throw fetchError
  if (data?.id) return data.id as string

  const { data: created, error: insertError } = await supabaseAny
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

async function createSharedFinancialTransaction(params: {
  brotherName: string
  periods: BatchSettlePeriod[]
  totalAmount: number
  paymentDate: string
  accountId: string
}): Promise<string> {
  const supabaseAny = supabase as any
  const categoryId = await resolveMensalidadeCategoryId(supabaseAny)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: created, error } = await supabaseAny
    .from('financial_transactions')
    .insert({
      date: params.paymentDate,
      description: buildBatchMensalidadeDescription(
        params.brotherName,
        params.periods,
        params.paymentDate,
      ),
      category: MENSALIDADE_CATEGORY,
      category_id: categoryId,
      type: 'Receita',
      amount: params.totalAmount,
      account_id: params.accountId,
      created_by: user?.id ?? null,
      idempotency_key:
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : undefined,
    })
    .select('id')
    .single()

  if (error) throw error
  return created.id as string
}

/** Quita vários meses de produção com um único depósito na tesouraria. */
export async function saveBatchContributionPayment(params: {
  brotherId: string
  brotherName: string
  periods: BatchSettlePeriod[]
  paymentDate: string
  accountId: string
  notes?: string
  existingContributions: Contribution[]
}): Promise<{ saved: number; transactionId: string }> {
  if (params.periods.length === 0) {
    throw new Error('Selecione ao menos um mês para quitar.')
  }

  for (const period of params.periods) {
    if (period.amount <= 0) {
      throw new Error(`Valor inválido para ${period.periodLabel}.`)
    }
  }

  const paymentDate = params.paymentDate || todayLocalISODate()
  const totalAmount = params.periods.reduce((sum, p) => sum + p.amount, 0)
  const sharedNotes =
    params.notes?.trim() ||
    `Quitação de ${params.periods.length} mensalidade(s) em um único pagamento.`

  const transactionId = await createSharedFinancialTransaction({
    brotherName: params.brotherName,
    periods: params.periods,
    totalAmount,
    paymentDate,
    accountId: params.accountId,
  })

  let saved = 0

  for (const period of params.periods) {
    const monthName = monthNumberToName(period.month)
    const existing = filterPeriodContributions(
      params.existingContributions,
      period.year,
      period.month,
    )
    const unpaid = existing.find((c) => c.status !== 'Pago')
    const primary = existing[0]
    const form: ContributionFormData = {
      brotherId: params.brotherId,
      brotherName: params.brotherName,
      month: monthName,
      year: period.year,
      amount: period.amount,
      status: 'Pago',
      paymentDate,
      accountId: params.accountId,
      notes: sharedNotes,
    }

    if (unpaid) {
      await saveContribution(form, {
        contributionId: unpaid.id,
        existingTransactionId: unpaid.transactionId,
        sharedTransactionId: transactionId,
      })
    } else if (primary) {
      await saveContribution(form, {
        contributionId: primary.id,
        existingTransactionId: primary.transactionId,
        sharedTransactionId: transactionId,
      })
    } else {
      await saveContribution(form, {
        sharedTransactionId: transactionId,
      })
    }
    saved++
  }

  return { saved, transactionId }
}
