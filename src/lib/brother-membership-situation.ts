import type { Brother } from '@/lib/data'

export type MembershipSituation =
  | 'regular'
  | 'afastado'
  | 'desligado'
  | 'in_memoriam'
  | 'pre_iniciacao'

export const MEMBERSHIP_SITUATION_LABELS: Record<MembershipSituation, string> = {
  regular: 'Regular',
  afastado: 'Afastado (saúde)',
  desligado: 'Desligado',
  in_memoriam: 'In Memoriam',
  pre_iniciacao: 'Pré-iniciação',
}

export const DEFAULT_MEMBERSHIP_BASE_AMOUNT = 200
export const DEFAULT_MEMBERSHIP_SESSION_PACKAGE_AMOUNT = 90

export function normalizeMembershipSituation(
  value: string | null | undefined,
): MembershipSituation {
  const normalized = value?.trim().toLowerCase().replace(/\s+/g, '_')
  if (normalized === 'afastado') return 'afastado'
  if (normalized === 'desligado') return 'desligado'
  if (normalized === 'in_memoriam' || normalized === 'inmemoriam') {
    return 'in_memoriam'
  }
  if (normalized === 'pre_iniciacao' || normalized === 'preiniciacao') {
    return 'pre_iniciacao'
  }
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
  if (brother.regularStatus?.trim().toLowerCase() === 'in memoriam') {
    return 'in_memoriam'
  }
  return 'regular'
}

/** Quadro ativo da Secretaria: regulares e afastados (saúde). */
export function isBrotherOnActiveSecretariatRoster(brother: Pick<
  Brother,
  'status' | 'regularStatus' | 'membershipSituation'
>): boolean {
  const situation = inferMembershipSituation(brother)
  return situation === 'regular' || situation === 'afastado'
}

export function brotherStatusForSituation(
  situation: MembershipSituation,
): Brother['status'] {
  return situation === 'desligado' ||
    situation === 'in_memoriam' ||
    situation === 'pre_iniciacao'
    ? 'Inativo'
    : 'Ativo'
}

export function regularStatusForSituation(
  situation: MembershipSituation,
): string {
  if (situation === 'desligado') return 'Desligado'
  if (situation === 'in_memoriam') return 'In Memoriam'
  if (situation === 'afastado') return 'Afastado'
  if (situation === 'pre_iniciacao') return 'Pré-iniciação'
  return 'Regular'
}

export function profileStatusForSituation(
  situation: MembershipSituation,
): 'approved' | 'blocked' | 'in_memoriam' | 'pre_iniciacao' {
  if (situation === 'desligado') return 'blocked'
  if (situation === 'in_memoriam') return 'in_memoriam'
  if (situation === 'pre_iniciacao') return 'pre_iniciacao'
  return 'approved'
}

/** Cadastrado para a iniciação: ainda não é do quadro e não gera mensalidade. */
export function isBrotherAwaitingInitiation(brother: Pick<
  Brother,
  'status' | 'regularStatus' | 'membershipSituation'
>): boolean {
  return inferMembershipSituation(brother) === 'pre_iniciacao'
}

export function isBrotherBillable(situation: MembershipSituation): boolean {
  return situation === 'regular' || situation === 'afastado'
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
