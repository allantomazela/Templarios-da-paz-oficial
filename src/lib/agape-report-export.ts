import type { AgapeBrotherReportRow } from '@/lib/agape-report'
import { downloadCsvFile } from '@/lib/export-utils'
import { formatCurrencyBRL, formatDateBR } from '@/lib/format-utils'

export function exportAgapeReportCsv(
  reportData: AgapeBrotherReportRow[],
  filenameSlug: string,
): void {
  const rows: string[][] = []

  for (const brother of reportData) {
    for (const item of brother.consumptions) {
      rows.push([
        brother.brotherName,
        formatDateBR(item.date),
        item.itemName,
        item.quantity.toString(),
        item.unitPrice.toFixed(2),
        item.amount.toFixed(2),
      ])
    }
    rows.push([
      brother.brotherName,
      '',
      'TOTAL',
      brother.totalItems.toString(),
      '',
      brother.totalAmount.toFixed(2),
    ])
  }

  downloadCsvFile(
    ['Irmão', 'Data', 'Item', 'Quantidade', 'Valor Unit.', 'Total'],
    rows,
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
  ]

  for (const row of reportData) {
    lines.push(`${row.brotherName} — ${formatCurrencyBRL(row.totalAmount)}`)
    for (const item of row.consumptions) {
      lines.push(
        `  • ${formatDateBR(item.date)} · ${item.itemName} · ${item.quantity}x ${formatCurrencyBRL(item.unitPrice)} = ${formatCurrencyBRL(item.amount)}`,
      )
    }
    lines.push('')
  }

  lines.push('Documento gerado pelo sistema Templários da Paz')
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
