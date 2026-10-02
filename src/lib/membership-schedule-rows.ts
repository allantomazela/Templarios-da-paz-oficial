import type { Contribution } from '@/lib/data'
import { CONTRIBUTION_MONTHS } from '@/lib/contribution-months'
import {
  contributionCountsInTreasury,
  isMembershipBackfillContribution,
  isMembershipControlOnlyContribution,
  isMembershipHistoricalPeriod,
  isOrphanTreasuryContribution,
  type MembershipScheduleEntry,
} from '@/lib/membership-schedule'
import { periodKey } from '@/lib/membership-batch-settle-format'
import type { BatchSettlePeriod } from '@/lib/membership-batch-settle-types'

/** Situação escolhida para um mês na migração da planilha antiga. */
export type PeriodChoice = 'paid' | 'unpaid'

/** Etiqueta auxiliar exibida abaixo da referência de um mês já pago. */
export type MembershipScheduleRowBadge =
  | 'backfill_missing_treasury'
  | 'orphan_treasury'
  | 'control_only'
  | 'historical_control'

export interface MembershipScheduleRowState {
  key: string
  isHistorical: boolean
  primaryContribution: Contribution | undefined
  selectable: boolean
  badge: MembershipScheduleRowBadge | null
  canControlOnlySettle: boolean
}

function monthNameToNumber(month: string): number {
  return CONTRIBUTION_MONTHS.indexOf(month as (typeof CONTRIBUTION_MONTHS)[number]) + 1
}

export function contributionsForPeriod(
  contributions: Contribution[],
  year: number,
  month: number,
): Contribution[] {
  return contributions.filter(
    (c) => c.year === year && monthNameToNumber(c.month) === month,
  )
}

/**
 * Valor que ainda precisa entrar na tesouraria para o mês: o saldo em aberto
 * ou, para meses pagos só no controle (migração/receita órfã), o valor previsto.
 */
export function periodSettleAmount(
  entry: MembershipScheduleEntry,
  periodContributions: Contribution[],
): number {
  if (entry.remainingAmount > 0) return entry.remainingAmount
  const needsTreasury = periodContributions.some(
    (c) =>
      (isMembershipBackfillContribution(entry.year, entry.month, c) ||
        isOrphanTreasuryContribution(entry.year, entry.month, c)) &&
      !contributionCountsInTreasury(c),
  )
  if (needsTreasury && entry.status === 'paid') return entry.expectedAmount
  return 0
}

/** Chaves de todos os meses que podem entrar numa quitação em lote. */
export function selectableScheduleKeys(
  entries: MembershipScheduleEntry[],
  contributions: Contribution[],
): string[] {
  return entries
    .filter(
      (entry) =>
        periodSettleAmount(entry, contributionsForPeriod(contributions, entry.year, entry.month)) > 0,
    )
    .map((entry) => periodKey(entry.year, entry.month))
}

/** Meses selecionados que ainda têm valor a quitar, em ordem cronológica. */
export function buildSelectedSettlePeriods(
  entries: MembershipScheduleEntry[],
  selectedKeys: Set<string>,
  contributions: Contribution[],
): BatchSettlePeriod[] {
  return entries
    .filter((entry) => selectedKeys.has(periodKey(entry.year, entry.month)))
    .map((entry) => ({
      entry,
      amount: periodSettleAmount(
        entry,
        contributionsForPeriod(contributions, entry.year, entry.month),
      ),
    }))
    .filter(({ amount }) => amount > 0)
    .sort((a, b) => {
      if (a.entry.year !== b.entry.year) return a.entry.year - b.entry.year
      return a.entry.month - b.entry.month
    })
    .map(({ entry, amount }) => ({
      month: entry.month,
      year: entry.year,
      amount,
      periodLabel: entry.periodLabel,
    }))
}

function resolveRowBadge(
  entry: MembershipScheduleEntry,
  periodContributions: Contribution[],
  isHistorical: boolean,
): MembershipScheduleRowBadge | null {
  if (entry.status !== 'paid') return null
  const paidViaTreasury = periodContributions.some((c) => contributionCountsInTreasury(c))
  if (paidViaTreasury) return null

  const hasContribution = (
    predicate: (year: number, month: number, c: Contribution) => boolean,
  ) => periodContributions.some((c) => predicate(entry.year, entry.month, c))

  if (hasContribution(isMembershipBackfillContribution)) return 'backfill_missing_treasury'
  if (hasContribution(isOrphanTreasuryContribution)) return 'orphan_treasury'
  if (!isHistorical && hasContribution(isMembershipControlOnlyContribution)) {
    return 'control_only'
  }
  if (isHistorical) return 'historical_control'
  return null
}

/** Estado de exibição de uma linha do cronograma (seleção, etiqueta e ações). */
export function describeScheduleRow(
  entry: MembershipScheduleEntry,
  brotherContributions: Contribution[],
  historicalKeys: Set<string>,
): MembershipScheduleRowState {
  const key = periodKey(entry.year, entry.month)
  const isHistorical = historicalKeys.has(key)
  const periodContributions = contributionsForPeriod(
    brotherContributions,
    entry.year,
    entry.month,
  )

  return {
    key,
    isHistorical,
    primaryContribution: periodContributions[0],
    selectable: periodSettleAmount(entry, periodContributions) > 0,
    badge: resolveRowBadge(entry, periodContributions, isHistorical),
    canControlOnlySettle:
      entry.remainingAmount > 0 &&
      !isHistorical &&
      !isMembershipHistoricalPeriod(entry.year, entry.month),
  }
}
