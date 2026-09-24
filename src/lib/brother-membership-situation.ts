import type { Brother } from '@/lib/data'

export type MembershipSituation = 'regular' | 'afastado' | 'desligado'

export const MEMBERSHIP_SITUATION_LABELS: Record<MembershipSituation, string> = {
  regular: 'Regular',
  afastado: 'Afastado (saúde)',
  desligado: 'Desligado',
}

export const DEFAULT_MEMBERSHIP_BASE_AMOUNT = 200
export const DEFAULT_MEMBERSHIP_SESSION_PACKAGE_AMOUNT = 90

export function normalizeMembershipSituation(
  value: string | null | undefined,
): MembershipSituation {
  const normalized = value?.trim().toLowerCase()
  if (normalized === 'afastado') return 'afastado'
  if (normalized === 'desligado') return 'desligado'
  return 'regular'
}

/** Infere situação a partir do cadastro legado (antes da coluna dedicada). */
export function inferMembershipSituation(brother: Pick<
  Brother,
  'status' | 'regularStatus' | 'membershipSituation'
>): MembershipSituation {
  if (brother.membershipSituation) {
    return normalizeMembershipSituation(brother.membershipSituation)
  }
  if (brother.status === 'Inativo') return 'desligado'
  if (brother.regularStatus?.trim().toLowerCase() === 'afastado') {
    return 'afastado'
  }
  return 'regular'
}

export function brotherStatusForSituation(
  situation: MembershipSituation,
): Brother['status'] {
  return situation === 'desligado' ? 'Inativo' : 'Ativo'
}

export function regularStatusForSituation(
  situation: MembershipSituation,
): string {
  if (situation === 'desligado') return 'Desligado'
  if (situation === 'afastado') return 'Afastado'
  return 'Regular'
}

export function profileStatusForSituation(
  situation: MembershipSituation,
): 'approved' | 'blocked' {
  return situation === 'desligado' ? 'blocked' : 'approved'
}

export function isBrotherBillable(situation: MembershipSituation): boolean {
  return situation !== 'desligado'
}

export function resolveContributionAmountForSituation(
  situation: MembershipSituation,
  settings: {
    baseAmount: number
    sessionPackageAmount: number
    defaultAmount: number
  },
): number | null {
  if (!isBrotherBillable(situation)) return null
  if (situation === 'afastado') return settings.baseAmount
  const composed = settings.baseAmount + settings.sessionPackageAmount
  return composed > 0 ? composed : settings.defaultAmount
}

export function composeActiveMembershipAmount(
  baseAmount: number,
  sessionPackageAmount: number,
): number {
  return Math.max(0.01, baseAmount + sessionPackageAmount)
}
