import { isWithinInterval } from 'date-fns'
import {
  buildPeriodAnchor,
  resolveReportDateRange,
  type AgendaReportPeriod,
} from '@/lib/agenda-events'
import { formatDateBR, parseCalendarDate } from '@/lib/format-utils'
import type { AgapeConsumption, AgapeSession } from '@/stores/useAgapeStore'

export type AgapeReportScope =
  | 'session'
  | 'monthly'
  | 'quarterly'
  | 'semiannual'
  | 'annual'

export interface AgapeBrotherReportRow {
  brotherId: string
  brotherName: string
  totalAmount: number
  totalItems: number
  consumptions: Array<{
    date: string
    itemName: string
    quantity: number
    amount: number
  }>
}

export interface AgapeReportPeriodParams {
  monthValue: string
  yearValue: number
  quarter: number
  half: number
}

export interface AgapeReportMeta {
  label: string
  periodLabel: string
  description: string
  filenameSlug: string
}

const PERIOD_SCOPES: AgendaReportPeriod[] = [
  'monthly',
  'quarterly',
  'semiannual',
  'annual',
]

export function isAgapePeriodScope(
  scope: AgapeReportScope,
): scope is AgendaReportPeriod {
  return PERIOD_SCOPES.includes(scope as AgendaReportPeriod)
}

export function filterAgapeSessionsByScope(
  sessions: AgapeSession[],
  scope: AgapeReportScope,
  params: AgapeReportPeriodParams & { selectedSessionId?: string },
): AgapeSession[] {
  if (scope === 'session') {
    if (!params.selectedSessionId) return []
    const session = sessions.find((item) => item.id === params.selectedSessionId)
    return session ? [session] : []
  }

  const anchor = buildPeriodAnchor(scope, params)
  const range = resolveReportDateRange(scope, anchor)

  return sessions
    .filter((session) => {
      const date = parseCalendarDate(session.date)
      if (!date) return false
      return isWithinInterval(date, { start: range.start, end: range.end })
    })
    .sort((a, b) => b.date.localeCompare(a.date))
}

export function buildAgapeReportData(
  sessions: AgapeSession[],
  consumptions: AgapeConsumption[],
  targetSessions: AgapeSession[],
): AgapeBrotherReportRow[] {
  if (targetSessions.length === 0) return []

  const sessionIds = new Set(targetSessions.map((session) => session.id))
  const sessionById = new Map(targetSessions.map((session) => [session.id, session]))
  const brotherMap = new Map<string, AgapeBrotherReportRow>()

  for (const consumption of consumptions) {
    if (!sessionIds.has(consumption.session_id)) continue

    const session = sessionById.get(consumption.session_id)
    if (!session) continue

    const brotherId = consumption.brother_id
    const brotherName = consumption.brother?.full_name || 'Sem nome'

    if (!brotherMap.has(brotherId)) {
      brotherMap.set(brotherId, {
        brotherId,
        brotherName,
        totalAmount: 0,
        totalItems: 0,
        consumptions: [],
      })
    }

    const brotherData = brotherMap.get(brotherId)!
    brotherData.totalAmount += consumption.total_amount
    brotherData.totalItems += consumption.quantity
    brotherData.consumptions.push({
      date: session.date,
      itemName: consumption.menu_item?.name || 'Item removido',
      quantity: consumption.quantity,
      amount: consumption.total_amount,
    })
  }

  return Array.from(brotherMap.values()).sort((a, b) =>
    a.brotherName.localeCompare(b.brotherName, 'pt-BR'),
  )
}

export function resolveAgapeReportMeta(
  scope: AgapeReportScope,
  params: AgapeReportPeriodParams & { selectedSessionId?: string },
  sessions: AgapeSession[],
): AgapeReportMeta {
  if (scope === 'session') {
    const session = sessions.find((item) => item.id === params.selectedSessionId)
    if (!session) {
      return {
        label: 'Sessão não selecionada',
        periodLabel: 'Sessão',
        description: 'Selecione uma sessão de ágape para gerar o relatório.',
        filenameSlug: 'relatorio-agape-sessao',
      }
    }

    const dateLabel = formatDateBR(session.date)
    const description = session.description?.trim()
    const label = description ? `${dateLabel} — ${description}` : dateLabel

    return {
      label,
      periodLabel: `Sessão — ${label}`,
      description: `Relatório dos consumos registrados na sessão de ágape de ${label}.`,
      filenameSlug: `relatorio-agape-sessao-${session.date}`,
    }
  }

  const anchor = buildPeriodAnchor(scope, params)
  const range = resolveReportDateRange(scope, anchor)

  return {
    label: range.label,
    periodLabel: range.periodLabel,
    description: `Relatório dos consumos registrados pelos irmãos nas sessões de ágape — ${range.periodLabel}.`,
    filenameSlug: `relatorio-agape-${anchor.toLowerCase()}`,
  }
}

export function listAgapeSessionsForPicker(sessions: AgapeSession[]): AgapeSession[] {
  return [...sessions].sort((a, b) => b.date.localeCompare(a.date))
}
