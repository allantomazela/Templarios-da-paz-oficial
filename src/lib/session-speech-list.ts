import { endOfMonth, format } from 'date-fns'
import type { Brother } from '@/lib/data'
import { isBrotherOnAttendanceRoster } from '@/lib/chancellor-attendance'
import { parseCalendarDate, todayLocalISODate } from '@/lib/format-utils'

export const SESSION_SPEECH_CATEGORY_OPTIONS = [
  { id: 'brother', label: 'Aniversário do irmão' },
  { id: 'spouse', label: 'Cunha' },
  { id: 'child', label: 'Sobrinhos' },
  { id: 'initiation', label: 'Aniversário de iniciação' },
  { id: 'elevation', label: 'Aniversário de elevação' },
  { id: 'exaltation', label: 'Aniversário de exaltação' },
  { id: 'society', label: 'Datas da sociedade' },
] as const

export type SessionSpeechCategoryId =
  (typeof SESSION_SPEECH_CATEGORY_OPTIONS)[number]['id']

export type SessionSpeechFilters = Record<SessionSpeechCategoryId, boolean>

export type SessionSpeechPeriod = 'day' | 'month' | 'range'

export interface SessionSpeechRow {
  id: string
  date: string
  speech: string
  name: string
  link: string
}

export const EMPTY_SESSION_SPEECH_FILTERS: SessionSpeechFilters = {
  brother: false,
  spouse: false,
  child: false,
  initiation: false,
  elevation: false,
  exaltation: false,
  society: false,
}

const SPEECH_LABEL: Record<SessionSpeechCategoryId, string> = {
  brother: 'Aniversário',
  spouse: 'Cunha',
  child: 'Sobrinho(a)',
  initiation: 'Iniciação',
  elevation: 'Elevação',
  exaltation: 'Exaltação',
  society: 'Sociedade',
}

interface FixedCivicDate {
  month: number
  day: number
  title: string
}

/** Conjunto curto do que costuma ser falado em loja. Não altera a Agenda. */
const FIXED_CIVIC_DATES: FixedCivicDate[] = [
  { month: 3, day: 8, title: 'Dia Internacional da Mulher' },
  { month: 8, day: 11, title: 'Dia do Advogado' },
  { month: 9, day: 21, title: 'Dia da Árvore' },
  { month: 10, day: 12, title: 'Dia das Crianças' },
  { month: 10, day: 15, title: 'Dia do Professor' },
  { month: 10, day: 18, title: 'Dia do Médico' },
]

function toIso(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function nthSunday(year: number, monthIndex: number, nth: number): string | null {
  let count = 0
  for (let day = 1; day <= 31; day += 1) {
    const date = new Date(year, monthIndex, day)
    if (date.getMonth() !== monthIndex) break
    if (date.getDay() !== 0) continue
    count += 1
    if (count === nth) return toIso(date)
  }
  return null
}

function yearsCompleted(source: Date, occurrenceYear: number): number {
  return occurrenceYear - source.getFullYear()
}

function anniversaryInYear(sourceIso: string, year: number): string | null {
  const source = parseCalendarDate(sourceIso)
  if (!source) return null
  const month = source.getMonth()
  const day = source.getDate()
  const candidate = new Date(year, month, day)
  if (candidate.getMonth() !== month || candidate.getDate() !== day) return null
  return toIso(candidate)
}

function yearsInRange(start: string, end: string): number[] {
  const startYear = Number(start.slice(0, 4))
  const endYear = Number(end.slice(0, 4))
  const years: number[] = []
  for (let year = startYear; year <= endYear; year += 1) years.push(year)
  return years
}

function inRange(iso: string, start: string, end: string): boolean {
  return iso >= start && iso <= end
}

function pushMilestone(
  rows: SessionSpeechRow[],
  params: {
    id: string
    date: string
    category: Exclude<SessionSpeechCategoryId, 'society'>
    name: string
    link: string
    start: string
    end: string
  },
) {
  if (!inRange(params.date, params.start, params.end)) return
  rows.push({
    id: params.id,
    date: params.date,
    speech: SPEECH_LABEL[params.category],
    name: params.name,
    link: params.link,
  })
}

function ageLink(age: number): string {
  return `Completa ${age} ano${age === 1 ? '' : 's'}`
}

function masonicLink(age: number, kind: string): string {
  return `Completa ${age} ano${age === 1 ? '' : 's'} de ${kind}`
}

function addBrotherMilestones(
  rows: SessionSpeechRow[],
  brother: Brother,
  filters: SessionSpeechFilters,
  start: string,
  end: string,
) {
  for (const year of yearsInRange(start, end)) {
    if (filters.brother && brother.dob) {
      const date = anniversaryInYear(brother.dob, year)
      const source = date ? parseCalendarDate(brother.dob) : null
      if (date && source) {
        const age = yearsCompleted(source, year)
        if (age > 0) {
          pushMilestone(rows, {
            id: `brother-${brother.id}-${date}`,
            date,
            category: 'brother',
            name: brother.name,
            link: ageLink(age),
            start,
            end,
          })
        }
      }
    }

    if (filters.spouse && brother.spouseDob && brother.spouseName?.trim()) {
      const date = anniversaryInYear(brother.spouseDob, year)
      const source = date ? parseCalendarDate(brother.spouseDob) : null
      if (date && source) {
        const age = yearsCompleted(source, year)
        if (age > 0) {
          pushMilestone(rows, {
            id: `spouse-${brother.id}-${date}`,
            date,
            category: 'spouse',
            name: brother.spouseName.trim(),
            link: `Cunha do Ir. ${brother.name}. ${ageLink(age)}`,
            start,
            end,
          })
        }
      }
    }

    if (filters.child && brother.children?.length) {
      brother.children.forEach((child, index) => {
        if (!child.dob || !child.name?.trim()) return
        const date = anniversaryInYear(child.dob, year)
        const source = date ? parseCalendarDate(child.dob) : null
        if (!date || !source) return
        const age = yearsCompleted(source, year)
        if (age <= 0) return
        pushMilestone(rows, {
          id: `child-${brother.id}-${index}-${date}`,
          date,
          category: 'child',
          name: child.name.trim(),
          link: `Sobrinho(a) do Ir. ${brother.name}. ${ageLink(age)}`,
          start,
          end,
        })
      })
    }

    addMasonicMilestone(rows, brother, filters, year, start, end, 'initiation')
    addMasonicMilestone(rows, brother, filters, year, start, end, 'elevation')
    addMasonicMilestone(rows, brother, filters, year, start, end, 'exaltation')
  }
}

function addMasonicMilestone(
  rows: SessionSpeechRow[],
  brother: Brother,
  filters: SessionSpeechFilters,
  year: number,
  start: string,
  end: string,
  category: 'initiation' | 'elevation' | 'exaltation',
) {
  if (!filters[category]) return
  const sourceIso =
    category === 'initiation'
      ? brother.initiationDate
      : category === 'elevation'
        ? brother.elevationDate
        : brother.exaltationDate
  if (!sourceIso) return
  const date = anniversaryInYear(sourceIso, year)
  const source = date ? parseCalendarDate(sourceIso) : null
  if (!date || !source) return
  const age = yearsCompleted(source, year)
  if (age <= 0) return
  const kind =
    category === 'initiation'
      ? 'iniciação'
      : category === 'elevation'
        ? 'elevação'
        : 'exaltação'
  pushMilestone(rows, {
    id: `${category}-${brother.id}-${date}`,
    date,
    category,
    name: brother.name,
    link: masonicLink(age, kind),
    start,
    end,
  })
}

function addSocietyDates(
  rows: SessionSpeechRow[],
  start: string,
  end: string,
) {
  for (const year of yearsInRange(start, end)) {
    for (const item of FIXED_CIVIC_DATES) {
      const date = `${year}-${String(item.month).padStart(2, '0')}-${String(item.day).padStart(2, '0')}`
      if (!inRange(date, start, end)) continue
      rows.push({
        id: `society-${date}-${item.title}`,
        date,
        speech: SPEECH_LABEL.society,
        name: item.title,
        link: 'Data de referência para a fala em loja',
      })
    }

    const mothersDay = nthSunday(year, 4, 2)
    const fathersDay = nthSunday(year, 7, 2)
    if (mothersDay && inRange(mothersDay, start, end)) {
      rows.push({
        id: `society-${mothersDay}-maes`,
        date: mothersDay,
        speech: SPEECH_LABEL.society,
        name: 'Dia das Mães',
        link: 'Segundo domingo de maio',
      })
    }
    if (fathersDay && inRange(fathersDay, start, end)) {
      rows.push({
        id: `society-${fathersDay}-pais`,
        date: fathersDay,
        speech: SPEECH_LABEL.society,
        name: 'Dia dos Pais',
        link: 'Segundo domingo de agosto',
      })
    }
  }
}

export function resolveSessionSpeechRange(params: {
  period: SessionSpeechPeriod
  day: string
  month: string
  from: string
  to: string
}): { start: string; end: string } | null {
  if (params.period === 'day') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(params.day)) return null
    return { start: params.day, end: params.day }
  }

  if (params.period === 'month') {
    if (!/^\d{4}-\d{2}$/.test(params.month)) return null
    const [year, month] = params.month.split('-').map(Number)
    const start = new Date(year, month - 1, 1)
    return { start: toIso(start), end: toIso(endOfMonth(start)) }
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(params.from) || !/^\d{4}-\d{2}-\d{2}$/.test(params.to)) {
    return null
  }
  if (params.from > params.to) return null
  return { start: params.from, end: params.to }
}

export function buildSessionSpeechRows(
  brothers: Brother[],
  filters: SessionSpeechFilters,
  start: string,
  end: string,
): SessionSpeechRow[] {
  const rows: SessionSpeechRow[] = []
  const roster = brothers.filter(isBrotherOnAttendanceRoster)

  for (const brother of roster) {
    addBrotherMilestones(rows, brother, filters, start, end)
  }

  if (filters.society) addSocietyDates(rows, start, end)

  return sortSessionSpeechRows(rows)
}

export function sortSessionSpeechRows(rows: SessionSpeechRow[]): SessionSpeechRow[] {
  return [...rows].sort((left, right) => {
    const byDate = left.date.localeCompare(right.date)
    if (byDate !== 0) return byDate
    const bySpeech = left.speech.localeCompare(right.speech, 'pt-BR')
    if (bySpeech !== 0) return bySpeech
    return left.name.localeCompare(right.name, 'pt-BR')
  })
}

export function defaultSpeechDay(): string {
  return todayLocalISODate()
}

export function defaultSpeechMonth(): string {
  return format(parseCalendarDate(todayLocalISODate()) ?? new Date(), 'yyyy-MM')
}
