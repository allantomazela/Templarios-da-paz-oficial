export const FINANCIAL_DOCUMENT_TYPES = [
  { value: 'nota_fiscal', label: 'Nota fiscal' },
  { value: 'recibo', label: 'Recibo' },
  { value: 'cupom_fiscal', label: 'Cupom fiscal' },
  { value: 'outro', label: 'Outro' },
] as const

export type FinancialDocumentType =
  (typeof FINANCIAL_DOCUMENT_TYPES)[number]['value']

export function getFinancialDocumentTypeLabel(type: FinancialDocumentType): string {
  return FINANCIAL_DOCUMENT_TYPES.find((item) => item.value === type)?.label ?? type
}
