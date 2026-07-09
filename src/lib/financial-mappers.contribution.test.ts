import { describe, expect, it } from 'vitest'
import {
  mapContributionFromDB,
  mapContributionToDB,
} from '@/lib/financial-mappers'

describe('mapContributionFromDB', () => {
  it('converte month INTEGER do banco para nome do mês usado no cronograma', () => {
    const mapped = mapContributionFromDB({
      id: 'c1',
      brother_id: 'b1',
      month: 6,
      year: 2026,
      amount: 290,
      status: 'Pago',
      payment_date: '2026-06-10',
      transaction_id: 't1',
      account_id: 'a1',
      notes: 'ok',
    })

    expect(mapped.month).toBe('Junho')
    expect(mapped.brotherId).toBe('b1')
    expect(mapped.transactionId).toBe('t1')
    expect(mapped.accountId).toBe('a1')
    expect(mapped.notes).toBe('ok')
  })

  it('preserva month já em nome quando vier como string', () => {
    const mapped = mapContributionFromDB({
      id: 'c2',
      brother_id: 'b1',
      month: 'Julho',
      year: 2026,
      amount: 290,
      status: 'Pendente',
    })

    expect(mapped.month).toBe('Julho')
  })
})

describe('mapContributionToDB', () => {
  it('converte nome do mês de volta para INTEGER ao gravar', () => {
    const db = mapContributionToDB({
      brotherId: 'b1',
      month: 'Junho',
      year: 2026,
      amount: 290,
      status: 'Pago',
      paymentDate: '2026-06-10',
      transactionId: 't1',
      accountId: 'a1',
      notes: 'ok',
    })

    expect(db.month).toBe(6)
    expect(db.brother_id).toBe('b1')
    expect(db.transaction_id).toBe('t1')
    expect(db.account_id).toBe('a1')
  })
})
