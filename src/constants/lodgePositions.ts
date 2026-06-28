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
  | 'primeiro_vigilante'
  | 'segundo_vigilante'
  | 'mestre_cerimonias'
  | 'mestre_harmonia'

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
  mestre_banquete: ['chancellor', 'agenda', 'events', 'agape'],
  primeiro_vigilante: [],
  segundo_vigilante: [],
  mestre_cerimonias: [],
  mestre_harmonia: [],
}

export const LODGE_POSITION_LABELS: Record<LodgePositionType, string> = {
  veneravel_mestre: 'Venerável Mestre',
  orador: 'Orador',
  secretario: 'Secretário',
  chanceler: 'Chanceler',
  tesoureiro: 'Tesoureiro',
  mestre_banquete: 'Mestre de Banquete',
  primeiro_vigilante: '1º Vigilante',
  segundo_vigilante: '2º Vigilante',
  mestre_cerimonias: 'Mestre de Cerimônia',
  mestre_harmonia: 'Mestre de Harmonia',
}

export const SYSTEM_ROLE_LABELS: Record<'admin' | 'editor' | 'member', string> = {
  admin: 'Administrador',
  editor: 'Editor (Tesouraria)',
  member: 'Membro',
}
