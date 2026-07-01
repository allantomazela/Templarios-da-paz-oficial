import type { Transaction } from '@/lib/data'
import type { SameMonthMensalidadeGroup } from '@/lib/account-reconciliation'
import { CONTRIBUTION_MONTHS } from '@/lib/contribution-payments'

export interface ContributionLinkRow {
  transactionId: string
  brotherId: string
  brotherName: string
  month: number
  year: number
  periodLabel: string
}

export interface MensalidadeLinkContext {
  byTransactionId: Map<string, ContributionLinkRow[]>
  batchTransactionIds: Set<string>
}

export type SameMonthGroupKind =
  | 'duplicate_same_reference'
  | 'late_same_brother'
  | 'different_brothers'
  | 'batch_settlement'
  | 'unknown'

export interface MensalidadeTransactionContext {
  transactionId: string
  brotherId: string | null
  brotherName: string | null
  referencePeriods: Array<{ month: number; year: number; label: string }>
  isBatch: boolean
  summaryLabel: string
}

export interface EnrichedSameMonthMensalidadeGroup extends SameMonthMensalidadeGroup {
  kind: SameMonthGroupKind
  contextLabel: string
  transactionContexts: MensalidadeTransactionContext[]
}

const PERIOD_IN_DESCRIPTION_PATTERN = /\((\d{1,2})\/(\d{4})\)/g
const BATCH_PERIODS_PATTERN = /\(([^)]+)\)/

function periodLabel(month: number, year: number): string {
  return `${String(month).padStart(2, '0')}/${year}`
}

function monthNameToNumber(name: string): number | null {
  const normalized = name.trim().toLowerCase()
  const index = CONTRIBUTION_MONTHS.findIndex(
    (monthName) => monthName.toLowerCase() === normalized,
  )
  return index >= 0 ? index + 1 : null
}

function parsePeriodToken(
  token: string,
): { month: number; year: number; label: string } | null {
  const trimmed = token.trim()
  const numericMatch = trimmed.match(/^(\d{1,2})\/(\d{4})$/)
  if (numericMatch) {
    const month = Number(numericMatch[1])
    const year = Number(numericMatch[2])
    if (month >= 1 && month <= 12 && year >= 2000) {
      return { month, year, label: periodLabel(month, year) }
    }
  }

  const namedMatch = trimmed.match(/^(.+?)\/(\d{4})$/)
  if (namedMatch) {
    const month = monthNameToNumber(namedMatch[1])
    const year = Number(namedMatch[2])
    if (month && year >= 2000) {
      return { month, year, label: periodLabel(month, year) }
    }
  }

  return null
}

/** Extrai referências da descrição (ex.: Mensalidade - Nome (07/2026) ou (Março/2026, Abril/2026)). */
export function parseReferencePeriodsFromDescription(
  description: string,
): Array<{ month: number; year: number; label: string }> {
  const periods: Array<{ month: number; year: number; label: string }> = []
  const batchMatch = description.match(BATCH_PERIODS_PATTERN)
  const segment = batchMatch?.[1] ?? ''

  if (segment.includes(',')) {
    for (const token of segment.split(',')) {
      const parsed = parsePeriodToken(token)
      if (parsed) periods.push(parsed)
    }
    if (periods.length > 0) return periods
  }

  for (const match of segment.matchAll(PERIOD_IN_DESCRIPTION_PATTERN)) {
    const month = Number(match[1])
    const year = Number(match[2])
    if (month >= 1 && month <= 12 && year >= 2000) {
      periods.push({ month, year, label: periodLabel(month, year) })
    }
  }

  if (periods.length > 0) return periods

  for (const match of description.matchAll(PERIOD_IN_DESCRIPTION_PATTERN)) {
    const month = Number(match[1])
    const year = Number(match[2])
    if (month >= 1 && month <= 12 && year >= 2000) {
      periods.push({ month, year, label: periodLabel(month, year) })
    }
  }

  const singleNamed = parsePeriodToken(segment)
  if (singleNamed) return [singleNamed]

  return periods
}

export function buildMensalidadeLinkContext(
  rows: Array<{
    transaction_id: string
    brother_id: string
    month: number
    year: number
    profiles?: { full_name: string | null } | null
  }>,
): MensalidadeLinkContext {
  const byTransactionId = new Map<string, ContributionLinkRow[]>()
  const batchTransactionIds = new Set<string>()

  for (const row of rows) {
    if (!row.transaction_id) continue

    const link: ContributionLinkRow = {
      transactionId: row.transaction_id,
      brotherId: row.brother_id,
      brotherName: row.profiles?.full_name?.trim() || 'Irmão',
      month: row.month,
      year: row.year,
      periodLabel: periodLabel(row.month, row.year),
    }

    const current = byTransactionId.get(row.transaction_id) ?? []
    current.push(link)
    byTransactionId.set(row.transaction_id, current)
  }

  for (const [transactionId, links] of byTransactionId.entries()) {
    if (links.length > 1) {
      batchTransactionIds.add(transactionId)
    }
  }

  return { byTransactionId, batchTransactionIds }
}

export function buildTransactionContext(
  transaction: Transaction,
  linkContext: MensalidadeLinkContext,
): MensalidadeTransactionContext {
  const links = linkContext.byTransactionId.get(transaction.id) ?? []
  const isBatch = linkContext.batchTransactionIds.has(transaction.id)

  if (links.length > 0) {
    const brotherId = links[0].brotherId
    const brotherName = links[0].brotherName
    const referencePeriods = links.map((link) => ({
      month: link.month,
      year: link.year,
      label: link.periodLabel,
    }))
    const periodText = referencePeriods.map((p) => p.label).join(', ')
    const summaryLabel = isBatch
      ? `${brotherName} — quitação em lote (${periodText})`
      : `${brotherName} (${periodText})`

    return {
      transactionId: transaction.id,
      brotherId,
      brotherName,
      referencePeriods,
      isBatch,
      summaryLabel,
    }
  }

  const referencePeriods = parseReferencePeriodsFromDescription(transaction.description)
  const nameMatch = transaction.description.match(/Mensalidade\s*-\s*(.+?)\s*\(/i)
  const brotherName = nameMatch?.[1]?.trim() || null
  const periodText =
    referencePeriods.length > 0
      ? referencePeriods.map((p) => p.label).join(', ')
      : 'referência não identificada'

  return {
    transactionId: transaction.id,
    brotherId: null,
    brotherName,
    referencePeriods,
    isBatch: referencePeriods.length > 1,
    summaryLabel: brotherName ? `${brotherName} (${periodText})` : transaction.description,
  }
}

function referenceKey(month: number, year: number): string {
  return `${year}-${month}`
}

export function classifySameMonthMensalidadeGroup(
  group: SameMonthMensalidadeGroup,
  linkContext: MensalidadeLinkContext,
): EnrichedSameMonthMensalidadeGroup {
  const transactionContexts = group.transactions.map((transaction) =>
    buildTransactionContext(transaction, linkContext),
  )

  const batchTransactions = transactionContexts.filter((ctx) => ctx.isBatch)
  if (
    group.transactions.length === 1 &&
    batchTransactions.length === 1 &&
    batchTransactions[0].referencePeriods.length > 1
  ) {
    return {
      ...group,
      kind: 'batch_settlement',
      contextLabel: batchTransactions[0].summaryLabel,
      transactionContexts,
    }
  }

  const brotherIds = new Set(
    transactionContexts
      .map((ctx) => ctx.brotherId)
      .filter((id): id is string => Boolean(id)),
  )

  if (brotherIds.size === 0) {
    const labels = transactionContexts.map((ctx) => ctx.summaryLabel).join(' · ')
    return {
      ...group,
      kind: 'unknown',
      contextLabel: labels || 'Não foi possível identificar os irmãos envolvidos.',
      transactionContexts,
    }
  }

  if (brotherIds.size > 1) {
    const labels = transactionContexts.map((ctx) => ctx.summaryLabel).join(' · ')
    return {
      ...group,
      kind: 'different_brothers',
      contextLabel: `Irmãos diferentes no mesmo mês de pagamento: ${labels}`,
      transactionContexts,
    }
  }

  const referenceKeys = transactionContexts.flatMap((ctx) =>
    ctx.referencePeriods.map((p) => referenceKey(p.month, p.year)),
  )
  const uniqueReferences = new Set(referenceKeys)
  const brotherName = transactionContexts.find((ctx) => ctx.brotherName)?.brotherName ?? 'Irmão'

  if (referenceKeys.length !== uniqueReferences.size) {
    return {
      ...group,
      kind: 'duplicate_same_reference',
      contextLabel: `${brotherName} — mesma referência de mensalidade lançada mais de uma vez.`,
      transactionContexts,
    }
  }

  const labels = transactionContexts.map((ctx) => ctx.summaryLabel).join(' · ')
  return {
    ...group,
    kind: 'late_same_brother',
    contextLabel: `${brotherName} — pagamentos de referências diferentes no mesmo mês (${labels}). Comum em quitação de atrasos.`,
    transactionContexts,
  }
}

export function enrichSameMonthMensalidadeGroups(
  groups: SameMonthMensalidadeGroup[],
  linkContext: MensalidadeLinkContext,
): EnrichedSameMonthMensalidadeGroup[] {
  return groups.map((group) => classifySameMonthMensalidadeGroup(group, linkContext))
}

export interface PartitionedSameMonthGroups {
  errors: EnrichedSameMonthMensalidadeGroup[]
  review: EnrichedSameMonthMensalidadeGroup[]
  informative: EnrichedSameMonthMensalidadeGroup[]
}

export function partitionSameMonthGroupsBySeverity(
  groups: EnrichedSameMonthMensalidadeGroup[],
): PartitionedSameMonthGroups {
  return {
    errors: groups.filter((group) => group.kind === 'duplicate_same_reference'),
    review: groups.filter(
      (group) => group.kind === 'late_same_brother' || group.kind === 'unknown',
    ),
    informative: groups.filter(
      (group) => group.kind === 'different_brothers' || group.kind === 'batch_settlement',
    ),
  }
}
