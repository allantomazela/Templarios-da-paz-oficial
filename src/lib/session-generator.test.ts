import { describe, expect, it } from 'vitest'
import {
  generateSessionDates,
  getNthWeekdayOfMonth,
  getExistingSessionWeekKeys,
  partitionGeneratedSessions,
  parseSessionWeeksOfMonth,
} from '@/lib/session-generator'
import type { Event } from '@/lib/data'

describe('getNthWeekdayOfMonth', () => {
  it('retorna a 1ª quinta-feira de julho/2026', () => {
    const date = getNthWeekdayOfMonth(2026, 7, 4, 1)
    expect(date).not.toBeNull()
    expect(date!.getFullYear()).toBe(2026)
    expect(date!.getMonth()).toBe(6)
    expect(date!.getDate()).toBe(2)
  })

  it('retorna null quando a ocorrência não existe no mês', () => {
    expect(getNthWeekdayOfMonth(2026, 2, 6, 5)).toBeNull()
  })
})

describe('generateSessionDates', () => {
  it('gera 1ª, 3ª e 4ª semanas por mês durante 12 meses', () => {
    const dates = generateSessionDates(
      {
        weekday: 4,
        weeksOfMonth: [1, 3, 4],
        monthsAhead: 12,
      },
      { startFrom: new Date(2026, 6, 1), skipPastDates: false },
    )

    const julyDates = dates.filter((d) => d.date.startsWith('2026-07'))
    expect(julyDates.map((d) => d.date)).toEqual(['2026-07-02', '2026-07-16', '2026-07-23'])
    expect(dates.length).toBe(36)
  })

  it('ignora datas passadas no mês inicial', () => {
    const dates = generateSessionDates(
      {
        weekday: 4,
        weeksOfMonth: [1, 3, 4],
        monthsAhead: 2,
      },
      { startFrom: new Date(2026, 6, 10), skipPastDates: true },
    )

    expect(dates.some((d) => d.date === '2026-07-02')).toBe(false)
    expect(dates.some((d) => d.date === '2026-07-16')).toBe(true)
  })
})

describe('parseSessionWeeksOfMonth', () => {
  it('usa padrão quando valor inválido', () => {
    expect(parseSessionWeeksOfMonth(null)).toEqual([1, 3, 4])
    expect(parseSessionWeeksOfMonth(['x', 2])).toEqual([2])
  })
})

describe('partitionGeneratedSessions', () => {
  it('separa novas sessões de conflitos por data exata', () => {
    const generated = [
      { date: '2026-07-01', weekOfMonth: 1 },
      { date: '2026-07-15', weekOfMonth: 3 },
    ]
    const existing = getExistingSessionWeekKeys([
      { id: '1', title: 'S', date: '2026-07-01', time: '20:00', type: 'Sessão' } as Event,
    ])
    const { newSessions, conflicts } = partitionGeneratedSessions(generated, existing)
    expect(conflicts).toHaveLength(1)
    expect(newSessions).toHaveLength(1)
    expect(newSessions[0].date).toBe('2026-07-15')
  })

  it('trata como conflito uma sessão na mesma semana, mesmo em outro dia', () => {
    // Quarta 2026-08-05 já existe; quinta 2026-08-06 cai na mesma semana ISO.
    const generated = [{ date: '2026-08-06', weekOfMonth: 1 }]
    const existing = getExistingSessionWeekKeys([
      { id: '1', title: 'S', date: '2026-08-05', time: '20:00', type: 'Sessão' } as Event,
    ])
    const { newSessions, conflicts } = partitionGeneratedSessions(generated, existing)
    expect(newSessions).toHaveLength(0)
    expect(conflicts).toHaveLength(1)
  })
})
