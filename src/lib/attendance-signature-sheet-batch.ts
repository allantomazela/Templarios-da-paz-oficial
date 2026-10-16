import type { Event } from '@/lib/data'
import { compareChancellorEventsByDateAsc } from '@/lib/chancellor-event-sort'
import { todayLocalISODate } from '@/lib/format-utils'

export type SignatureSheetBatchPeriod = 'current_month' | 'next_4' | 'custom'

export interface SignatureSheetBatchFilterOptions {
  period: SignatureSheetBatchPeriod
  /** YYYY-MM-DD — usado em período customizado */
  fromDate?: string
  /** YYYY-MM-DD — usado em período customizado */
  toDate?: string
  /** YYYY-MM-DD — padrão: hoje local */
  today?: string
}

function yearMonthOf(isoDate: string): string {
  return isoDate.slice(0, 7)
}

/**
 * Sessões elegíveis à impressão em lote da Folha de Presença, ordenadas
 * por data/hora (mesma ordem da lista da Chancelaria / livro).
 */
export function filterEventsForSignatureSheetBatch(
  events: Event[],
  options: SignatureSheetBatchFilterOptions,
): Event[] {
  const today = options.today ?? todayLocalISODate()
  const sorted = [...events].sort(compareChancellorEventsByDateAsc)

  if (options.period === 'current_month') {
    const month = yearMonthOf(today)
    return sorted.filter((event) => yearMonthOf(event.date) === month)
  }

  if (options.period === 'next_4') {
    return sorted.filter((event) => event.date >= today).slice(0, 4)
  }

  const from = options.fromDate?.trim() || today
  const to = options.toDate?.trim() || from
  const start = from <= to ? from : to
  const end = from <= to ? to : from
  return sorted.filter((event) => event.date >= start && event.date <= end)
}

export const SIGNATURE_SHEET_BATCH_PRINT_STYLE = `
  @page { size: A4 portrait; margin: 10mm 14mm; }
  @media print {
    body {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .signature-sheet-batch-page {
      break-after: page;
      page-break-after: always;
    }
    .signature-sheet-batch-page:last-child {
      break-after: auto;
      page-break-after: auto;
    }
  }
`
