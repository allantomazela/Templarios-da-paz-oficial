/**
 * Tipos e constantes dos cargos da loja (sem dependência do store).
 * POSITION_LABELS ficou apenas em LodgePositionsManager para evitar erro de export no bundle.
 */

export type LodgePositionType =
  | 'veneravel_mestre'
  | 'orador'
  | 'secretario'
  | 'chanceler'
  | 'tesoureiro'
  | 'mestre_banquete'

/** Cargos da diretoria (podem registrar consumos no ágape) */
export const DIRECTORATE_POSITION_TYPES: LodgePositionType[] = [
  'veneravel_mestre',
  'secretario',
  'chanceler',
  'tesoureiro',
  'orador',
]

export function isDirectoratePosition(
  position: LodgePositionType | null,
): boolean {
  return position !== null && DIRECTORATE_POSITION_TYPES.includes(position)
}

/** Mapeamento de permissões por cargo */
export const POSITION_PERMISSIONS: Record<LodgePositionType, string[]> = {
  veneravel_mestre: ['*'],
  secretario: ['secretariat', 'agenda', 'library', 'agape'],
  chanceler: ['chancellor', 'agenda', 'agape'],
  tesoureiro: ['financial', 'agape'],
  orador: ['reports', 'agape'],
  mestre_banquete: ['agenda', 'events', 'agape'],
}
