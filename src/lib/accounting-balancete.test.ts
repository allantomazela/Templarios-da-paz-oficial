import { describe, expect, it } from 'vitest'
import type { BankAccount, Transaction } from '@/lib/data'
import { buildAccountingBalancete } from '@/lib/accounting-balancete'
import { endOfMonth, startOfMonth } from 'date-fns'

const accounts: BankAccount[] = [
  { id: 'stone', name: 'Stone', type: 'Corrente', initialBalance: 1000 },
]

const transactions: Transaction[] = [
  {
    id: '1',
    date: '2026-03-01',
    description: 'Mensalidade',
    category: 'Mensalidade',
    type: 'Receita',
    amount: 150,
    accountId: 'stone',
    attachmentNotes: 'PIX confirmado',
  },
  {
    id: '2',
    date: '2026-03-10',
    description: 'Material',
    category: 'Material',
    type: 'Despesa',
    amount: 80,
    accountId: 'stone',
  },
]

describe('accounting-balancete', () => {
  it('monta seções por conta com créditos, débitos e anexos', () => {
    const period = {
      start: startOfMonth(new Date(2026, 2, 1)),
      end: endOfMonth(new Date(2026, 2, 1)),
    }

    const report = buildAccountingBalancete(accounts, transactions, {
      '2': [
        {
          id: 'att-1',
          transactionId: '2',
          documentType: 'nota_fiscal',
          filePath: 'transactions/2/file.pdf',
          fileName: 'nf-material.pdf',
          fileSize: 1000,
          mimeType: 'application/pdf',
          uploadedBy: null,
          createdAt: '2026-03-10T12:00:00Z',
        },
      ],
    }, period)

    expect(report.accountSections).toHaveLength(1)
    expect(report.accountSections[0].totalCredits).toBe(150)
    expect(report.accountSections[0].totalDebits).toBe(80)
    expect(report.accountSections[0].closingBalance).toBe(1070)
    expect(report.accountSections[0].entries[1].attachments[0].fileName).toBe(
      'nf-material.pdf',
    )
    expect(report.accountSections[0].entries[0].attachmentNotes).toBe('PIX confirmado')
  })
})
