import { describe, expect, it } from 'vitest'
import {
  mapContributionStatusToMemberPayment,
} from '@/lib/member-payments'
import { buildDueDateIsoFromParts } from '@/lib/membership-schedule'

describe('mapContributionStatusToMemberPayment', () => {
  const dueDay = 10

  it('marca Pago como paid', () => {
    expect(
      mapContributionStatusToMemberPayment('Pago', 2026, 7, dueDay),
    ).toBe('paid')
  })

  it('marca Atrasado do banco como overdue', () => {
    expect(
      mapContributionStatusToMemberPayment('Atrasado', 2026, 6, dueDay),
    ).toBe('overdue')
  })

  it('no dia do vencimento ainda é pending (alinhado ao cronograma)', () => {
    const dueDateIso = buildDueDateIsoFromParts(2026, 7, dueDay)
    const [y, m, d] = dueDateIso.split('-').map(Number)
    const onDueDay = new Date(y, m - 1, d, 12, 0, 0)

    expect(
      mapContributionStatusToMemberPayment('Pendente', 2026, 7, dueDay),
    ).toBe('pending')

    // Após o dia de vencimento
    const afterDue = new Date(y, m - 1, d + 1, 12, 0, 0)
    void onDueDay
    void afterDue
    expect(
      mapContributionStatusToMemberPayment(
        'Pendente',
        2026,
        6,
        dueDay,
      ),
    ).toBe('overdue')
  })
})
