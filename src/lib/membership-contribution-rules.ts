/** Mês a partir do qual o controle em produção passa a valer (jun/2026). */
export const MEMBERSHIP_TRACKING_START_YEAR = 2026
export const MEMBERSHIP_TRACKING_START_MONTH = 6

/** Período anterior ao início da tesouraria digital — só controle, sem receita. */
export function isMembershipHistoricalPeriod(
  year: number,
  month: number,
  trackingStartYear = MEMBERSHIP_TRACKING_START_YEAR,
  trackingStartMonth = MEMBERSHIP_TRACKING_START_MONTH,
): boolean {
  return (
    year < trackingStartYear ||
    (year === trackingStartYear && month < trackingStartMonth)
  )
}

export const MEMBERSHIP_HISTORICAL_NOTE =
  'Regularização histórica (pré-produção — não entra na tesouraria)'

/** Mensalidade quitada no cronograma sem nova receita — valor já está no caixa. */
export const MEMBERSHIP_CONTROL_ONLY_NOTE =
  'Só controle — receita já lançada na tesouraria (não duplicar)'

interface ContributionTreasuryFields {
  status: string
  transactionId?: string | null
  accountId?: string | null
  notes?: string | null
}

/** Lançamento de migração da planilha — sem conta bancária e sem receita. */
export function isMembershipBackfillContribution(
  year: number,
  month: number,
  contribution: ContributionTreasuryFields,
): boolean {
  if (contribution.status !== 'Pago') return false
  if (!isMembershipHistoricalPeriod(year, month)) return false
  if (contribution.transactionId || contribution.accountId) return false
  return (contribution.notes ?? '').includes(MEMBERSHIP_HISTORICAL_NOTE)
}

/** Pago no cronograma sem receita — controle ou receita já existente no caixa. */
export function isMembershipControlOnlyContribution(
  year: number,
  month: number,
  contribution: ContributionTreasuryFields,
): boolean {
  if (contribution.status !== 'Pago') return false
  if (contribution.transactionId) return false
  if (isMembershipBackfillContribution(year, month, contribution)) return true
  return (contribution.notes ?? '').includes(MEMBERSHIP_CONTROL_ONLY_NOTE)
}

/** Pagamento com receita lançada no caixa (vínculo com financial_transactions). */
export function contributionCountsInTreasury(contribution: {
  status: string
  transactionId?: string | null
  accountId?: string | null
}): boolean {
  return contribution.status === 'Pago' && Boolean(contribution.transactionId)
}

/** Pago com conta informada, mas sem receita no caixa — não entra no saldo bancário. */
export function isOrphanTreasuryContribution(
  year: number,
  month: number,
  contribution: ContributionTreasuryFields,
): boolean {
  if (contribution.status !== 'Pago') return false
  if (contribution.transactionId) return false
  if (!contribution.accountId) return false
  if (isMembershipHistoricalPeriod(year, month)) return false
  if (isMembershipBackfillContribution(year, month, contribution)) return false
  if (isMembershipControlOnlyContribution(year, month, contribution)) return false
  return true
}
