import { describe, expect, it } from 'vitest'
import {
  isControlOnlyTransaction,
  isTreasuryTransaction,
} from '@/lib/transaction-control-only'

describe('transaction-control-only', () => {
  it('identifica despesa somente controle', () => {
    expect(
      isControlOnlyTransaction({
        type: 'Despesa',
        controlOnly: true,
      }),
    ).toBe(true)
  })

  it('receita nunca é somente controle', () => {
    expect(
      isControlOnlyTransaction({
        type: 'Receita',
        controlOnly: true,
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
        type: 'Despesa',
        controlOnly: false,
      }),
    ).toBe(true)
  })
})
