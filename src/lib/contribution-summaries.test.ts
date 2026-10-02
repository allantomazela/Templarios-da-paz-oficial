import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Contribution } from '@/lib/data'
import { buildBrotherSummaries } from './contribution-summaries'
import { buildMensalidadeDescription, mapContributionRow } from './contribution-mappers'
import { monthNameToNumber, monthNumberToName } from './contribution-months'

function contribution(overrides: Partial<Contribution>): Contribution {
  return {
    id: overrides.id ?? 'c',
    brotherId: 'b1',
    month: 'Outubro',
    year: 2026,
    amount: 290,
    status: 'Pendente',
    ...overrides,
  }
}

describe('buildBrotherSummaries', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 2))
  })
  afterEach(() => vi.useRealTimers())

  it('soma pagos e pendentes e aponta o último pagamento', () => {
    const [summary] = buildBrotherSummaries(
      [
        contribution({ id: '1', month: 'Agosto', status: 'Pago', paymentDate: '2026-08-05' }),
        contribution({ id: '2', month: 'Setembro', status: 'Pago', paymentDate: '2026-09-07' }),
        contribution({ id: '3', month: 'Outubro', status: 'Pendente' }),
        contribution({ id: '4', month: 'Julho', status: 'Atrasado' }),
      ],
      { b1: 'Carlos' },
      [],
    )

    expect(summary).toMatchObject({
      brotherName: 'Carlos',
      totalPaid: 580,
      totalPending: 580,
      paidCount: 2,
      pendingCount: 1,
      overdueCount: 1,
      currentStatus: 'upcoming',
      lastPaymentDate: '2026-09-07',
    })
  })

  it('classifica o mês corrente como pago, em atraso manual ou sem lançamento', () => {
    const summaries = buildBrotherSummaries(
      [
        contribution({ id: 'p', brotherId: 'paid', status: 'Pago' }),
        contribution({ id: 'o', brotherId: 'late', status: 'Atrasado' }),
      ],
      {},
      [
        { id: 'paid', full_name: 'Ana' },
        { id: 'late', full_name: 'Bruno' },
        { id: 'none', full_name: 'Caio' },
      ],
    )

    expect(summaries.map((s) => [s.brotherName, s.currentStatus])).toEqual([
      ['Ana', 'paid'],
      ['Bruno', 'overdue'],
      ['Caio', 'none'],
    ])
  })
})

describe('mapeamento de mensalidades', () => {
  it('converte mês entre nome e número', () => {
    expect(monthNameToNumber('Março')).toBe(3)
    expect(monthNumberToName(12)).toBe('Dezembro')
    expect(monthNumberToName(13)).toBe('13')
  })

  it('monta a descrição da receita com e sem data de pagamento', () => {
    expect(buildMensalidadeDescription(' Renan ', 7, 2026)).toBe(
      'Mensalidade - Renan (07/2026)',
    )
    expect(buildMensalidadeDescription('', 7, 2026, '2026-07-05')).toBe(
      'Mensalidade - Irmão (07/2026) - 2026-07-05',
    )
  })

  it('mapeia a linha do banco para o modelo da tela', () => {
    expect(
      mapContributionRow({
        id: 'c1',
        brother_id: 'b1',
        month: 6,
        year: 2026,
        amount: 290,
        status: 'Pago',
        payment_date: '2026-06-05',
        transaction_id: 'tx',
        account_id: null,
        notes: null,
        profiles: { id: 'b1', full_name: 'Pedro' },
      }),
    ).toEqual({
      id: 'c1',
      brotherId: 'b1',
      brotherName: 'Pedro',
      month: 'Junho',
      year: 2026,
      amount: 290,
      status: 'Pago',
      paymentDate: '2026-06-05',
      accountId: undefined,
      transactionId: 'tx',
      notes: undefined,
    })
  })
})
