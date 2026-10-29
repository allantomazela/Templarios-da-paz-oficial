import type { Brother } from '@/lib/data'
import {
  inferMembershipSituation,
  isBrotherOnActiveSecretariatRoster,
  type MembershipSituation,
} from '@/lib/brother-membership-situation'

export type DegreeRoster = {
  active: Brother[]
  inactive: Brother[]
}

function byName(left: Brother, right: Brother): number {
  return left.name.localeCompare(right.name, 'pt-BR')
}

function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
}

export function brotherMatchesDegreeSearch(brother: Brother, query: string): boolean {
  const normalized = normalizeSearch(query)
  if (!normalized) return true
  const haystack = normalizeSearch(
    [brother.name, brother.cim ?? '', brother.degree].filter(Boolean).join(' '),
  )
  return haystack.includes(normalized)
}

/** Quadro em atividade separado de desligados e In Memoriam. Afastados permanecem no quadro. */
export function partitionDegreeRoster(brothers: Brother[]): DegreeRoster {
  const active: Brother[] = []
  const inactive: Brother[] = []

  for (const brother of brothers) {
    if (isBrotherOnActiveSecretariatRoster(brother)) active.push(brother)
    else inactive.push(brother)
  }

  active.sort(byName)
  inactive.sort(byName)
  return { active, inactive }
}

export function degreeSituationLabel(brother: Brother): MembershipSituation {
  return inferMembershipSituation(brother)
}
