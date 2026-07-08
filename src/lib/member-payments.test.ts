import { describe, expect, it } from 'vitest'
import { mapContributionStatusToMemberPayment } from '@/lib/member-payments'

describe('mapContributionStatusToMemberPayment', () => {
  // Referência fixa: 15/07/2026 (meio do mês de julho).
  const reference = new Date(2026, 6, 15, 12, 0, 0)

  it('marca Pago como paid', () => {
    expect(
      mapContributionStatusToMemberPayment('Pago', 2026, 7, reference),
    ).toBe('paid')
  })

  it('marca Atrasado do banco como overdue', () => {
    expect(
      mapContributionStatusToMemberPayment('Atrasado', 2026, 6, reference),
    ).toBe('overdue')
  })

  it('mês corrente pendente fica à vencer (pode pagar em qualquer dia do mês)', () => {
    expect(
      mapContributionStatusToMemberPayment('Pendente', 2026, 7, reference),
    ).toBe('pending')
  })

  it('mês fechado sem pagamento fica em atraso', () => {
    expect(
      mapContributionStatusToMemberPayment('Pendente', 2026, 6, reference),
    ).toBe('overdue')
  })

  it('mês futuro pendente permanece à vencer', () => {
    expect(
      mapContributionStatusToMemberPayment('Pendente', 2026, 8, reference),
    ).toBe('pending')
  })
})
