import { describe, expect, it } from 'vitest'
import {
  buildMensalidadeBalanceHints,
  findUnlinkedMensalidadeReceitas,
} from '@/lib/account-reconciliation-mensalidade-hints'
import type { Transaction } from '@/lib/data'

const linked = new Set(['tx-linked'])

const transactions: Transaction[] = [
  {
    id: 'tx-linked',
    date: '2026-06-10',
    description: 'Mensalidade - Irmão A',
    category: 'Mensalidade',
    type: 'Receita',
    amount: 290,
    accountId: 'acc-1',
  },
  {
    id: 'tx-orphan',
    date: '2026-06-12',
    description: 'Mensalidade manual',
    category: 'Mensalidade',
    type: 'Receita',
    amount: 290,
    accountId: 'acc-1',
  },
]

describe('account-reconciliation-mensalidade-hints', () => {
  it('lista receitas de mensalidade sem vínculo', () => {
    const unlinked = findUnlinkedMensalidadeReceitas(transactions, linked)
    expect(unlinked).toHaveLength(1)
    expect(unlinked[0].id).toBe('tx-orphan')
  })

  it('relaciona diferença positiva com mensalidade órfã', () => {
    const hints = buildMensalidadeBalanceHints(
      [{ accountId: 'acc-1', accountName: 'Caixa' }],
      transactions,
      linked,
      [
        {
          accountId: 'acc-1',
          accountName: 'Caixa',
          accountType: 'Caixa',
          initialBalance: 0,
          systemBalance: 3084.5,
          totalIncome: 3084.5,
          totalExpense: 0,
          netMovement: 3084.5,
          realBalance: 2794.5,
          difference: 290,
          suggestedInitialBalance: null,
          canApplySuggestedInitial: false,
        },
      ],
    )

    expect(hints).toHaveLength(1)
    expect(hints[0].matchesDifference).toBe(true)
    expect(hints[0].unlinkedTotal).toBe(290)
  })
})
