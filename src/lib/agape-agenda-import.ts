import type { AgapeSession } from '@/stores/useAgapeStore'
import type { Event } from '@/lib/data'

export const AGAPE_IMPORTABLE_EVENT_TYPES = ['Sessão', 'Evento Social'] as const

export type AgapeImportableEventType = (typeof AGAPE_IMPORTABLE_EVENT_TYPES)[number]

export interface AgendaEventRow {
  id: string
  title: string
  date: string
  time: string
  type: string
  description: string
  location: string
}

export function isAgapeImportableEventType(type: string): type is AgapeImportableEventType {
  return (AGAPE_IMPORTABLE_EVENT_TYPES as readonly string[]).includes(type)
}

export function buildAgapeDescriptionFromEvent(
  title: string,
  description?: string | null,
): string {
  const titlePart = title.trim()
  const descriptionPart = description?.trim()
  if (!descriptionPart) return titlePart
  if (!titlePart) return descriptionPart
  return `${titlePart} — ${descriptionPart}`
}

export function mapAgendaEventRow(row: AgendaEventRow): Event {
  return {
    id: row.id,
    title: row.title,
    date: row.date,
    time: row.time,
    type: row.type as Event['type'],
    location: row.location,
    locationId: undefined,
    description: row.description || '',
    attendees: 0,
  }
}

export function getLinkedAgendaEventIds(sessions: AgapeSession[]): Set<string> {
  return new Set(
    sessions
      .map((session) => session.event_id)
      .filter((eventId): eventId is string => Boolean(eventId)),
  )
}

export function listImportableAgendaEvents(
  events: AgendaEventRow[],
  linkedEventIds: Set<string>,
): AgendaEventRow[] {
  return events
    .filter((event) => isAgapeImportableEventType(event.type))
    .filter((event) => !linkedEventIds.has(event.id))
    .sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date)
      if (dateCompare !== 0) return dateCompare
      return (b.time || '').localeCompare(a.time || '')
    })
}

export function buildAgapeSessionFromAgendaEvent(event: AgendaEventRow) {
  return {
    date: event.date,
    description: buildAgapeDescriptionFromEvent(event.title, event.description),
    status: 'open' as const,
    source: 'agenda' as const,
    event_id: event.id,
    created_by: null,
  }
}
