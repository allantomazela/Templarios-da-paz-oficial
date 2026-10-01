export type MembershipSituation = 'regular' | 'afastado' | 'desligado'

export const DEFAULT_MEMBERSHIP_BASE_AMOUNT = 200
export const DEFAULT_MEMBERSHIP_SESSION_PACKAGE_AMOUNT = 90

export interface MembershipAmountSettings {
  defaultAmount: number
  baseAmount?: number
  sessionPackageAmount?: number
}

export interface BrotherSituationFields {
  status?: string | null
  regular_status?: string | null
  membership_situation?: string | null
}

/** Mesma regra de src/lib/brother-membership-situation.ts (inferMembershipSituation). */
export function inferMembershipSituation(
  brother: BrotherSituationFields | null | undefined,
): MembershipSituation {
  const explicit = brother?.membership_situation?.trim().toLowerCase()
  if (explicit === 'afastado') return 'afastado'
  if (explicit === 'desligado') return 'desligado'
  if (explicit) return 'regular'
  if (brother?.status === 'Inativo') return 'desligado'
  if (brother?.regular_status?.trim().toLowerCase() === 'afastado') {
    return 'afastado'
  }
  return 'regular'
}

/** Afastado paga só a base; regular paga o valor cheio configurado. */
export function resolveScheduleExpectedAmount(
  settings: MembershipAmountSettings,
  situation?: MembershipSituation | null,
): number {
  if (situation === 'afastado') {
    return settings.baseAmount ?? settings.defaultAmount
  }
  return settings.defaultAmount
}
