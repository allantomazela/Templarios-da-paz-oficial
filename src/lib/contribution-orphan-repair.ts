import { supabase } from '@/lib/supabase/client'
import {
  isMembershipBackfillContribution,
  isMembershipControlOnlyContribution,
  isMembershipHistoricalPeriod,
} from '@/lib/membership-schedule'
import type { ContributionFormData } from '@/lib/contribution-mappers'
import { syncFinancialTransaction } from '@/lib/contribution-treasury-sync'

/** Cooldown para reparo de mensalidades órfãs (consulta leve, mas redundante em rajadas). */
let lastOrphanTreasuryRepairAt = 0
const ORPHAN_TREASURY_REPAIR_COOLDOWN_MS = 60_000

interface ContributionRepairRow {
  id: string
  brother_id: string
  month: number
  year: number
  amount: number
  status: ContributionFormData['status']
  payment_date: string | null
  account_id: string | null
  transaction_id: string | null
  notes: string | null
  profiles?: { full_name: string | null }
}

function isIntentionallyWithoutTreasury(row: ContributionRepairRow): boolean {
  if (isMembershipHistoricalPeriod(row.year, row.month)) return true
  const treasuryFields = {
    status: row.status,
    transactionId: row.transaction_id,
    accountId: row.account_id,
    notes: row.notes,
  }
  return (
    isMembershipBackfillContribution(row.year, row.month, treasuryFields) ||
    isMembershipControlOnlyContribution(row.year, row.month, treasuryFields)
  )
}

/** Corrige mensalidades pagas com conta, mas sem receita no caixa. */
export async function repairOrphanTreasuryContributions(force = false): Promise<number> {
  const now = Date.now()
  if (
    !force &&
    now - lastOrphanTreasuryRepairAt < ORPHAN_TREASURY_REPAIR_COOLDOWN_MS
  ) {
    return 0
  }

  const { data, error } = await supabase
    .from('contributions')
    .select(`
      id,
      brother_id,
      month,
      year,
      amount,
      status,
      payment_date,
      account_id,
      transaction_id,
      notes,
      profiles!contributions_brother_id_fkey ( full_name )
    `)
    .eq('status', 'Pago')
    .not('account_id', 'is', null)
    .is('transaction_id', null)

  if (error) throw error

  let repaired = 0

  for (const row of (data ?? []) as ContributionRepairRow[]) {
    if (isIntentionallyWithoutTreasury(row)) continue

    await syncFinancialTransaction(supabase, {
      contributionId: row.id,
      brotherName: row.profiles?.full_name?.trim() || 'Irmão',
      month: row.month,
      year: row.year,
      amount: Number(row.amount),
      status: row.status,
      paymentDate: row.payment_date ?? undefined,
      accountId: row.account_id ?? undefined,
      existingTransactionId: null,
      notes: row.notes,
    })
    repaired++
  }

  lastOrphanTreasuryRepairAt = Date.now()
  return repaired
}
