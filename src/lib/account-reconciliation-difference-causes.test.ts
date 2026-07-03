import { describe, expect, it } from 'vitest'
import {
  buildCashReconciliationSummary,
  duplicateGroupExplainsDifference,
  filterAuditForDifferenceExplaining,
  transactionExplainsDifference,
} from '@/lib/account-reconciliation-difference-causes'
import type { AccountReconciliationAudit } from '@/lib/account-reconciliation'
import type { Transaction } from '@/lib/data'

const receita: Transaction = {
  id: 'tx-1',
  date: '2026-06-10',
  description: 'Mensalidade',
  category: 'Mensalidade',
  type: 'Receita',
  amount: 290,
  accountId: 'acc-1',
}

describe('account-reconciliation-difference-causes', () => {
  it('detecta lançamento que explica diferença positiva', () => {
    expect(transactionExplainsDifference(receita, 290, 'acc-1')).toBe(true)
    expect(transactionExplainsDifference(receita, 150, 'acc-1')).toBe(false)
  })

  it('detecta grupo duplicado que explica diferença', () => {
    expect(
      duplicateGroupExplainsDifference(
        {
          key: 'g1',
          accountId: 'acc-1',
          date: '2026-06-10',
          amount: 290,
          type: 'Receita',
          transactions: [receita, { ...receita, id: 'tx-2' }],
        },
        290,
      ),
    ).toBe(true)
  })

  it('resume totais de conferência', () => {
    const summary = buildCashReconciliationSummary([
      {
        accountId: 'acc-1',
        accountName: 'Stone',
        accountType: 'Banco',
        initialBalance: 0,
        systemBalance: 1000,
        totalIncome: 1000,
        totalExpense: 0,
        netMovement: 1000,
        realBalance: 850,
        difference: 150,
        suggestedInitialBalance: null,
        canApplySuggestedInitial: false,
      },
      {
        accountId: 'acc-2',
        accountName: 'Caixa',
        accountType: 'Caixa',
        initialBalance: 0,
        systemBalance: 500,
        totalIncome: 500,
        totalExpense: 0,
        netMovement: 500,
        realBalance: 500,
        difference: 0,
        suggestedInitialBalance: null,
        canApplySuggestedInitial: false,
      },
    ])

    expect(summary.totalSystemBalance).toBe(1500)
    expect(summary.totalRealBalance).toBe(1350)
    expect(summary.accountsMatched).toBe(1)
    expect(summary.accountsWithDifference).toBe(1)
  })

  it('filtra auditoria para itens que explicam diferença', () => {
    const audit: AccountReconciliationAudit = {
      unlinkedMensalidade: [
        { transaction: receita, reason: 'sem_vinculo_mensalidade' },
      ],
      duplicateGroups: [],
      sameMonthMensalidadeGroups: [],
      sameMonthMensalidadeInformative: [],
      orphanTransactions: [],
    }

    const filtered = filterAuditForDifferenceExplaining(audit, [
      {
        accountId: 'acc-1',
        accountName: 'Stone',
        accountType: 'Banco',
        initialBalance: 0,
        systemBalance: 1290,
        totalIncome: 1290,
        totalExpense: 0,
        netMovement: 1290,
        realBalance: 1000,
        difference: 290,
        suggestedInitialBalance: null,
        canApplySuggestedInitial: false,
      },
    ])

    expect(filtered.unlinkedMensalidade).toHaveLength(1)
  })
})
