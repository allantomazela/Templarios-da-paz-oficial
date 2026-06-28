import type { Event } from '@/lib/data'
import { getCalendarDateTimestamp } from '@/lib/format-utils'

/** Ordena eventos da menor para a maior data (e horário como desempate). */
export function compareChancellorEventsByDateAsc(left: Event, right: Event): number {
  const timeA = getCalendarDateTimestamp(left.date)
  const timeB = getCalendarDateTimestamp(right.date)
  if (timeA !== timeB) {
    return (timeA || 0) - (timeB || 0)
  }
  return (left.time || '').localeCompare(right.time || '')
}
