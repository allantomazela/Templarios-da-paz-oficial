export type MasonicDegree = 'Aprendiz' | 'Companheiro' | 'Mestre'

export const MASONIC_DEGREE_OPTIONS: MasonicDegree[] = [
  'Aprendiz',
  'Companheiro',
  'Mestre',
]

const MASONIC_DEGREES = MASONIC_DEGREE_OPTIONS

const DEGREE_ALIASES: Record<string, MasonicDegree> = {
  aprendiz: 'Aprendiz',
  'grau i': 'Aprendiz',
  'grau 1': 'Aprendiz',
  '1': 'Aprendiz',
  companheiro: 'Companheiro',
  'grau ii': 'Companheiro',
  'grau 2': 'Companheiro',
  '2': 'Companheiro',
  mestre: 'Mestre',
  'grau iii': 'Mestre',
  'grau 3': 'Mestre',
  '3': 'Mestre',
  'mestre instalado': 'Mestre',
  'past master': 'Mestre',
}

export function normalizeMasonicDegree(
  value: string | null | undefined,
): MasonicDegree | undefined {
  if (!value) return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  if (MASONIC_DEGREES.includes(trimmed as MasonicDegree)) {
    return trimmed as MasonicDegree
  }
  return DEGREE_ALIASES[trimmed.toLowerCase()]
}

/** Sempre retorna um grau válido para formulários e persistência. */
export function coerceMasonicDegree(
  value: string | null | undefined,
): MasonicDegree {
  return normalizeMasonicDegree(value) ?? 'Aprendiz'
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
