import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  buildAllMembershipSchedules,
  type Contribution,
} from '../_shared/membership-schedule.ts'
import {
  buildReminderRecipients,
  selectReminderAlerts,
} from './reminder-selection.ts'

const settings = {
  defaultAmount: 290,
  dueDay: 10,
  baseAmount: 200,
  sessionPackageAmount: 90,
}

function paid(brotherId: string, month: string): Contribution {
  return { id: crypto.randomUUID(), brotherId, month, year: 2026, amount: 290, status: 'Pago' }
}

function overdueSchedules() {
  return buildAllMembershipSchedules(
    [paid('a', 'Agosto'), paid('b', 'Setembro')],
    [
      { id: 'a', full_name: 'Irmão A', created_at: '2026-08-15T12:00:00Z' },
      { id: 'b', full_name: 'Irmão B', created_at: '2026-09-15T12:00:00Z' },
    ],
    {},
    settings,
  )
}

describe('seleção de lembretes', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('manual alcança todos em atraso, independentemente de momento/dias', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 1))

    const alerts = selectReminderAlerts(
      overdueSchedules(),
      new Set(['a', 'b']),
      'manual',
      'before',
      3,
    )

    expect(alerts.map((a) => a.brotherId)).toEqual(['a'])
    expect(alerts[0]?.overdueLabels).toEqual(['Set/2026'])
  })

  it('automático respeita momento/dias configurados', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 1))

    const alerts = selectReminderAlerts(
      overdueSchedules(),
      new Set(['a', 'b']),
      'cron',
      'before',
      3,
    )

    expect(alerts).toHaveLength(0)
  })

  it('ignora quem não está aprovado', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 1))

    const alerts = selectReminderAlerts(
      overdueSchedules(),
      new Set(['b']),
      'manual',
      'after',
      0,
    )

    expect(alerts).toHaveLength(0)
  })

  it('marca quem já recebeu no mês e normaliza o e-mail', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 1))

    const alerts = selectReminderAlerts(
      overdueSchedules(),
      new Set(['a', 'b']),
      'manual',
      'after',
      0,
    )
    const recipients = buildReminderRecipients(
      alerts,
      new Map([['a', { fullName: ' Irmão A ', email: ' A@Mail.com ' }]]),
      new Set(['a']),
    )

    expect(recipients[0]).toMatchObject({
      brotherName: 'Irmão A',
      email: 'a@mail.com',
      overdueAmount: 290,
      alreadyRemindedThisMonth: true,
    })
  })
})
