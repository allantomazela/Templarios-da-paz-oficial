import type { Contribution } from '@/lib/data'
import type { MembershipSituation } from '@/lib/brother-membership-situation'

export interface YearMonth {
  year: number
  month: number
}

const MEMBERSHIP_MONTH_NAMES = [
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
] as const

export function monthNameToNumber(month: string): number {
  return (
    MEMBERSHIP_MONTH_NAMES.indexOf(
      month as (typeof MEMBERSHIP_MONTH_NAMES)[number],
    ) + 1
  )
}

export function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

export function periodLabel(month: number, year: number): string {
  return `${MEMBERSHIP_MONTH_NAMES[month - 1] ?? month}/${year}`
}

export function shortPeriodLabel(month: number, year: number): string {
  const name = MEMBERSHIP_MONTH_NAMES[month - 1] ?? String(month)
  return `${name.slice(0, 3)}/${year}`
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function daysUntilDue(dueDateIso: string, referenceDate: Date): number {
  const [y, m, d] = dueDateIso.split('-').map(Number)
  const dueStart = new Date(y, m - 1, d)
  return Math.round(
    (dueStart.getTime() - startOfDay(referenceDate).getTime()) / 86400000,
  )
}

export function buildDueDateIsoFromParts(
  year: number,
  month: number,
  dueDay: number,
): string {
  const day = Math.min(dueDay, 28)
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/** Período de calendário ainda não iniciou (mês futuro). */
export function isMembershipPeriodFuture(
  year: number,
  month: number,
  referenceDate: Date = new Date(),
): boolean {
  const refYear = referenceDate.getFullYear()
  const refMonth = referenceDate.getMonth() + 1
  return year > refYear || (year === refYear && month > refMonth)
}

/** Atraso só após o dia de vencimento (ex.: dia 11 se vence dia 10). */
export function isMembershipPastDue(
  dueDateIso: string,
  referenceDate: Date = new Date(),
): boolean {
  const [y, m, d] = dueDateIso.split('-').map(Number)
  const dueStart = new Date(y, m - 1, d)
  return startOfDay(referenceDate).getTime() > dueStart.getTime()
}

/**
 * Vencimento por fechamento do mês: a mensalidade pode ser paga em qualquer dia
 * do mês de referência. Só é considerada em atraso a partir do 1º dia do mês
 * seguinte (quando o mês de referência fecha).
 */
export function isMembershipMonthOverdue(
  year: number,
  month: number,
  referenceDate: Date = new Date(),
): boolean {
  const refYear = referenceDate.getFullYear()
  const refMonth = referenceDate.getMonth() + 1
  return year < refYear || (year === refYear && month < refMonth)
}

/** Vencimento exibido: último dia do mês de referência (fechamento do mês). */
export function membershipMonthEndDueDateIso(
  year: number,
  month: number,
): string {
  const lastDay = new Date(year, month, 0).getDate()
  return `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
}

export function* iterMonths(
  fromYear: number,
  fromMonth: number,
  toYear: number,
  toMonth: number,
): Generator<YearMonth> {
  let year = fromYear
  let month = fromMonth

  while (year < toYear || (year === toYear && month <= toMonth)) {
    yield { year, month }
    month += 1
    if (month > 12) {
      month = 1
      year += 1
    }
  }
}

export function resolveScheduleStart(
  memberSince: Date | null,
  contributions: Contribution[],
): YearMonth {
  const now = new Date()
  let startYear = now.getFullYear()
  let startMonth = now.getMonth() + 1

  if (memberSince) {
    startYear = memberSince.getFullYear()
    startMonth = memberSince.getMonth() + 1
  }

  for (const c of contributions) {
    const m = monthNameToNumber(c.month)
    if (c.year < startYear || (c.year === startYear && m < startMonth)) {
      startYear = c.year
      startMonth = m
    }
  }

  return { year: startYear, month: startMonth }
}

/**
 * Desligados não acumulam meses novos: o cronograma vai só até o último
 * período com lançamento registrado (ou fica vazio sem lançamentos).
 */
export function resolveScheduleEnd(
  now: Date,
  contributions: Contribution[],
  situation?: MembershipSituation | null,
): YearMonth | null {
  if (situation !== 'desligado') {
    return { year: now.getFullYear(), month: now.getMonth() + 1 }
  }

  let end: YearMonth | null = null
  for (const c of contributions) {
    const m = monthNameToNumber(c.month)
    if (!end || c.year > end.year || (c.year === end.year && m > end.month)) {
      end = { year: c.year, month: m }
    }
  }
  return end
}

export function groupContributionsByPeriod(
  contributions: Contribution[],
): Map<string, Contribution[]> {
  const map = new Map<string, Contribution[]>()

  for (const c of contributions) {
    const key = monthKey(c.year, monthNameToNumber(c.month))
    const list = map.get(key) ?? []
    list.push(c)
    map.set(key, list)
  }

  return map
}
