import { describe, expect, it } from 'vitest'
import type { Event } from '@/lib/data'
import { ALL_YEARS } from '@/lib/attendance-presence-list'
import { filterLodgeEvents, splitLodgeEvents } from '@/lib/lodge-agenda-list'

function event(id: string, date: string, title = id, time = '20:00'): Event {
  return {
    id,
    title,
    date,
    time,
    type: 'Sessão',
    location: 'Templo',
    description: 'Sessão da loja',
    attendees: 0,
  }
}

const today = '2026-10-29'

describe('splitLodgeEvents', () => {
  it('coloca hoje e o futuro em próximas e agrupa o passado por mês', () => {
    const { upcoming, pastMonths } = splitLodgeEvents(
      [
        event('nov', '2026-11-18', 'Novembro'),
        event('hoje', '2026-10-29', 'Hoje', '21:00'),
        event('hoje-cedo', '2026-10-29', 'Hoje cedo', '19:00'),
        event('out', '2026-10-01', 'Outubro'),
        event('set', '2026-09-02', 'Setembro'),
      ],
      today,
    )

    expect(upcoming.map((item) => item.id)).toEqual(['hoje-cedo', 'hoje', 'nov'])
    expect(pastMonths.map((group) => group.label)).toEqual(['Outubro 2026', 'Setembro 2026'])
    expect(pastMonths[0]?.items.map((item) => item.id)).toEqual(['out'])
  })
})

describe('filterLodgeEvents', () => {
  it('filtra por ano e ignora acento no título', () => {
    const events = [event('a', '2026-03-01', 'Sessão Ordinária'), event('b', '2025-03-01', 'Sessão')]
    expect(filterLodgeEvents(events, { year: '2026', query: 'ordinaria' }).map((item) => item.id)).toEqual([
      'a',
    ])
    expect(filterLodgeEvents(events, { year: ALL_YEARS, query: '' })).toHaveLength(2)
  })
})
