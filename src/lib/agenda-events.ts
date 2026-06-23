import {
  format,
  setYear,
  getYear,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  isWithinInterval,
  compareAsc,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { parseCalendarDate, formatCalendarDate } from '@/lib/format-utils'
import type { Brother, Event } from '@/lib/data'

export type AgendaReportPeriod = 'monthly' | 'quarterly' | 'semiannual' | 'annual'
export type AgendaReportKind = 'sessions' | 'anniversaries'

export const ANNIVERSARY_CATEGORY_OPTIONS = [
  { id: 'Aniversário', label: 'Aniversário do Irmão' },
  { id: 'Maçônico', label: 'Aniversário maçônico (iniciação)' },
  { id: 'Cônjuge', label: 'Cônjuge' },
  { id: 'Filho(a)', label: 'Filho(a)' },
] as const

export type AnniversaryCategoryId = (typeof ANNIVERSARY_CATEGORY_OPTIONS)[number]['id']

export type AnniversaryCategoryFilters = Record<AnniversaryCategoryId, boolean>

export interface CalendarEvent {
  id: string
  title: string
  date: string
  time?: string
  type: string
  description?: string
  location?: string
  locationId?: string
  brotherId?: string
  relatedBrotherName?: string
  originalEvent?: Event
}

export interface MilestoneBuildOptions {
  includeBrotherBirthdays?: boolean
  includeMasonic?: boolean
  includeSpouse?: boolean
  includeChildren?: boolean
}

export interface MonthAnniversaryRow {
  id: string
  date: string
  name: string
  category: string
  relatedTo: string
  notes: string
}

const DEFAULT_MILESTONE_OPTIONS: Required<MilestoneBuildOptions> = {
  includeBrotherBirthdays: true,
  includeMasonic: true,
  includeSpouse: true,
  includeChildren: true,
}

export function buildMilestoneEvents(
  brothers: Brother[],
  year: number,
  options: MilestoneBuildOptions = {},
): CalendarEvent[] {
  const opts = { ...DEFAULT_MILESTONE_OPTIONS, ...options }
  const milestones: CalendarEvent[] = []

  brothers.forEach((brother) => {
    if (opts.includeBrotherBirthdays && brother.dob) {
      const dob = parseCalendarDate(brother.dob)
      if (dob) {
        const birthdayThisYear = setYear(dob, year)
        milestones.push({
          id: `dob-${brother.id}-${year}`,
          title: `Aniv. Ir. ${brother.name}`,
          date: format(birthdayThisYear, 'yyyy-MM-dd'),
          type: 'Aniversário',
          description: `Aniversário natalício do Irmão ${brother.name} (${brother.degree})`,
          brotherId: brother.id,
          relatedBrotherName: brother.name,
        })
      }
    }

    if (opts.includeMasonic && brother.initiationDate) {
      const init = parseCalendarDate(brother.initiationDate)
      if (init) {
        const initThisYear = setYear(init, year)
        const years = year - getYear(init)
        if (years > 0) {
          milestones.push({
            id: `init-${brother.id}-${year}`,
            title: `Iniciação Ir. ${brother.name}`,
            date: format(initThisYear, 'yyyy-MM-dd'),
            type: 'Maçônico',
            description: `Completando ${years} ano${years === 1 ? '' : 's'} de vida maçônica.`,
            brotherId: brother.id,
            relatedBrotherName: brother.name,
          })
        }
      }
    }

    if (opts.includeSpouse && brother.spouseDob && brother.spouseName?.trim()) {
      const spouseDob = parseCalendarDate(brother.spouseDob)
      if (spouseDob) {
        const spouseBirthdayThisYear = setYear(spouseDob, year)
        milestones.push({
          id: `spouse-${brother.id}-${year}`,
          title: `Aniv. Cônjuge — ${brother.spouseName.trim()}`,
          date: format(spouseBirthdayThisYear, 'yyyy-MM-dd'),
          type: 'Cônjuge',
          description: `Cônjuge do Ir∴ ${brother.name}`,
          brotherId: brother.id,
          relatedBrotherName: brother.name,
        })
      }
    }

    if (opts.includeChildren && brother.children?.length) {
      brother.children.forEach((child, index) => {
        if (!child.dob || !child.name?.trim()) return
        const childDob = parseCalendarDate(child.dob)
        if (!childDob) return
        const childBirthdayThisYear = setYear(childDob, year)
        milestones.push({
          id: `child-${brother.id}-${index}-${year}`,
          title: `Aniv. ${child.name.trim()}`,
          date: format(childBirthdayThisYear, 'yyyy-MM-dd'),
          type: 'Filho(a)',
          description: `Filho(a) do Ir∴ ${brother.name}`,
          brotherId: brother.id,
          relatedBrotherName: brother.name,
        })
      })
    }
  })

  return milestones.sort((a, b) => a.date.localeCompare(b.date))
}

export function getSessionsForMonth(
  events: Event[],
  year: number,
  month: number,
): Event[] {
  const start = startOfMonth(new Date(year, month - 1, 1))
  const end = endOfMonth(start)

  return events
    .filter((event) => {
      if (event.type !== 'Sessão') return false
      const date = parseCalendarDate(event.date)
      if (!date) return false
      return isWithinInterval(date, { start, end })
    })
    .sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date)
      if (dateCompare !== 0) return dateCompare
      return (a.time || '00:00').localeCompare(b.time || '00:00')
    })
}

function milestoneDisplayName(event: CalendarEvent): string {
  if (event.type === 'Maçônico') {
    return event.title.replace(/^Iniciação\s*Ir\.\s*/i, '')
  }
  if (event.type === 'Cônjuge') {
    return event.title.replace(/^Aniv\.\s*Cônjuge\s*—\s*/i, '')
  }
  return event.title.replace(/^Aniv\.\s*(Ir\.\s*)?/i, '')
}

export function getAnniversariesForMonth(
  brothers: Brother[],
  year: number,
  month: number,
  options?: MilestoneBuildOptions,
): MonthAnniversaryRow[] {
  const start = startOfMonth(new Date(year, month - 1, 1))
  const end = endOfMonth(start)

  return buildMilestoneEvents(brothers, year, options)
    .filter((event) => {
      const date = parseCalendarDate(event.date)
      if (!date) return false
      return isWithinInterval(date, { start, end })
    })
    .map((event) => ({
      id: event.id,
      date: event.date,
      name: milestoneDisplayName(event),
      category: event.type,
      relatedTo: event.relatedBrotherName
        ? `Ir∴ ${event.relatedBrotherName}`
        : '—',
      notes: event.description || '—',
    }))
    .sort((a, b) => compareAsc(parseCalendarDate(a.date)!, parseCalendarDate(b.date)!))
}

export function parseMonthValue(monthValue: string): { year: number; month: number } {
  const [year, month] = monthValue.split('-').map(Number)
  return { year, month }
}

export function buildPeriodAnchor(
  period: AgendaReportPeriod,
  params: {
    monthValue: string
    yearValue: number
    quarter: number
    half: number
  },
): string {
  switch (period) {
    case 'monthly':
      return params.monthValue
    case 'quarterly':
      return `${params.yearValue}-Q${params.quarter}`
    case 'semiannual':
      return `${params.yearValue}-H${params.half}`
    case 'annual':
      return String(params.yearValue)
  }
}

export interface AgendaReportDateRange {
  start: Date
  end: Date
  label: string
  periodLabel: string
}

export function resolveReportDateRange(
  period: AgendaReportPeriod,
  anchor: string,
): AgendaReportDateRange {
  switch (period) {
    case 'monthly': {
      const { year, month } = parseMonthValue(anchor)
      const start = startOfMonth(new Date(year, month - 1, 1))
      const end = endOfMonth(start)
      const label = formatCalendarDate(format(start, 'yyyy-MM-dd'), 'MMMM yyyy', {
        locale: ptBR,
      })
      return { start, end, label, periodLabel: `Mensal — ${label}` }
    }
    case 'quarterly': {
      const [yearStr, quarterStr] = anchor.split('-Q')
      const year = Number(yearStr)
      const quarter = Number(quarterStr)
      const startMonth = (quarter - 1) * 3
      const start = startOfMonth(new Date(year, startMonth, 1))
      const end = endOfMonth(new Date(year, startMonth + 2, 1))
      return {
        start,
        end,
        label: `${quarter}º trimestre de ${year}`,
        periodLabel: `Trimestral — ${quarter}º trimestre de ${year}`,
      }
    }
    case 'semiannual': {
      const [yearStr, halfStr] = anchor.split('-H')
      const year = Number(yearStr)
      const half = Number(halfStr)
      const startMonth = half === 1 ? 0 : 6
      const start = startOfMonth(new Date(year, startMonth, 1))
      const end = endOfMonth(new Date(year, startMonth + 5, 1))
      return {
        start,
        end,
        label: `${half}º semestre de ${year}`,
        periodLabel: `Semestral — ${half}º semestre de ${year}`,
      }
    }
    case 'annual': {
      const year = Number(anchor)
      const start = startOfYear(new Date(year, 0, 1))
      const end = endOfYear(new Date(year, 0, 1))
      return {
        start,
        end,
        label: `Ano ${year}`,
        periodLabel: `Anual — ${year}`,
      }
    }
  }
}

function yearsCoveredByRange(start: Date, end: Date): number[] {
  const years: number[] = []
  for (let year = getYear(start); year <= getYear(end); year += 1) {
    years.push(year)
  }
  return years
}

export function categoryFiltersToMilestoneOptions(
  filters: AnniversaryCategoryFilters,
): MilestoneBuildOptions {
  return {
    includeBrotherBirthdays: filters['Aniversário'],
    includeMasonic: filters['Maçônico'],
    includeSpouse: filters['Cônjuge'],
    includeChildren: filters['Filho(a)'],
  }
}

export function getSessionsForPeriod(
  events: Event[],
  range: AgendaReportDateRange,
): Event[] {
  return events
    .filter((event) => {
      if (event.type !== 'Sessão') return false
      const date = parseCalendarDate(event.date)
      if (!date) return false
      return isWithinInterval(date, { start: range.start, end: range.end })
    })
    .sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date)
      if (dateCompare !== 0) return dateCompare
      return (a.time || '00:00').localeCompare(b.time || '00:00')
    })
}

export function getAnniversariesForPeriod(
  brothers: Brother[],
  range: AgendaReportDateRange,
  options?: MilestoneBuildOptions,
): MonthAnniversaryRow[] {
  const years = yearsCoveredByRange(range.start, range.end)
  const milestones = years.flatMap((year) =>
    buildMilestoneEvents(brothers, year, options),
  )

  const uniqueMilestones = Array.from(
    new Map(milestones.map((event) => [event.id, event])).values(),
  )

  return uniqueMilestones
    .filter((event) => {
      const date = parseCalendarDate(event.date)
      if (!date) return false
      return isWithinInterval(date, { start: range.start, end: range.end })
    })
    .map((event) => ({
      id: event.id,
      date: event.date,
      name: milestoneDisplayName(event),
      category: event.type,
      relatedTo: event.relatedBrotherName
        ? `Ir∴ ${event.relatedBrotherName}`
        : '—',
      notes: event.description || '—',
    }))
    .sort((a, b) =>
      compareAsc(parseCalendarDate(a.date)!, parseCalendarDate(b.date)!),
    )
}

export const DEFAULT_ANNIVERSARY_CATEGORY_FILTERS: AnniversaryCategoryFilters = {
  Aniversário: true,
  Maçônico: true,
  Cônjuge: true,
  'Filho(a)': true,
}
