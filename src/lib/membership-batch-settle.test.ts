import { describe, expect, it } from 'vitest'
import {
  buildBatchMensalidadeDescription,
  periodKey,
} from '@/lib/membership-batch-settle-format'

describe('membership-batch-settle', () => {
  it('monta descrição da tesouraria com vários meses', () => {
    const description = buildBatchMensalidadeDescription(
      'Claudinei Jose Machado',
      [
        { month: 3, year: 2026, amount: 290, periodLabel: 'Março/2026' },
        { month: 4, year: 2026, amount: 290, periodLabel: 'Abril/2026' },
      ],
      '2026-06-15',
    )
    expect(description).toContain('Claudinei Jose Machado')
    expect(description).toContain('Março/2026, Abril/2026')
    expect(description).toContain('2026-06-15')
  })

  it('gera chave estável por período', () => {
    expect(periodKey(2026, 3)).toBe('2026-3')
  })
})
