import { describe, expect, it } from 'vitest'
import {
  createDefaultTransactionListFilters,
  filterTransactions,
  matchesMembershipLinkFilter,
  matchesTransactionBrother,
  matchesTransactionPeriod,
  matchesTransactionSearch,
} from '@/lib/transaction-list-filters'
import type { Transaction } from '@/lib/data'

const sample: Transaction[] = [
  {
    id: '1',
    date: '2026-06-15',
    description: 'Mensalidade - Carlos Silva (06/2026)',
    category: 'Mensalidade',
    type: 'Receita',
    amount: 290,
    accountId: 'acc-1',
  },
  {
    id: '2',
    date: '2026-05-10',
    description: 'Material de escritório',
    category: 'Administrativo',
    type: 'Despesa',
    amount: 120,
    accountId: 'acc-1',
  },
]

describe('transaction-list-filters', () => {
  it('filtra por mês e ano', () => {
    const filters = createDefaultTransactionListFilters(new Date('2026-06-01'))
    filters.periodMode = 'month'
    filters.filterMonth = 6
    filters.filterYear = 2026

    const result = filterTransactions(sample, filters, { 'acc-1': 'Caixa' })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })

  it('filtra por irmão na descrição', () => {
    expect(
      matchesTransactionBrother(
        'Mensalidade - Carlos Silva (06/2026)',
        'Carlos Silva',
      ),
    ).toBe(true)
    expect(
      matchesTransactionBrother('Material de escritório', 'Carlos Silva'),
    ).toBe(false)
  })

  it('busca por conta e valor', () => {
    expect(
      matchesTransactionSearch(sample[0], 'caixa', { 'acc-1': 'Caixa Stone' }),
    ).toBe(true)
    expect(matchesTransactionSearch(sample[0], '290', {})).toBe(true)
  })

  it('filtra por dia específico', () => {
    expect(
      matchesTransactionPeriod('2026-06-15', {
        periodMode: 'day',
        filterDate: '2026-06-15',
        filterMonth: 6,
        filterYear: 2026,
      }),
    ).toBe(true)
    expect(
      matchesTransactionPeriod('2026-06-16', {
        periodMode: 'day',
        filterDate: '2026-06-15',
        filterMonth: 6,
        filterYear: 2026,
      }),
    ).toBe(false)
  })

  it('filtra receitas de mensalidade sem vínculo no cronograma', () => {
    const linked = new Set(['1'])
    const filters = createDefaultTransactionListFilters()
    filters.membershipLinkStatus = 'unlinked'

    const result = filterTransactions(sample, filters, { 'acc-1': 'Caixa' }, linked)
    expect(result).toHaveLength(0)

    expect(
      matchesMembershipLinkFilter(
        {
          id: '3',
          date: '2026-06-20',
          description: 'Mensalidade - Ana Costa',
          category: 'Mensalidade',
          type: 'Receita',
          amount: 150,
          accountId: 'acc-1',
        },
        'unlinked',
        linked,
      ),
    ).toBe(true)
  })
})
