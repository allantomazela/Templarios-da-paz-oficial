export type MasonicDegree = 'Aprendiz' | 'Companheiro' | 'Mestre'

const MASONIC_DEGREES: MasonicDegree[] = ['Aprendiz', 'Companheiro', 'Mestre']

export function normalizeMasonicDegree(
  value: string | null | undefined,
): MasonicDegree | undefined {
  if (!value) return undefined
  const trimmed = value.trim()
  if (MASONIC_DEGREES.includes(trimmed as MasonicDegree)) {
    return trimmed as MasonicDegree
  }
  return undefined
}

/**
 * Grau efetivo para permissões: cadastro na Secretaria (brothers) tem prioridade
 * sobre profiles.masonic_degree.
 */
export function resolveEffectiveMasonicDegree(
  brotherDegree: string | null | undefined,
  profileDegree: string | null | undefined,
): MasonicDegree | undefined {
  return normalizeMasonicDegree(brotherDegree) ?? normalizeMasonicDegree(profileDegree)
}

/** Grau I só Grau I; Grau II I+II; Grau III tudo. */
export function canAccessDegree(
  userDegree: MasonicDegree | undefined | null,
  materialDegree: MasonicDegree,
): boolean {
  if (!userDegree) return false
  if (userDegree === 'Mestre') return true
  if (userDegree === 'Companheiro') {
    return materialDegree === 'Aprendiz' || materialDegree === 'Companheiro'
  }
  if (userDegree === 'Aprendiz') {
    return materialDegree === 'Aprendiz'
  }
  return false
}

export function getAccessibleDegrees(
  userDegree: MasonicDegree | undefined | null,
): MasonicDegree[] {
  if (!userDegree) return []
  if (userDegree === 'Mestre') return [...MASONIC_DEGREES]
  if (userDegree === 'Companheiro') return ['Aprendiz', 'Companheiro']
  if (userDegree === 'Aprendiz') return ['Aprendiz']
  return []
}

export function formatMasonicDegreeLabel(degree: MasonicDegree): string {
  if (degree === 'Aprendiz') return 'Grau I'
  if (degree === 'Companheiro') return 'Grau II'
  return 'Grau III'
}
