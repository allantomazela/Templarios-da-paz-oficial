import { supabase } from '@/lib/supabase/client'
import { isMembershipHistoricalPeriod } from '@/lib/membership-schedule'
import { resolveContributionAmountForSituation } from '@/lib/brother-membership-situation'
import { fetchMembershipFeeSettings } from '@/lib/contribution-fee-settings'
import { fetchBillableBrothers } from '@/lib/contribution-brothers'

export interface GenerateContributionsResult {
  created: number
  skipped: number
  totalBrothers: number
  skippedDesligado: number
  createdAfastado: number
}

/** Cria mensalidades pendentes respeitando afastado/desligado. */
export async function generatePendingContributionsForMonth(
  month: number,
  year: number,
  amount?: number,
): Promise<GenerateContributionsResult> {
  if (isMembershipHistoricalPeriod(year, month)) {
    throw new Error(
      'Use o cronograma para regularizar meses anteriores a jun/2026 (somente controle).',
    )
  }

  const settings = await fetchMembershipFeeSettings()
  const brothers = await fetchBillableBrothers()
  if (brothers.length === 0) {
    return {
      created: 0,
      skipped: 0,
      totalBrothers: 0,
      skippedDesligado: 0,
      createdAfastado: 0,
    }
  }

  const { data: existing, error: existingError } = await supabase
    .from('contributions')
    .select('brother_id')
    .eq('month', month)
    .eq('year', year)

  if (existingError) throw existingError

  const existingIds = new Set(
    (existing || []).map((r: { brother_id: string }) => r.brother_id),
  )

  let createdAfastado = 0
  const toInsert = brothers
    .filter((b) => !existingIds.has(b.id))
    .map((b) => {
      const feeAmount =
        amount ??
        resolveContributionAmountForSituation(b.situation, settings) ??
        settings.defaultAmount
      if (b.situation === 'afastado') createdAfastado += 1
      return {
        brother_id: b.id,
        month,
        year,
        amount: feeAmount,
        status: 'Pendente' as const,
        notes:
          b.situation === 'afastado'
            ? 'Cobrança de afastamento (somente mensalidade base).'
            : null,
      }
    })

  if (toInsert.length > 0) {
    const { error } = await supabase.from('contributions').insert(toInsert)
    if (error) throw error
  }

  return {
    created: toInsert.length,
    skipped: existingIds.size,
    totalBrothers: brothers.length,
    skippedDesligado: 0,
    createdAfastado,
  }
}
