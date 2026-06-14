import type { BatchSettlePeriod } from '@/lib/membership-batch-settle-types'

export function buildBatchMensalidadeDescription(
  brotherName: string,
  periods: BatchSettlePeriod[],
  paymentDate: string,
): string {
  const name = brotherName.trim() || 'Irmão'
  const labels = periods.map((p) => p.periodLabel).join(', ')
  return `Mensalidade - ${name} (${labels}) - ${paymentDate}`
}

export function periodKey(year: number, month: number): string {
  return `${year}-${month}`
}
