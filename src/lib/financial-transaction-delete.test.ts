import { describe, expect, it } from 'vitest'
import { unpaidStatusForReferenceMonth } from '@/lib/financial-transaction-delete'

describe('financial-transaction-delete', () => {
  it('marca meses passados como Atrasado', () => {
    const now = new Date()
    const pastMonth = now.getMonth() === 0 ? 12 : now.getMonth()
    const pastYear =
      now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()

    expect(unpaidStatusForReferenceMonth(pastMonth, pastYear)).toBe('Atrasado')
  })

  it('marca mês corrente e futuro como Pendente', () => {
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    expect(unpaidStatusForReferenceMonth(currentMonth, currentYear)).toBe('Pendente')
    expect(unpaidStatusForReferenceMonth(12, currentYear + 1)).toBe('Pendente')
  })
})
