import { describe, expect, it } from 'vitest'
import {
  arePersonNamesSimilar,
  findSimilarNameMatches,
} from '@/lib/person-name-similarity'

describe('arePersonNamesSimilar', () => {
  it('detecta o mesmo nome com acentos e conectivos diferentes', () => {
    expect(
      arePersonNamesSimilar('Ósses de Toledo e Silva', 'Osses de Toledo é Silva'),
    ).toBe(true)
  })

  it('detecta nome abreviado contido no completo', () => {
    expect(
      arePersonNamesSimilar('Paulo Henrique', 'Paulo Henrique Cruz Andreotti'),
    ).toBe(true)
  })

  it('não confunde pessoas com primeiro nome diferente', () => {
    expect(arePersonNamesSimilar('Daniel Silva', 'Tiago Silva')).toBe(false)
  })

  it('não compara só pelo primeiro nome', () => {
    expect(arePersonNamesSimilar('José', 'José Reinaldo Fernandes')).toBe(false)
  })

  it('ignora nomes vazios', () => {
    expect(arePersonNamesSimilar('', 'Osses')).toBe(false)
    expect(arePersonNamesSimilar(null, 'Osses')).toBe(false)
  })
})

describe('findSimilarNameMatches', () => {
  it('retorna parecidos excluindo o próprio cadastro', () => {
    const target = { id: '1', full_name: 'Ósses de Toledo e Silva' }
    const matches = findSimilarNameMatches(target, [
      target,
      { id: '2', full_name: 'Osses de Toledo é Silva' },
      { id: '3', full_name: 'Tiago Zonta' },
    ])
    expect(matches.map((m) => m.id)).toEqual(['2'])
  })
})
