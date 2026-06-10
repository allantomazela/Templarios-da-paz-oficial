export const CONTRIBUTION_PAYMENT_METHODS = [
  'PIX',
  'Cartão Crédito',
  'Cartão Débito',
  'Cheque',
  'Boleto',
  'Transferência Bancária',
] as const

export type ContributionPaymentMethod =
  (typeof CONTRIBUTION_PAYMENT_METHODS)[number]

const PAYMENT_METHOD_PREFIX = 'Forma de pagamento:'

export function getPaymentMethodFromNotes(
  notes: string | undefined | null,
): ContributionPaymentMethod | null {
  if (!notes) return null
  const match = notes.match(/Forma de pagamento:\s*(.+?)(?:\n|$)/i)
  const value = match?.[1]?.trim()
  if (!value) return null
  return (
    CONTRIBUTION_PAYMENT_METHODS.find(
      (m) => m.toLowerCase() === value.toLowerCase(),
    ) ?? null
  )
}

export function setPaymentMethodInNotes(
  notes: string | undefined | null,
  method: ContributionPaymentMethod,
): string {
  const line = `${PAYMENT_METHOD_PREFIX} ${method}`
  const regex = /Forma de pagamento:\s*.+?(?:\n|$)/i

  if (!notes?.trim()) return line
  if (regex.test(notes)) {
    return notes.replace(regex, `${line}\n`).replace(/\n$/, '').trim() || line
  }
  return `${notes.trim()}\n${line}`
}

export function removePaymentMethodFromNotes(
  notes: string | undefined | null,
): string {
  if (!notes) return ''
  return notes
    .replace(/Forma de pagamento:\s*.+?(?:\n|$)/i, '')
    .trim()
}
