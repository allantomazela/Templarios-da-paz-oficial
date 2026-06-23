import {
  format,
  setYear,
  getYear,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  compareAsc,
} from 'date-fns'
import { parseCalendarDate } from '@/lib/format-utils'
import type { Brother, Event } from '@/lib/data'

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
