import { describe, expect, it } from 'vitest'
import { formatPersonName } from './person-name'

describe('formatPersonName', () => {
  it('converte caixa alta mantendo conectivos em minúsculo', () => {
    expect(formatPersonName('ALLAN TOMAZELA DE CAMARGO')).toBe('Allan Tomazela de Camargo')
    expect(formatPersonName('OSWALDO MELO DA ROCHA')).toBe('Oswaldo Melo da Rocha')
    expect(formatPersonName('JOAO DOS SANTOS E SILVA')).toBe('Joao dos Santos e Silva')
  })

  it('mantém maiúscula no conectivo quando é a primeira palavra', () => {
    expect(formatPersonName('DE OLIVEIRA DAS NEVES')).toBe('De Oliveira das Neves')
  })

  it('remove espaços duplos, das pontas e espaço não separável', () => {
    expect(formatPersonName('  ALLAN   TOMAZELA\u00A0DE  CAMARGO ')).toBe(
      'Allan Tomazela de Camargo',
    )
  })

  it('trata acentos, hífen e apóstrofo', () => {
    expect(formatPersonName('JOSÉ D\'ÁVILA ANA-MARIA ÇÉLIO')).toBe("José D'Ávila Ana-Maria Çélio")
  })

  it('corrige "é" isolado no meio do nome para o conectivo "e"', () => {
    expect(formatPersonName('Osses de Toledo é Silva')).toBe('Osses de Toledo e Silva')
  })

  it('retorna vazio para valores ausentes ou só com espaços', () => {
    expect(formatPersonName(null)).toBe('')
    expect(formatPersonName(undefined)).toBe('')
    expect(formatPersonName('   ')).toBe('')
  })
})
