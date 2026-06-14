import { describe, expect, it } from 'vitest'
import { splitInstallmentAmounts } from '@/lib/ceremony-payment-types'

describe('ceremony-payment-types', () => {
  it('divide valor total em parcelas com ajuste na última', () => {
    expect(splitInstallmentAmounts(580, 2)).toEqual([290, 290])
    expect(splitInstallmentAmounts(100, 3)).toEqual([33.33, 33.33, 33.34])
  })

  it('retorna valor único para uma parcela', () => {
    expect(splitInstallmentAmounts(150, 1)).toEqual([150])
  })
})
