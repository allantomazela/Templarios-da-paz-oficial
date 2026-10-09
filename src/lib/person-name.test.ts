import { describe, expect, it } from 'vitest'
import { formatPersonName } from './person-name'
import { PERSON_NAME_CASES } from './person-name.cases'

describe('formatPersonName', () => {
  it.each(PERSON_NAME_CASES)('formata "$input" como "$expected"', ({ input, expected }) => {
    expect(formatPersonName(input)).toBe(expected)
  })

  it('retorna vazio para valores ausentes', () => {
    expect(formatPersonName(null)).toBe('')
    expect(formatPersonName(undefined)).toBe('')
  })
})
