import type {
  AgendaReportDateRange,
  MonthAnniversaryRow,
} from '@/lib/agenda-events'
import type { Event, Location } from '@/lib/data'
import { downloadCsvFile } from '@/lib/export-utils'
import { formatDateBR } from '@/lib/format-utils'

function resolveLocationName(
  eventLocation: string,
  locationId: string | undefined,
  locations: Location[],
): string {
  if (locationId) {
    const found = locations.find((location) => location.id === locationId)
    if (found?.name) return found.name
  }
  return eventLocation?.trim() || '—'
}

function buildFilenamePrefix(
  kind: 'sessoes' | 'aniversariantes',
  range: AgendaReportDateRange,
): string {
  const slug = range.label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()

  return `relatorio-agenda-${kind}-${slug}`
}

export function exportAgendaSessionsCsv(
  sessions: Event[],
  range: AgendaReportDateRange,
  locations: Location[],
): void {
  downloadCsvFile(
    ['Data', 'Hora', 'Título', 'Local', 'Descrição'],
    sessions.map((session) => [
      formatDateBR(session.date),
      session.time || '—',
      session.title,
      resolveLocationName(session.location, session.locationId, locations),
      session.description?.trim() || '—',
    ]),
    buildFilenamePrefix('sessoes', range),
  )
}

export function exportAgendaAnniversariesCsv(
  anniversaries: MonthAnniversaryRow[],
  range: AgendaReportDateRange,
): void {
  downloadCsvFile(
    ['Data', 'Nome', 'Categoria', 'Vínculo', 'Observação'],
    anniversaries.map((row) => [
      formatDateBR(row.date),
      row.name,
      row.category,
      row.relatedTo,
      row.notes,
    ]),
    buildFilenamePrefix('aniversariantes', range),
  )
}
