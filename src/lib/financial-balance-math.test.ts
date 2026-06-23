import { describe, expect, it } from 'vitest'
import type { BankAccount, Transaction } from '@/lib/data'
import { computeCashAvailability, sumTransactionAmounts } from '@/lib/financial-balance-math'

const accounts: BankAccount[] = [
  { id: 'a1', name: 'Caixa', type: 'Caixa', initialBalance: 1000 },
  { id: 'a2', name: 'Banco', type: 'Corrente', initialBalance: 2000 },
]

const transactions: Transaction[] = [
  {
    id: '1',
    date: '2026-01-10',
    description: 'Mensalidade',
    category: 'Mensalidades',
    type: 'Receita',
    amount: 500,
    accountId: 'a1',
  },
  {
    id: '2',
    date: '2026-01-15',
    description: 'Material',
    category: 'Material',
    type: 'Despesa',
    amount: 300,
    accountId: 'a1',
  },
  {
    id: '3',
    date: '2026-01-20',
    description: 'Doação',
    category: 'Doações',
    type: 'Receita',
    amount: 800,
    accountId: 'a2',
  },
]

describe('financial-balance-math cash summary', () => {
  it('soma valores da lista', () => {
    expect(sumTransactionAmounts(transactions)).toBe(1600)
  })

  it('calcula caixa disponível com conferência', () => {
    const summary = computeCashAvailability(accounts, transactions)

    expect(summary.totalIncome).toBe(1300)
    expect(summary.totalExpense).toBe(300)
    expect(summary.netMovement).toBe(1000)
    expect(summary.availableCash).toBe(4000)
    expect(summary.isBalanced).toBe(true)
  })
})
