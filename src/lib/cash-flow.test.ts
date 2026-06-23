import { describe, expect, it } from 'vitest'
import type { BankAccount, Transaction } from '@/lib/data'
import {
  buildCashFlowReport,
  computeAccountCashFlowSummary,
  computePeriodTotals,
  computeReconciliation,
  detectOrphanTransactions,
  filterTransactionsInPeriod,
  isTransactionBeforePeriod,
  isTransactionInPeriod,
} from '@/lib/cash-flow'
import { endOfMonth, startOfMonth } from 'date-fns'

const period = {
  start: startOfMonth(new Date(2026, 1, 1)),
  end: endOfMonth(new Date(2026, 1, 1)),
}

const accounts: BankAccount[] = [
  {
    id: 'acc-1',
    name: 'Caixa',
    type: 'Caixa',
    initialBalance: 1000,
  },
  {
    id: 'acc-2',
    name: 'Banco',
    type: 'Corrente',
    initialBalance: 5000,
  },
]

function tx(
  overrides: Partial<Transaction> & Pick<Transaction, 'id' | 'date' | 'type' | 'amount'>,
): Transaction {
  return {
    description: overrides.description ?? 'Movimento',
    category: overrides.category ?? 'Geral',
    accountId: overrides.accountId,
    ...overrides,
  }
}

const transactions: Transaction[] = [
  tx({
    id: '1',
    date: '2026-02-10',
    type: 'Receita',
    amount: 500,
    accountId: 'acc-1',
    category: 'Mensalidades',
  }),
  tx({
    id: '2',
    date: '2026-02-15',
    type: 'Despesa',
    amount: 200,
    accountId: 'acc-1',
    category: 'Material',
  }),
  tx({
    id: '3',
    date: '2026-02-20',
    type: 'Receita',
    amount: 1000,
    accountId: 'acc-2',
    category: 'Doações',
  }),
  tx({
    id: '4',
    date: '2026-01-31',
    type: 'Receita',
    amount: 300,
    accountId: 'acc-1',
    category: 'Mensalidades',
  }),
  tx({
    id: '5',
    date: '2026-02-25',
    type: 'Despesa',
    amount: 150,
    accountId: undefined,
    category: 'Sem conta',
  }),
]

describe('cash-flow period helpers', () => {
  it('identifica transações dentro e antes do período', () => {
    expect(isTransactionInPeriod('2026-02-28', period)).toBe(true)
    expect(isTransactionInPeriod('2026-03-01', period)).toBe(false)
    expect(isTransactionInPeriod('2026-01-31', period)).toBe(false)
    expect(isTransactionBeforePeriod('2026-01-31', period.start)).toBe(true)
    expect(isTransactionBeforePeriod('2026-03-01', period.start)).toBe(false)
  })

  it('filtra movimentações por período e conta', () => {
    const filtered = filterTransactionsInPeriod(transactions, period, 'acc-1')
    expect(filtered).toHaveLength(2)
    expect(filtered.map((item) => item.id)).toEqual(['1', '2'])
  })
})

describe('computeAccountCashFlowSummary', () => {
  it('calcula saldo inicial, movimentação e saldo final da conta', () => {
    const summary = computeAccountCashFlowSummary(accounts[0], transactions, period)

    expect(summary.openingBalance).toBe(1300)
    expect(summary.periodIncome).toBe(500)
    expect(summary.periodExpense).toBe(200)
    expect(summary.closingBalance).toBe(1600)
  })
})

describe('computePeriodTotals', () => {
  it('soma receitas e despesas do período', () => {
    const inPeriod = filterTransactionsInPeriod(transactions, period, 'all')
    const totals = computePeriodTotals(inPeriod)

    expect(totals.totalIncome).toBe(1500)
    expect(totals.totalExpense).toBe(350)
    expect(totals.netCashFlow).toBe(1150)
  })
})

describe('reconciliation', () => {
  it('detecta transações sem conta vinculada', () => {
    expect(detectOrphanTransactions(transactions)).toHaveLength(1)
  })

  it('mantém saldo global igual à soma dos saldos por conta', () => {
    const summaries = accounts.map((account) =>
      computeAccountCashFlowSummary(account, transactions, period),
    )
    const inPeriod = filterTransactionsInPeriod(transactions, period, 'all')
    const reconciliation = computeReconciliation(
      accounts,
      transactions,
      period,
      summaries,
      computePeriodTotals(inPeriod),
    )

    expect(reconciliation.isBalanced).toBe(true)
    expect(reconciliation.globalClosingBalance).toBe(7600)
    expect(reconciliation.orphanPeriodExpense).toBe(150)
  })
})

describe('buildCashFlowReport', () => {
  it('monta relatório consolidado com total geral', () => {
    const report = buildCashFlowReport(accounts, transactions, period, 'all')

    expect(report.accountSummaries).toHaveLength(2)
    expect(report.totalsRow.closingBalance).toBe(
      report.accountSummaries.reduce((sum, row) => sum + row.closingBalance, 0),
    )
    expect(report.periodTransactions).toHaveLength(4)
    expect(report.incomeByCategory.Mensalidades).toBe(500)
    expect(report.expenseByCategory.Material).toBe(200)
  })

  it('filtra relatório por conta específica', () => {
    const report = buildCashFlowReport(accounts, transactions, period, 'acc-2')

    expect(report.accountSummaries).toHaveLength(1)
    expect(report.accountSummaries[0].accountName).toBe('Banco')
    expect(report.periodTotals.totalIncome).toBe(1000)
    expect(report.periodTotals.totalExpense).toBe(0)
  })
})
