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

/** Mapeamento de permissões por cargo */
export const POSITION_PERMISSIONS: Record<LodgePositionType, string[]> = {
  veneravel_mestre: ['*'],
  secretario: ['secretariat', 'agenda', 'library'],
  chanceler: ['chancellor', 'agenda'],
  tesoureiro: ['financial'],
  orador: ['reports'],
  mestre_banquete: ['agenda', 'events', 'agape'],
}
