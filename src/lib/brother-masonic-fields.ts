/** Potências / obediências disponíveis no cadastro de irmãos. */
export const BROTHER_OBEDIENCE_OPTIONS = [
  { value: 'GOB', label: 'GOB - Grande Oriente do Brasil' },
  { value: 'GLESP', label: 'GLESP - Grande Loja do Estado de São Paulo' },
  { value: 'COMAB', label: 'COMAB - Confederação da Maçonaria do Brasil' },
  { value: 'Outra', label: 'Outra' },
] as const

const OBEDIENCE_ALIASES: Record<string, (typeof BROTHER_OBEDIENCE_OPTIONS)[number]['value']> =
  {
    'grande oriente do brasil': 'GOB',
    gob: 'GOB',
    glesp: 'GLESP',
    'grande loja do estado de sao paulo': 'GLESP',
    'grande loja do estado de são paulo': 'GLESP',
    comab: 'COMAB',
    'confederacao da maconaria do brasil': 'COMAB',
    'confederação da maçonaria do brasil': 'COMAB',
    outra: 'Outra',
  }

/** Normaliza valores legados da coluna obedience para o código do Select. */
export function normalizeBrotherObedience(
  value: string | null | undefined,
): string {
  const trimmed = value?.trim()
  if (!trimmed) return ''

  const exact = BROTHER_OBEDIENCE_OPTIONS.find((option) => option.value === trimmed)
  if (exact) return exact.value

  const byLabel = BROTHER_OBEDIENCE_OPTIONS.find(
    (option) => option.label.toLowerCase() === trimmed.toLowerCase(),
  )
  if (byLabel) return byLabel.value

  const upper = trimmed.toUpperCase()
  const byPrefix = BROTHER_OBEDIENCE_OPTIONS.find((option) =>
    upper.startsWith(option.value),
  )
  if (byPrefix) return byPrefix.value

  return OBEDIENCE_ALIASES[trimmed.toLowerCase()] ?? trimmed
}

export function getBrotherObedienceLabel(
  value: string | null | undefined,
): string {
  const normalized = normalizeBrotherObedience(value)
  if (!normalized) return ''

  return (
    BROTHER_OBEDIENCE_OPTIONS.find((option) => option.value === normalized)
      ?.label ?? normalized
  )
}

export function toNullableBrotherText(
  value: string | null | undefined,
): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}
