import type { AgapeBrotherReportRow } from '@/lib/agape-report'
import { downloadCsvFile } from '@/lib/export-utils'
import { formatCurrencyBRL } from '@/lib/format-utils'

export function exportAgapeReportCsv(
  reportData: AgapeBrotherReportRow[],
  filenameSlug: string,
): void {
  downloadCsvFile(
    ['Irmão', 'Total de Itens', 'Valor Total'],
    reportData.map((row) => [
      row.brotherName,
      row.totalItems.toString(),
      row.totalAmount.toFixed(2),
    ]),
    filenameSlug,
    { appendDate: false },
  )
}

export function buildAgapeReportShareText(
  periodLabel: string,
  reportData: AgapeBrotherReportRow[],
  totalItems: number,
  totalAmount: number,
): string {
  const lines = [
    `Relatório de Consumo no Ágape`,
    periodLabel,
    '',
    `Irmãos: ${reportData.length}`,
    `Total de itens: ${totalItems}`,
    `Valor total: ${formatCurrencyBRL(totalAmount)}`,
    '',
    ...reportData.map(
      (row) =>
        `• ${row.brotherName}: ${row.totalItems} item(ns) — ${formatCurrencyBRL(row.totalAmount)}`,
    ),
    '',
    'Documento gerado pelo sistema Templários da Paz',
  ]

  return lines.join('\n')
}

export async function shareAgapeReport(
  periodLabel: string,
  reportData: AgapeBrotherReportRow[],
  totalItems: number,
  totalAmount: number,
): Promise<'shared' | 'copied' | 'failed'> {
  const text = buildAgapeReportShareText(
    periodLabel,
    reportData,
    totalItems,
    totalAmount,
  )

  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: 'Relatório de Consumo no Ágape',
        text,
      })
      return 'shared'
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return 'failed'
      }
    }
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return 'copied'
  }

  return 'failed'
}
