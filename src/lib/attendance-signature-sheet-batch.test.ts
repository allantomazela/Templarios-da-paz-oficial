import { describe, expect, it } from 'vitest'
import type { Event } from '@/lib/data'
import { filterEventsForSignatureSheetBatch } from './attendance-signature-sheet-batch'

function event(overrides: Partial<Event> & Pick<Event, 'id' | 'date'>): Event {
  return {
    title: 'Sessão',
    time: '20:00',
    type: 'Sessão',
    location: 'Templo',
    description: '',
    attendees: 0,
    ...overrides,
  }
}

const events: Event[] = [
  event({ id: 'a', date: '2026-09-30', time: '20:00', title: 'Setembro' }),
  event({ id: 'b', date: '2026-10-07', time: '20:00', title: 'Out 1' }),
  event({ id: 'c', date: '2026-10-14', time: '19:30', title: 'Out 2' }),
  event({ id: 'd', date: '2026-10-21', time: '20:00', title: 'Out 3' }),
  event({ id: 'e', date: '2026-10-28', time: '20:00', title: 'Out 4' }),
  event({ id: 'f', date: '2026-11-04', time: '20:00', title: 'Nov' }),
]

describe('filterEventsForSignatureSheetBatch', () => {
  it('mês atual lista só as sessões do mês, em ordem', () => {
    const rows = filterEventsForSignatureSheetBatch(events, {
      period: 'current_month',
      today: '2026-10-16',
    })
    expect(rows.map((row) => row.id)).toEqual(['b', 'c', 'd', 'e'])
  })

  it('próximas 4 a partir de hoje (inclusive)', () => {
    const rows = filterEventsForSignatureSheetBatch(events, {
      period: 'next_4',
      today: '2026-10-14',
    })
    expect(rows.map((row) => row.id)).toEqual(['c', 'd', 'e', 'f'])
  })

  it('intervalo customizado aceita datas invertidas', () => {
    const rows = filterEventsForSignatureSheetBatch(events, {
      period: 'custom',
      fromDate: '2026-10-28',
      toDate: '2026-10-07',
    })
    expect(rows.map((row) => row.id)).toEqual(['b', 'c', 'd', 'e'])
  })
})
