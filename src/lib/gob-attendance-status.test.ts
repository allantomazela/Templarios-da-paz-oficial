import { describe, expect, it } from 'vitest'
import { gobAttendanceStatusLetter } from '@/lib/gob-attendance-status'

describe('gobAttendanceStatusLetter', () => {
  it('mapeia os status registrados', () => {
    expect(gobAttendanceStatusLetter('Presente')).toBe('P')
    expect(gobAttendanceStatusLetter('Ausente')).toBe('A')
    expect(gobAttendanceStatusLetter('Justificado')).toBe('J')
  })

  it('sessão sem registro não aparece como justificada', () => {
    expect(gobAttendanceStatusLetter('Pendente')).toBe('—')
  })
})
