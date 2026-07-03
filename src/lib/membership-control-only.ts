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
