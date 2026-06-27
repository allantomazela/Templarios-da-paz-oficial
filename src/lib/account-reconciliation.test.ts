import { describe, expect, it } from 'vitest'
import type { BankAccount, Transaction } from '@/lib/data'
import {
  buildAccountReconciliationDetails,
  buildReconciliationAudit,
  computeSuggestedInitialBalance,
  computeTransactionBalanceImpact,
  enrichWithRealBalance,
  findDuplicateTransactionGroups,
  findSameMonthMensalidadeGroups,
  filterAcknowledgedAudit,
} from '@/lib/account-reconciliation'

const account: BankAccount = {
  id: 'stone',
  name: 'Stone',
  type: 'Corrente',
  initialBalance: 1000,
}

const transactions: Transaction[] = [
  {
    id: '1',
    date: '2026-03-01',
    description: 'Mensalidade Irmão A',
    category: 'Mensalidade',
    type: 'Receita',
    amount: 150,
    accountId: 'stone',
  },
  {
    id: '2',
    date: '2026-03-01',
    description: 'Mensalidade Irmão A manual',
    category: 'Mensalidade',
    type: 'Receita',
    amount: 150,
    accountId: 'stone',
  },
  {
    id: '3',
    date: '2026-03-05',
    description: 'Material',
    category: 'Material',
    type: 'Despesa',
    amount: 200,
    accountId: 'stone',
  },
]

describe('account-reconciliation', () => {
  it('calcula saldo sugerido para bater com extrato', () => {
    const detail = buildAccountReconciliationDetails([account], transactions)[0]
    expect(detail.systemBalance).toBe(1100)

    const suggested = computeSuggestedInitialBalance(2285.4, detail)
    expect(suggested).toBe(2185.4)

    const enriched = enrichWithRealBalance(detail, 2285.4)
    expect(enriched.difference).toBe(-1185.4)
    expect(enriched.canApplySuggestedInitial).toBe(true)
  })

  it('detecta grupos duplicados na mesma conta/data/valor', () => {
    const groups = findDuplicateTransactionGroups(transactions)
    expect(groups).toHaveLength(1)
    expect(groups[0].transactions).toHaveLength(2)
  })

  it('identifica mensalidades sem vínculo com contributions', () => {
    const audit = buildReconciliationAudit(transactions, new Set(['1']))
    expect(audit.unlinkedMensalidade.some((item) => item.transaction.id === '2')).toBe(
      true,
    )
  })

  it('detecta mensalidades do mesmo valor no mesmo mês com datas diferentes', () => {
    const latePayment: Transaction[] = [
      {
        id: 'a',
        date: '2026-03-05',
        description: 'Mensalidade fev (atraso)',
        category: 'Mensalidade',
        type: 'Receita',
        amount: 150,
        accountId: 'stone',
      },
      {
        id: 'b',
        date: '2026-03-20',
        description: 'Mensalidade mar',
        category: 'Mensalidade',
        type: 'Receita',
        amount: 150,
        accountId: 'stone',
      },
    ]

    const groups = findSameMonthMensalidadeGroups(latePayment)
    expect(groups).toHaveLength(1)
    expect(groups[0].transactions).toHaveLength(2)
  })

  it('calcula impacto no saldo ao excluir lançamento', () => {
    expect(computeTransactionBalanceImpact(transactions[0])).toBe(-150)
    expect(computeTransactionBalanceImpact(transactions[2])).toBe(200)
  })

  it('oculta alertas já verificados com a mesma composição de lançamentos', () => {
    const audit = buildReconciliationAudit(transactions, new Set(['1']))
    const ackKeys = new Set([
      `unlinked_mensalidade|2|2`,
      `duplicate_group|stone|2026-03-01|Receita|150.00|1,2`,
    ])

    const filtered = filterAcknowledgedAudit(audit, ackKeys)
    expect(filtered.unlinkedMensalidade).toHaveLength(0)
    expect(filtered.duplicateGroups).toHaveLength(0)
  })

  it('reexibe alerta quando a composição de lançamentos muda', () => {
    const audit = buildReconciliationAudit(transactions, new Set(['1']))
    const ackKeys = new Set([`duplicate_group|stone|2026-03-01|Receita|150.00|1,2`])

    const filtered = filterAcknowledgedAudit(audit, ackKeys)
    expect(filtered.duplicateGroups).toHaveLength(0)

    const changedAudit = buildReconciliationAudit(
      [
        ...transactions,
        {
          id: '4',
          date: '2026-03-01',
          description: 'Mensalidade Irmão B',
          category: 'Mensalidade',
          type: 'Receita',
          amount: 150,
          accountId: 'stone',
        },
      ],
      new Set(['1']),
    )
    const refiltered = filterAcknowledgedAudit(changedAudit, ackKeys)
    expect(refiltered.duplicateGroups).toHaveLength(1)
  })
})
