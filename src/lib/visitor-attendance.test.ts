import { describe, expect, it } from 'vitest'
import {
  formatLodgeNameWithPrefix,
  normalizeVisitorAttendanceInput,
  stripLodgeNamePrefix,
  validateVisitorAttendanceInput,
} from './visitor-attendance'

describe('visitor-attendance validation', () => {
  it('adds masonic lodge prefix on normalize', () => {
    const normalized = normalizeVisitorAttendanceInput({
      name: 'Joao',
      degree: 'Mestre',
      lodge: 'Templarios da Paz',
      lodgeNumber: '123',
      obedience: 'GOB',
      masonicNumber: '',
    })
    expect(normalized.lodge).toBe('A∴ R∴ L∴ S∴ Templarios da Paz')
  })

  it('strips duplicate lodge prefix before re-applying', () => {
    expect(stripLodgeNamePrefix('A∴ R∴ L∴ S∴ Harmonia')).toBe('Harmonia')
    expect(formatLodgeNameWithPrefix('A∴ R∴ L∴ S∴ Harmonia')).toBe(
      'A∴ R∴ L∴ S∴ Harmonia',
    )
  })

  it('validates a correct visitor input', () => {
    const input = {
      name: 'Joao da Silva',
      degree: 'Mestre',
      lodge: 'Loja Harmonia',
      lodgeNumber: '123',
      obedience: 'GOB',
      masonicNumber: '456-1',
    }
    const normalized = normalizeVisitorAttendanceInput(input)
    const errors = validateVisitorAttendanceInput(normalized)
    expect(errors).toHaveLength(0)
  })

  it('rejects missing required fields', () => {
    const input = {
      name: 'Jo',
      degree: 'Mestre',
      lodge: '',
      lodgeNumber: 'ABC',
      obedience: '',
      masonicNumber: '',
    }
    const normalized = normalizeVisitorAttendanceInput(input)
    const errors = validateVisitorAttendanceInput(normalized)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('rejects invalid lodge numbers', () => {
    const input = {
      name: 'Carlos Souza',
      degree: 'Companheiro',
      lodge: 'Loja Central',
      lodgeNumber: '12A',
      obedience: 'GOB',
      masonicNumber: '123',
    }
    const normalized = normalizeVisitorAttendanceInput(input)
    const errors = validateVisitorAttendanceInput(normalized)
    expect(errors).toContain('Numero da loja deve conter apenas digitos.')
  })

  it('rejects invalid masonic numbers', () => {
    const input = {
      name: 'Marcos Oliveira',
      degree: 'Aprendiz',
      lodge: 'Loja Luz',
      lodgeNumber: '789',
      obedience: 'GLESP',
      masonicNumber: 'ABC-123',
    }
    const normalized = normalizeVisitorAttendanceInput(input)
    const errors = validateVisitorAttendanceInput(normalized)
    expect(errors).toContain(
      'Registro maconico deve conter apenas numeros, ponto ou hifen.',
    )
  })
})
