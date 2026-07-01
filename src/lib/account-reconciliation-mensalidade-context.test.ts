import { describe, expect, it } from 'vitest'
import type { Transaction } from '@/lib/data'
import {
  buildMensalidadeLinkContext,
  classifySameMonthMensalidadeGroup,
  parseReferencePeriodsFromDescription,
} from '@/lib/account-reconciliation-mensalidade-context'
import { findSameMonthMensalidadeGroups } from '@/lib/account-reconciliation'

describe('account-reconciliation-mensalidade-context', () => {
  it('extrai referência MM/AAAA da descrição', () => {
    const periods = parseReferencePeriodsFromDescription(
      'Mensalidade - RENAN (07/2026) - 2026-06-30',
    )
    expect(periods).toEqual([{ month: 7, year: 2026, label: '07/2026' }])
  })

  it('extrai várias referências de quitação em lote', () => {
    const periods = parseReferencePeriodsFromDescription(
      'Mensalidade - Irmão (Março/2026, Abril/2026) - 2026-06-15',
    )
    expect(periods.map((p) => p.label)).toEqual(['03/2026', '04/2026'])
  })

  it('classifica irmãos diferentes como informativo', () => {
    const transactions: Transaction[] = [
      {
        id: 'tx-carlos',
        date: '2026-06-05',
        description: 'Mensalidade - Carlos (06/2026)',
        category: 'Mensalidade',
        type: 'Receita',
        amount: 290,
        accountId: 'itau',
      },
      {
        id: 'tx-renan',
        date: '2026-06-20',
        description: 'Mensalidade - RENAN (07/2026)',
        category: 'Mensalidade',
        type: 'Receita',
        amount: 290,
        accountId: 'itau',
      },
    ]

    const groups = findSameMonthMensalidadeGroups(transactions)
    expect(groups).toHaveLength(1)

    const linkContext = buildMensalidadeLinkContext([
      {
        transaction_id: 'tx-carlos',
        brother_id: 'brother-carlos',
        month: 6,
        year: 2026,
        profiles: { full_name: 'Carlos' },
      },
      {
        transaction_id: 'tx-renan',
        brother_id: 'brother-renan',
        month: 7,
        year: 2026,
        profiles: { full_name: 'RENAN' },
      },
    ])

    const enriched = classifySameMonthMensalidadeGroup(groups[0], linkContext)
    expect(enriched.kind).toBe('different_brothers')
    expect(enriched.contextLabel).toContain('Irmãos diferentes')
  })

  it('classifica atraso do mesmo irmão para revisão', () => {
    const transactions: Transaction[] = [
      {
        id: 'tx-fev',
        date: '2026-03-05',
        description: 'Mensalidade - João (02/2026)',
        category: 'Mensalidade',
        type: 'Receita',
        amount: 290,
        accountId: 'itau',
      },
      {
        id: 'tx-mar',
        date: '2026-03-20',
        description: 'Mensalidade - João (03/2026)',
        category: 'Mensalidade',
        type: 'Receita',
        amount: 290,
        accountId: 'itau',
      },
    ]

    const groups = findSameMonthMensalidadeGroups(transactions)
    const linkContext = buildMensalidadeLinkContext([
      {
        transaction_id: 'tx-fev',
        brother_id: 'brother-joao',
        month: 2,
        year: 2026,
        profiles: { full_name: 'João' },
      },
      {
        transaction_id: 'tx-mar',
        brother_id: 'brother-joao',
        month: 3,
        year: 2026,
        profiles: { full_name: 'João' },
      },
    ])

    const enriched = classifySameMonthMensalidadeGroup(groups[0], linkContext)
    expect(enriched.kind).toBe('late_same_brother')
  })

  it('classifica mesma referência duplicada como erro', () => {
    const transactions: Transaction[] = [
      {
        id: 'tx-1',
        date: '2026-06-05',
        description: 'Mensalidade - João (07/2026)',
        category: 'Mensalidade',
        type: 'Receita',
        amount: 290,
        accountId: 'itau',
      },
      {
        id: 'tx-2',
        date: '2026-06-20',
        description: 'Mensalidade - João (07/2026)',
        category: 'Mensalidade',
        type: 'Receita',
        amount: 290,
        accountId: 'itau',
      },
    ]

    const groups = findSameMonthMensalidadeGroups(transactions)
    const linkContext = buildMensalidadeLinkContext([
      {
        transaction_id: 'tx-1',
        brother_id: 'brother-joao',
        month: 7,
        year: 2026,
        profiles: { full_name: 'João' },
      },
      {
        transaction_id: 'tx-2',
        brother_id: 'brother-joao',
        month: 7,
        year: 2026,
        profiles: { full_name: 'João' },
      },
    ])

    const enriched = classifySameMonthMensalidadeGroup(groups[0], linkContext)
    expect(enriched.kind).toBe('duplicate_same_reference')
  })
})
