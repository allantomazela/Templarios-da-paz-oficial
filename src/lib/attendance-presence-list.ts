import type { Event, SessionRecord } from '@/lib/data'
import { compareChancellorEventsByDateAsc } from '@/lib/chancellor-event-sort'

export type SessionDisplayStatus = 'nao_iniciada' | 'aberta' | 'finalizada'

export type AttendanceListItem = {
  event: Event
  record?: SessionRecord
  displayStatus: SessionDisplayStatus
}

export type AttendanceStatusFilter = 'all' | SessionDisplayStatus

export type AttendanceListFilters = {
  year: string
  status: AttendanceStatusFilter
  query: string
}

export const ALL_YEARS = 'all'
export const ALL_STATUSES = 'all' satisfies AttendanceStatusFilter

const MONTH_LABELS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

export const UNDATED_MONTH_KEY = 'sem-data'

export function getSessionDisplayStatus(
  record?: SessionRecord,
): SessionDisplayStatus {
  if (!record) return 'nao_iniciada'
  if (record.status === 'Pendente') return 'aberta'
  return 'finalizada'
}

export function calendarDay(date: string | null | undefined): string {
  const iso = date?.trim().split('T')[0]?.split(' ')[0] ?? ''
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : ''
}

function compareItemsAsc(left: AttendanceListItem, right: AttendanceListItem) {
  return compareChancellorEventsByDateAsc(left.event, right.event)
}

function compareItemsDesc(left: AttendanceListItem, right: AttendanceListItem) {
  return compareChancellorEventsByDateAsc(right.event, left.event)
}

function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
}

export function filterAttendanceItems(
  items: AttendanceListItem[],
  filters: AttendanceListFilters,
): AttendanceListItem[] {
  const query = normalizeSearch(filters.query)
  return items.filter((item) => {
    const day = calendarDay(item.event.date)
    if (filters.year !== ALL_YEARS && !day.startsWith(`${filters.year}-`)) {
      return false
    }
    if (filters.status !== ALL_STATUSES && item.displayStatus !== filters.status) {
      return false
    }
    if (!query) return true
    const haystack = normalizeSearch(
      [item.event.title, item.event.type, item.event.degree ?? ''].filter(Boolean).join(' '),
    )
    return haystack.includes(query)
  })
}

export type AttendanceMonthGroup = {
  key: string
  label: string
  items: AttendanceListItem[]
}

function monthLabel(key: string): string {
  const [year, month] = key.split('-')
  const name = MONTH_LABELS[Number(month) - 1]
  if (!name || !year) return key
  return `${name} ${year}`
}

/** Próximas em ordem crescente. Anteriores agrupadas por mês, do mais recente ao mais antigo. */
export function splitAttendanceByDate(
  items: AttendanceListItem[],
  today: string,
): { upcoming: AttendanceListItem[]; pastMonths: AttendanceMonthGroup[] } {
  const upcoming: AttendanceListItem[] = []
  const undated: AttendanceListItem[] = []
  const pastByMonth = new Map<string, AttendanceListItem[]>()

  for (const item of items) {
    const day = calendarDay(item.event.date)
    if (!day) {
      undated.push(item)
      continue
    }
    if (day >= today) {
      upcoming.push(item)
      continue
    }
    const monthKey = day.slice(0, 7)
    const bucket = pastByMonth.get(monthKey) ?? []
    bucket.push(item)
    pastByMonth.set(monthKey, bucket)
  }

  upcoming.sort(compareItemsAsc)

  const pastMonths: AttendanceMonthGroup[] = [...pastByMonth.entries()]
    .sort(([left], [right]) => right.localeCompare(left))
    .map(([key, monthItems]) => ({
      key,
      label: monthLabel(key),
      items: [...monthItems].sort(compareItemsDesc),
    }))

  if (undated.length > 0) {
    pastMonths.unshift({
      key: UNDATED_MONTH_KEY,
      label: 'Data não reconhecida',
      items: undated,
    })
  }

  return { upcoming, pastMonths }
}

export function attendanceYears(items: AttendanceListItem[]): string[] {
  const years = new Set<string>()
  for (const item of items) {
    const day = calendarDay(item.event.date)
    if (day) years.add(day.slice(0, 4))
  }
  return [...years].sort((left, right) => right.localeCompare(left))
}

/** Mês corrente aberto. Sem eventos nesse mês, abre o mês anterior mais recente. */
export function initialOpenMonthKeys(
  groups: AttendanceMonthGroup[],
  today: string,
): string[] {
  const current = today.slice(0, 7)
  const open = new Set<string>()
  if (groups.some((group) => group.key === UNDATED_MONTH_KEY)) {
    open.add(UNDATED_MONTH_KEY)
  }
  if (groups.some((group) => group.key === current)) {
    open.add(current)
    return [...open]
  }
  const latest = groups.find((group) => group.key !== UNDATED_MONTH_KEY)
  if (latest) open.add(latest.key)
  return [...open]
}
