import type { VisitorAttendance } from '@/lib/data'

/** Prefixo maçônico padrão para o nome da Loja de Origem. */
export const LODGE_NAME_PREFIX = 'A∴ R∴ L∴ S∴ '

export const DEGREE_OPTIONS = ['Aprendiz', 'Companheiro', 'Mestre'] as const

export const OBEDIENCE_OPTIONS = [
  { value: 'GOB', label: 'GOB - Grande Oriente do Brasil' },
  { value: 'GLESP', label: 'GLESP - Grande Loja do Estado de Sao Paulo' },
  { value: 'GLEMG', label: 'GLEMG - Grande Loja do Estado de Minas Gerais' },
  { value: 'Outra', label: 'Outra obediencia' },
] as const

export type VisitorAttendanceInput = Pick<
  VisitorAttendance,
  'name' | 'degree' | 'lodge' | 'lodgeNumber' | 'obedience' | 'masonicNumber'
>

/** Remove o prefixo maçônico para edição no formulário (preserva espaços digitados). */
export function stripLodgeNamePrefix(lodge: string): string {
  if (!lodge) return ''
  return lodge.replace(/^A\s*[∴.]\s*R\s*[∴.]\s*L\s*[∴.]\s*S\s*[∴.]\s*/i, '')
}

/** Garante o prefixo A∴ R∴ L∴ S∴ uma única vez no nome da loja. */
export function formatLodgeNameWithPrefix(lodge: string): string {
  const name = stripLodgeNamePrefix(lodge).trim()
  if (!name) return LODGE_NAME_PREFIX.trim()
  return `${LODGE_NAME_PREFIX}${name}`
}

export function normalizeVisitorAttendanceInput(
  input: VisitorAttendanceInput,
): VisitorAttendanceInput {
  const normalizeText = (value: string) => value.trim().replace(/\s+/g, ' ')
  return {
    ...input,
    name: normalizeText(input.name),
    lodge: formatLodgeNameWithPrefix(normalizeText(input.lodge)),
    lodgeNumber: normalizeText(input.lodgeNumber),
    obedience: normalizeText(input.obedience),
    masonicNumber: input.masonicNumber
      ? normalizeText(input.masonicNumber)
      : input.masonicNumber,
  }
}

export function validateVisitorAttendanceInput(
  input: VisitorAttendanceInput,
): string[] {
  const errors: string[] = []
  const name = input.name.trim()
  const lodgeName = stripLodgeNamePrefix(input.lodge.trim())
  const lodgeNumber = input.lodgeNumber.trim()
  const obedience = input.obedience.trim()
  const masonicNumber = input.masonicNumber?.trim() || ''

  if (name.length < 3) {
    errors.push('Nome do visitante precisa ter pelo menos 3 caracteres.')
  }
  if (name.length > 120) {
    errors.push('Nome do visitante deve ter no maximo 120 caracteres.')
  }
  if (lodgeName.length < 2) {
    errors.push('Nome da loja precisa ter pelo menos 2 caracteres.')
  }
  if (lodgeName.length > 120) {
    errors.push('Nome da loja deve ter no maximo 120 caracteres.')
  }
  if (!/^\d+$/.test(lodgeNumber)) {
    errors.push('Numero da loja deve conter apenas digitos.')
  }
  if (lodgeNumber.length > 10) {
    errors.push('Numero da loja deve ter no maximo 10 digitos.')
  }
  if (!obedience) {
    errors.push('Obediencia e obrigatoria.')
  }
  if (masonicNumber && !/^[0-9.-]+$/.test(masonicNumber)) {
    errors.push(
      'Registro maconico deve conter apenas numeros, ponto ou hifen.',
    )
  }
  if (masonicNumber.length > 20) {
    errors.push('Registro maconico deve ter no maximo 20 caracteres.')
  }

  return errors
}

export interface VisitorCertificateShareParams {
  visitor: VisitorAttendanceInput
  eventTitle: string
  eventDateLabel: string
  lodgeTitle: string
  venerableMaster: string
  chancellor: string
}

/** Texto formatado para compartilhamento do certificado (WhatsApp / Web Share). */
export function buildVisitorCertificateShareText(
  params: VisitorCertificateShareParams,
): string {
  const lodgeDisplay = formatLodgeNameWithPrefix(params.visitor.lodge)
  let body = `Certificamos que o Ir∴ *${params.visitor.name}*, no Grau de *${params.visitor.degree}*, da *${lodgeDisplay}* Nº *${params.visitor.lodgeNumber}*, filiada à *${params.visitor.obedience}*`

  if (params.visitor.masonicNumber?.trim()) {
    body += `, portador do Registro Maçônico Nº *${params.visitor.masonicNumber.trim()}*`
  }

  body += `, esteve presente na sessão realizada em *${params.eventDateLabel}* (*${params.eventTitle}*), na qualidade de *Visitante*.`

  return [
    '*Certificado de Presença*',
    `*${params.lodgeTitle}*`,
    '',
    body,
    '',
    `_${params.venerableMaster}_`,
    'Venerável Mestre',
    '',
    `_${params.chancellor}_`,
    'Chanceler',
    '',
    `Emitido em ${new Date().toLocaleDateString('pt-BR')} pelo sistema ${params.lodgeTitle}.`,
  ].join('\n')
}

export function openVisitorCertificateWhatsApp(text: string): void {
  const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`
  const link = document.createElement('a')
  link.href = url
  link.target = '_blank'
  link.rel = 'noopener noreferrer'
  document.body.appendChild(link)
  link.click()
  link.remove()
}
