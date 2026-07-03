import {
  MEMBERSHIP_CONTROL_ONLY_NOTE,
  MEMBERSHIP_HISTORICAL_NOTE,
} from '@/lib/membership-schedule'

export type ContributionTreasuryMode = 'standard' | 'control_only' | 'link_existing'

export function buildControlOnlyNotes(userNotes?: string | null): string {
  const trimmed = userNotes?.trim()
  if (!trimmed) return MEMBERSHIP_CONTROL_ONLY_NOTE
  if (trimmed.includes(MEMBERSHIP_CONTROL_ONLY_NOTE)) return trimmed
  return `${MEMBERSHIP_CONTROL_ONLY_NOTE}. ${trimmed}`
}

export function stripControlOnlyNote(notes?: string | null): string {
  if (!notes) return ''
  return notes
    .replace(MEMBERSHIP_CONTROL_ONLY_NOTE, '')
    .replace(MEMBERSHIP_HISTORICAL_NOTE, '')
    .replace(/^\.\s*/, '')
    .trim()
}

export function detectTreasuryModeFromContribution(contribution: {
  status: string
  transactionId?: string | null
  notes?: string | null
}): ContributionTreasuryMode {
  if (contribution.status !== 'Pago') return 'standard'
  if ((contribution.notes ?? '').includes(MEMBERSHIP_CONTROL_ONLY_NOTE)) {
    return 'control_only'
  }
  return 'standard'
}

export function normalizeBrotherSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function mensalidadeDescriptionMatchesBrother(
  description: string,
  brotherName: string,
): boolean {
  const normalizedDescription = normalizeBrotherSearchText(description)
  const normalizedBrother = normalizeBrotherSearchText(brotherName)
  if (!normalizedBrother) return false
  return normalizedDescription.includes(normalizedBrother)
}

/** Extrai referência MM/AAAA de descrições padrão de mensalidade. */
export function extractMensalidadeReferenceFromDescription(
  description: string,
): { month: number; year: number; label: string } | null {
  const match = description.match(/\((\d{2})\/(\d{4})\)/)
  if (!match) return null

  const month = Number(match[1])
  const year = Number(match[2])
  if (month < 1 || month > 12 || year < 2000) return null

  return { month, year, label: `${match[1]}/${year}` }
}

export function mensalidadeReferenceMatchesPeriod(
  description: string,
  referenceMonth?: number,
  referenceYear?: number,
): boolean {
  if (!referenceMonth || !referenceYear) return false
  const reference = extractMensalidadeReferenceFromDescription(description)
  if (!reference) return false
  return reference.month === referenceMonth && reference.year === referenceYear
}

export function isUnlinkedMensalidadeTransaction(
  transaction: { id: string; category: string },
  linkedMembershipTransactionIds: Set<string>,
): boolean {
  return (
    transaction.category === 'Mensalidade' &&
    !linkedMembershipTransactionIds.has(transaction.id)
  )
}

export function sortLinkableMensalidadeRows<
  T extends { date: string; referenceMatch?: boolean },
>(rows: T[]): T[] {
  return [...rows].sort((left, right) => {
    if (Boolean(left.referenceMatch) !== Boolean(right.referenceMatch)) {
      return left.referenceMatch ? -1 : 1
    }
    return right.date.localeCompare(left.date)
  })
}
