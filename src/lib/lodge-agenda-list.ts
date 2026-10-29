import type { Event } from '@/lib/data'
import {
  ALL_YEARS,
  calendarDay,
  splitDatedItems,
  type DatedMonthGroup,
} from '@/lib/attendance-presence-list'
import { compareChancellorEventsByDateAsc } from '@/lib/chancellor-event-sort'

export type LodgeAgendaFilters = {
  year: string
  query: string
}

function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
}

export function lodgeEventYears(events: Event[]): string[] {
  const years = new Set<string>()
  for (const event of events) {
    const day = calendarDay(event.date)
    if (day) years.add(day.slice(0, 4))
  }
  return [...years].sort((left, right) => right.localeCompare(left))
}

export function filterLodgeEvents(events: Event[], filters: LodgeAgendaFilters): Event[] {
  const query = normalizeSearch(filters.query)
  return events.filter((event) => {
    const day = calendarDay(event.date)
    if (filters.year !== ALL_YEARS && !day.startsWith(`${filters.year}-`)) {
      return false
    }
    if (!query) return true
    const haystack = normalizeSearch(
      [event.title, event.type, event.location, event.degree ?? ''].filter(Boolean).join(' '),
    )
    return haystack.includes(query)
  })
}

export function splitLodgeEvents(
  events: Event[],
  today: string,
): { upcoming: Event[]; pastMonths: DatedMonthGroup<Event>[] } {
  return splitDatedItems(
    events,
    today,
    (event) => event.date,
    compareChancellorEventsByDateAsc,
  )
}
