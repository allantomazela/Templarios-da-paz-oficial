import type { VisitorAttendance } from '@/lib/data'

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

export function normalizeVisitorAttendanceInput(
  input: VisitorAttendanceInput,
): VisitorAttendanceInput {
  const normalizeText = (value: string) => value.trim().replace(/\s+/g, ' ')
  return {
    ...input,
    name: normalizeText(input.name),
    lodge: normalizeText(input.lodge),
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
  const lodge = input.lodge.trim()
  const lodgeNumber = input.lodgeNumber.trim()
  const obedience = input.obedience.trim()
  const masonicNumber = input.masonicNumber?.trim() || ''

  if (name.length < 3) {
    errors.push('Nome do visitante precisa ter pelo menos 3 caracteres.')
  }
  if (name.length > 120) {
    errors.push('Nome do visitante deve ter no maximo 120 caracteres.')
  }
  if (lodge.length < 2) {
    errors.push('Nome da loja precisa ter pelo menos 2 caracteres.')
  }
  if (lodge.length > 120) {
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
