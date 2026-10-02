export const CONTRIBUTION_MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
] as const

export function monthNameToNumber(month: string): number {
  return CONTRIBUTION_MONTHS.indexOf(month as (typeof CONTRIBUTION_MONTHS)[number]) + 1
}

export function monthNumberToName(month: number): string {
  return CONTRIBUTION_MONTHS[month - 1] ?? `${month}`
}
