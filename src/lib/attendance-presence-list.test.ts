import { describe, expect, it } from 'vitest'
import type { Event } from '@/lib/data'
import {
  ALL_STATUSES,
  ALL_YEARS,
  filterAttendanceItems,
  initialOpenMonthKeys,
  splitAttendanceByDate,
  type AttendanceListItem,
} from '@/lib/attendance-presence-list'

const item = (
  id: string,
  date: string,
  title = id,
  status: AttendanceListItem['displayStatus'] = 'finalizada',
  time = '20:00',
): AttendanceListItem => ({
  displayStatus: status,
  event: {
    id,
    title,
    date,
    time,
    type: 'Sessão',
    location: 'Templo',
    description: '',
    attendees: 0,
  } satisfies Event,
})

const today = '2026-10-29'

describe('splitAttendanceByDate', () => {
  it('coloca hoje e o futuro em próximas, em ordem crescente', () => {
    const { upcoming } = splitAttendanceByDate(
      [
        item('nov', '2026-11-18'),
        item('hoje-tarde', '2026-10-29', 'Hoje', 'aberta', '21:00'),
        item('hoje-cedo', '2026-10-29', 'Hoje cedo', 'nao_iniciada', '19:00'),
      ],
      today,
    )
    expect(upcoming.map((entry) => entry.event.id)).toEqual([
      'hoje-cedo',
      'hoje-tarde',
      'nov',
    ])
  })

  it('agrupa anteriores por mês, do mais recente ao mais antigo', () => {
    const { pastMonths } = splitAttendanceByDate(
      [
        item('out-1', '2026-10-07'),
        item('out-21', '2026-10-21'),
        item('set', '2026-09-16'),
      ],
      today,
    )
    expect(pastMonths.map((group) => group.key)).toEqual(['2026-10', '2026-09'])
    expect(pastMonths[0]?.label).toBe('Outubro 2026')
    expect(pastMonths[0]?.items.map((entry) => entry.event.id)).toEqual([
      'out-21',
      'out-1',
    ])
  })

  it('isola data que não dá para ler', () => {
    const { pastMonths, upcoming } = splitAttendanceByDate(
      [item('ruim', '31/10/2026'), item('ok', '2026-11-01')],
      today,
    )
    expect(upcoming.map((entry) => entry.event.id)).toEqual(['ok'])
    expect(pastMonths[0]?.key).toBe('sem-data')
  })
})

describe('filterAttendanceItems', () => {
  const rows = [
    item('a', '2026-10-07', 'Sessão Magna', 'finalizada'),
    item('b', '2025-11-01', 'Sessão Ordinária', 'nao_iniciada'),
  ]

  it('filtra por ano, status e nome sem acento', () => {
    expect(
      filterAttendanceItems(rows, {
        year: '2026',
        status: ALL_STATUSES,
        query: '',
      }).map((entry) => entry.event.id),
    ).toEqual(['a'])

    expect(
      filterAttendanceItems(rows, {
        year: ALL_YEARS,
        status: 'nao_iniciada',
        query: 'sessao ordinaria',
      }).map((entry) => entry.event.id),
    ).toEqual(['b'])
  })
})

describe('initialOpenMonthKeys', () => {
  it('abre o mês corrente e deixa os anteriores fechados', () => {
    const { pastMonths } = splitAttendanceByDate(
      [item('out', '2026-10-07'), item('set', '2026-09-16')],
      today,
    )
    expect(initialOpenMonthKeys(pastMonths, today)).toEqual(['2026-10'])
  })

  it('abre o mês mais recente quando o mês corrente não tem sessão anterior', () => {
    const { pastMonths } = splitAttendanceByDate(
      [item('set', '2026-09-16'), item('ago', '2026-08-05')],
      today,
    )
    expect(initialOpenMonthKeys(pastMonths, today)).toEqual(['2026-09'])
  })
})
