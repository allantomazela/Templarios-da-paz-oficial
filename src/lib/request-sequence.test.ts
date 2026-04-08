import { describe, it, expect } from 'vitest'
import { createRequestSequence } from '@/lib/request-sequence'

describe('createRequestSequence', () => {
  it('incrementa ids e marca somente o ultimo como current', () => {
    const s = createRequestSequence()
    const a = s.next()
    const b = s.next()
    expect(a).toBe(1)
    expect(b).toBe(2)
    expect(s.isCurrent(a)).toBe(false)
    expect(s.isCurrent(b)).toBe(true)
  })

  it('instancias independentes nao interferem entre si', () => {
    const s1 = createRequestSequence()
    const s2 = createRequestSequence()
    expect(s1.next()).toBe(1)
    expect(s2.next()).toBe(1)
    expect(s1.isCurrent(1)).toBe(true)
    expect(s2.isCurrent(1)).toBe(true)
  })
})
