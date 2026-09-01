import { describe, expect, it } from 'vitest'
import {
  isControlOnlyTransaction,
  isTreasuryTransaction,
} from '@/lib/transaction-control-only'

describe('transaction-control-only', () => {
  it('identifica despesa somente controle', () => {
    expect(
      isControlOnlyTransaction({
        controlOnly: true,
      }),
    ).toBe(true)
  })

  it('identifica receita somente controle', () => {
    expect(
      isControlOnlyTransaction({
        controlOnly: true,
      }),
    ).toBe(true)
  })

  it('não marca lançamento normal como somente controle', () => {
    expect(
      isControlOnlyTransaction({
        controlOnly: false,
      }),
    ).toBe(false)
  })

  it('exclui somente controle da tesouraria', () => {
    expect(
      isTreasuryTransaction({
        type: 'Despesa',
        controlOnly: true,
      }),
    ).toBe(false)
    expect(
      isTreasuryTransaction({
        type: 'Receita',
        controlOnly: true,
      }),
    ).toBe(false)
    expect(
      isTreasuryTransaction({
        type: 'Despesa',
        controlOnly: false,
      }),
    ).toBe(true)
  })
})
