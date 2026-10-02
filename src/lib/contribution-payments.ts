/**
 * Ponto de entrada das mensalidades (contribuições). A implementação está
 * dividida por responsabilidade nos módulos `contribution-*`; este arquivo
 * mantém a API pública estável para as telas e serviços que já o importam.
 */
export type { ContributionTreasuryMode } from '@/lib/membership-control-only'
export {
  DEFAULT_MEMBERSHIP_BASE_AMOUNT,
  DEFAULT_MEMBERSHIP_SESSION_PACKAGE_AMOUNT,
} from '@/lib/brother-membership-situation'

export {
  CONTRIBUTION_MONTHS,
  monthNameToNumber,
  monthNumberToName,
} from '@/lib/contribution-months'
export {
  MENSALIDADE_CATEGORY,
  buildMensalidadeDescription,
  mapContributionRow,
  type ContributionFormData,
} from '@/lib/contribution-mappers'
export {
  enrichTransactionsWithContributionNotes,
  fetchContributionNotesByTransactionIds,
  formatContributionNotesForFinancialTransaction,
  repairContributionNotesOnTransactions,
} from '@/lib/contribution-notes'
export {
  DEFAULT_MEMBERSHIP_AMOUNT,
  DEFAULT_MEMBERSHIP_DUE_DAY,
  fetchMembershipFeeSettings,
  type MembershipFeeSettings,
} from '@/lib/contribution-fee-settings'
export {
  fetchApprovedBrothers,
  fetchBillableBrothers,
  resolveProfileIdByEmail,
  sortBrothersAlphabetically,
  type ApprovedBrotherOption,
} from '@/lib/contribution-brothers'
export {
  generatePendingContributionsForMonth,
  type GenerateContributionsResult,
} from '@/lib/contribution-generation'
export {
  fetchBankAccounts,
  fetchContributionsForProfile,
  fetchContributionsWithProfiles,
  fetchLinkableMensalidadeTransactions,
  fetchLinkedMembershipTransactionIds,
  filterContributionsByBrother,
  type LinkableMensalidadeTransaction,
} from '@/lib/contribution-queries'
export {
  buildBrotherSummaries,
  type BrotherContributionSummary,
} from '@/lib/contribution-summaries'
export { repairOrphanTreasuryContributions } from '@/lib/contribution-orphan-repair'
export { deleteContribution, saveContribution } from '@/lib/contribution-save'
