import { describe, expect, it } from 'vitest'
import {
  CHANCELLOR_DATA_LOOKBACK_YEARS,
  chunkArray,
  getChancellorLookbackSinceIso,
} from '@/lib/chancellor-query-limits'

describe('chancellor-query-limits', () => {
  it('calcula data de corte com lookback em anos', () => {
    expect(getChancellorLookbackSinceIso(new Date(2026, 6, 9))).toBe('2021-07-09')
    expect(CHANCELLOR_DATA_LOOKBACK_YEARS).toBe(5)
  })

  it('divide arrays em chunks para consultas .in()', () => {
    expect(chunkArray([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
    expect(chunkArray([], 10)).toEqual([])
  })
})
