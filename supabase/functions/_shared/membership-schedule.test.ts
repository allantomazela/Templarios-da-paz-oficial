import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  buildAllMembershipSchedules,
  buildReminderAlerts,
  type Contribution,
} from './membership-schedule.ts'
import { inferMembershipSituation } from './membership-situation.ts'

const settings = {
  defaultAmount: 290,
  dueDay: 10,
  baseAmount: 200,
  sessionPackageAmount: 90,
}

function contribution(
  overrides: Partial<Contribution> & Pick<Contribution, 'brotherId' | 'month'>,
): Contribution {
  return {
    id: crypto.randomUUID(),
    year: 2026,
    amount: 290,
    status: 'Pago',
    ...overrides,
  }
}

describe('lembretes de mensalidade (edge)', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('afastado é cobrado pela base, não pelo valor cheio', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 1))

    const schedules = buildAllMembershipSchedules(
      [contribution({ brotherId: 'renato', month: 'Agosto', amount: 200 })],
      [
        {
          id: 'renato',
          full_name: 'Renato',
          created_at: '2026-08-15T12:00:00Z',
          membershipSituation: 'afastado',
        },
      ],
      {},
      settings,
    )

    const alerts = buildReminderAlerts(schedules, 'after', 0)
    expect(alerts).toHaveLength(1)
    expect(alerts[0]?.overdueAmount).toBe(200)
    expect(alerts[0]?.overdueLabels).toEqual(['Set/2026'])
  })

  it('irmão fora da lista de aprovados não gera meses novos', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 1))

    const schedules = buildAllMembershipSchedules(
      [contribution({ brotherId: 'allan', month: 'Agosto' })],
      [],
      {},
      settings,
    )

    expect(buildReminderAlerts(schedules, 'after', 0)).toHaveLength(0)
  })

  it('pendente lançado acima do esperado prevalece no saldo em aberto', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 1))

    const schedules = buildAllMembershipSchedules(
      [
        contribution({
          brotherId: 'a',
          month: 'Setembro',
          amount: 300,
          status: 'Pendente',
        }),
      ],
      [{ id: 'a', full_name: 'A', created_at: '2026-09-15T12:00:00Z' }],
      {},
      settings,
    )

    expect(buildReminderAlerts(schedules, 'after', 0)[0]?.overdueAmount).toBe(300)
  })
})

describe('inferMembershipSituation (edge)', () => {
  it('segue a mesma regra do app', () => {
    expect(inferMembershipSituation({ membership_situation: 'afastado' })).toBe('afastado')
    expect(inferMembershipSituation({ status: 'Inativo' })).toBe('desligado')
    expect(inferMembershipSituation({ regular_status: 'Afastado' })).toBe('afastado')
    expect(inferMembershipSituation(null)).toBe('regular')
  })
})
