import { describe, it, expect } from 'vitest'
import { cn, hexToHSL } from './utils'

describe('utils', () => {
  describe('cn', () => {
    it('deve mesclar classes corretamente', () => {
      expect(cn('foo', 'bar')).toBe('foo bar')
      expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
      expect(cn({ foo: true, bar: false })).toBe('foo')
    })

    it('deve resolver conflitos do Tailwind', () => {
      expect(cn('p-2', 'p-4')).toBe('p-4')
    })
  })

  describe('hexToHSL', () => {
    it('deve converter hex para HSL corretamente', () => {
      const result = hexToHSL('#007AFF')
      expect(result).toMatch(/\d+ \d+% \d+%/)
    })

    it('deve retornar valor padrão para hex inválido', () => {
      const result = hexToHSL('')
      expect(result).toBe('211 100% 50%')
    })

    it('deve lidar com hex shorthand', () => {
      const result = hexToHSL('#000')
      expect(result).toMatch(/\d+ \d+% \d+%/)
    })
  })
})

