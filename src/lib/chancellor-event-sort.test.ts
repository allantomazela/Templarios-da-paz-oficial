import { describe, expect, it } from 'vitest'
import type { Event } from '@/lib/data'
import { compareChancellorEventsByDateAsc } from '@/lib/chancellor-event-sort'

const event = (id: string, date: string, time = '19:30'): Event => ({
  id,
  title: id,
  date,
  time,
  type: 'Sessão',
  location: 'Templo',
  description: '',
  attendees: 0,
})

describe('compareChancellorEventsByDateAsc', () => {
  it('ordena da menor para a maior data', () => {
    const items = [event('b', '2026-06-10'), event('a', '2026-06-01'), event('c', '2026-06-20')]
    items.sort(compareChancellorEventsByDateAsc)
    expect(items.map((item) => item.id)).toEqual(['a', 'b', 'c'])
  })

  it('desempata pelo horário no mesmo dia', () => {
    const items = [event('tarde', '2026-06-01', '20:00'), event('noite', '2026-06-01', '21:00')]
    items.sort(compareChancellorEventsByDateAsc)
    expect(items.map((item) => item.id)).toEqual(['tarde', 'noite'])
  })
})
