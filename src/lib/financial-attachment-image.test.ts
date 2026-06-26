import { describe, expect, it } from 'vitest'
import {
  shouldCompressImage,
  COMPRESS_THRESHOLD_BYTES,
  MAX_IMAGE_DIMENSION,
} from '@/lib/financial-attachment-image'

describe('financial-attachment-image', () => {
  it('comprime imagens grandes ou com resolução alta', () => {
    expect(shouldCompressImage(COMPRESS_THRESHOLD_BYTES + 1, 1200)).toBe(true)
    expect(shouldCompressImage(100_000, MAX_IMAGE_DIMENSION + 1)).toBe(true)
  })

  it('mantém imagens pequenas sem compressão', () => {
    expect(shouldCompressImage(200_000, 1600)).toBe(false)
  })
})
