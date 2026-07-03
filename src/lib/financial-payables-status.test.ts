import { describe, expect, it } from 'vitest'
import {
  resolvePayableStatus,
  shouldSendPayableReminder,
} from './financial-payables-status'

describe('resolvePayableStatus', () => {
  const today = new Date(2026, 6, 3)

  it('mantém Pago e Cancelado', () => {
    expect(resolvePayableStatus('2026-01-01', 'Pago', today)).toBe('Pago')
    expect(resolvePayableStatus('2026-12-01', 'Cancelado', today)).toBe('Cancelado')
  })

  it('marca atraso quando vencimento passou', () => {
    expect(resolvePayableStatus('2026-06-01', 'Pendente', today)).toBe('Atrasado')
  })

  it('mantém pendente para vencimento futuro', () => {
    expect(resolvePayableStatus('2026-07-20', 'Pendente', today)).toBe('Pendente')
  })
})

describe('shouldSendPayableReminder', () => {
  const today = new Date(2026, 6, 3)

  it('before: dentro da janela de antecedência', () => {
    expect(shouldSendPayableReminder('2026-07-05', 'before', 3, today)).toBe(true)
    expect(shouldSendPayableReminder('2026-07-10', 'before', 3, today)).toBe(false)
  })

  it('on_due: apenas no dia', () => {
    expect(shouldSendPayableReminder('2026-07-03', 'on_due', 0, today)).toBe(true)
    expect(shouldSendPayableReminder('2026-07-04', 'on_due', 0, today)).toBe(false)
  })

  it('after: dias após vencimento', () => {
    expect(shouldSendPayableReminder('2026-06-30', 'after', 3, today)).toBe(true)
    expect(shouldSendPayableReminder('2026-07-02', 'after', 3, today)).toBe(false)
  })
})
