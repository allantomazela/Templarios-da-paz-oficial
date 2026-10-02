import { describe, expect, it } from 'vitest'
import {
  getMembershipAmountReduction,
  getMembershipAmountWarning,
} from '@/lib/membership-amount-check'

describe('getMembershipAmountWarning', () => {
  it('não avisa quando o valor é o esperado', () => {
    expect(getMembershipAmountWarning(290, 290)).toBeNull()
  })

  it('avisa excedente (ex.: mensalidade + lanche)', () => {
    const warning = getMembershipAmountWarning(311, 290)
    expect(warning?.kind).toBe('above')
    expect(warning?.difference).toBe(21)
  })

  it('avisa valor abaixo (ex.: só o lanche)', () => {
    const warning = getMembershipAmountWarning(42, 290)
    expect(warning?.kind).toBe('below')
    expect(warning?.difference).toBe(-248)
  })

  it('ignora valores inválidos ou vazios', () => {
    expect(getMembershipAmountWarning(0, 290)).toBeNull()
    expect(getMembershipAmountWarning(Number.NaN, 290)).toBeNull()
    expect(getMembershipAmountWarning(290, 0)).toBeNull()
  })
})

describe('getMembershipAmountReduction', () => {
  it('detecta mensalidade trocada pelo valor do lanche', () => {
    expect(getMembershipAmountReduction(290, 21, 290)).toEqual({
      previousAmount: 290,
      newAmount: 21,
      missingAmount: 269,
    })
  })

  it('não pede confirmação ao corrigir excedente para o valor esperado', () => {
    expect(getMembershipAmountReduction(311, 290, 290)).toBeNull()
  })

  it('não pede confirmação ao ajustar para o valor de afastado', () => {
    expect(getMembershipAmountReduction(290, 200, 200)).toBeNull()
  })

  it('não pede confirmação quando o valor aumenta ou se mantém', () => {
    expect(getMembershipAmountReduction(21, 290, 290)).toBeNull()
    expect(getMembershipAmountReduction(150, 150, 290)).toBeNull()
  })

  it('ignora valores inválidos', () => {
    expect(getMembershipAmountReduction(290, 0, 290)).toBeNull()
    expect(getMembershipAmountReduction(Number.NaN, 21, 290)).toBeNull()
    expect(getMembershipAmountReduction(290, 21, 0)).toBeNull()
  })
})
