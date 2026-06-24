import { describe, expect, it } from 'vitest'
import type { AccountingBalanceteData } from '@/lib/accounting-balancete'
import {
  buildAttachmentZipPlans,
  buildBalanceteLancamentosCsv,
  buildBalanceteResumoContasCsv,
  sanitizeZipPathSegment,
} from '@/lib/balancete-zip-build'

const balancete: AccountingBalanceteData = {
  accountSections: [
    {
      accountId: 'stone',
      accountName: 'Stone',
      accountType: 'Corrente',
      openingBalance: 1000,
      totalCredits: 150,
      totalDebits: 80,
      closingBalance: 1070,
      entries: [
        {
          id: 'tx-1',
          date: '2026-03-01',
          description: 'Mensalidade João',
          category: 'Mensalidade',
          type: 'Receita',
          amount: 150,
          credit: 150,
          debit: 0,
          accountName: 'Stone',
          attachmentNotes: 'PIX',
          attachments: [{ documentTypeLabel: 'Recibo', fileName: 'recibo.pdf' }],
        },
      ],
    },
  ],
  unassignedEntries: [],
  totalsRow: {
    accountName: 'TOTAL GERAL',
    openingBalance: 1000,
    totalCredits: 150,
    totalDebits: 80,
    closingBalance: 1070,
  },
  incomeByCategory: { Mensalidade: 150 },
  expenseByCategory: {},
  periodTransactionCount: 1,
}

describe('balancete-zip-export', () => {
  it('sanitiza nomes de arquivo para o zip', () => {
    expect(sanitizeZipPathSegment('Stone / Conta')).toBe('Stone_Conta')
  })

  it('gera csv de resumo por conta', () => {
    const csv = buildBalanceteResumoContasCsv(balancete)
    expect(csv).toContain('Stone')
    expect(csv).toContain('1070.00')
  })

  it('gera csv de lançamentos com observações', () => {
    const csv = buildBalanceteLancamentosCsv(balancete.accountSections[0].entries)
    expect(csv).toContain('Mensalidade João')
    expect(csv).toContain('PIX')
  })

  it('planeja caminhos únicos para comprovantes', () => {
    const plans = buildAttachmentZipPlans(balancete.accountSections[0].entries, {
      'tx-1': [
        {
          id: 'att-1',
          transactionId: 'tx-1',
          documentType: 'recibo',
          filePath: 'transactions/tx-1/file.pdf',
          fileName: 'recibo.pdf',
          fileSize: 100,
          mimeType: 'application/pdf',
          uploadedBy: null,
          createdAt: '2026-03-01',
        },
      ],
    })

    expect(plans).toHaveLength(1)
    expect(plans[0].zipPath).toMatch(/^comprovantes\//)
    expect(plans[0].zipPath).toContain('.pdf')
  })
})
