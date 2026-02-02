/**
 * Tipos e constantes dos cargos da loja (sem dependência do store).
 * Módulo separado para evitar "Export is not defined" no bundle.
 */

export type LodgePositionType =
  | 'veneravel_mestre'
  | 'orador'
  | 'secretario'
  | 'chanceler'
  | 'tesoureiro'
  | 'mestre_banquete'

/** Labels dos cargos para exibição na UI */
export const POSITION_LABELS: Record<LodgePositionType, string> = {
  veneravel_mestre: 'Venerável Mestre',
  orador: 'Orador',
  secretario: 'Secretário',
  chanceler: 'Chanceler',
  tesoureiro: 'Tesoureiro',
  mestre_banquete: 'Mestre de Banquete',
}

/** Mapeamento de permissões por cargo */
export const POSITION_PERMISSIONS: Record<LodgePositionType, string[]> = {
  veneravel_mestre: ['*'],
  secretario: ['secretariat', 'agenda', 'library'],
  chanceler: ['chancellor', 'agenda'],
  tesoureiro: ['financial'],
  orador: ['reports'],
  mestre_banquete: ['agenda', 'events', 'agape'],
}
