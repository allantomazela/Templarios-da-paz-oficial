import { describe, expect, it } from 'vitest'
import { getMembershipAmountWarning } from '@/lib/membership-amount-check'

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
