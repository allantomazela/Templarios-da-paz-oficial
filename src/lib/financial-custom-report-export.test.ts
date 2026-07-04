import { describe, expect, it } from 'vitest'
import type { Transaction } from '@/lib/data'
import {
  buildCustomReportAttachmentZipPlans,
  buildCustomReportPendingItemsCsv,
  buildCustomReportResumoGeralCsv,
  buildCustomReportTransactionsCsv,
  buildCustomReportZipFilename,
} from '@/lib/financial-custom-report-export'
import { DEFAULT_FINANCIAL_CUSTOM_REPORT_DISPLAY_OPTIONS } from '@/lib/financial-custom-report-display'

describe('financial-custom-report-export', () => {
  it('gera csv de resumo geral', () => {
    const csv = buildCustomReportResumoGeralCsv(
      DEFAULT_FINANCIAL_CUSTOM_REPORT_DISPLAY_OPTIONS,
      { totalIncome: 1000, totalExpense: 400, balance: 600 },
      {
        totalReceivable: 300,
        totalPayable: 50,
        netPending: 250,
        receivableCount: 2,
        payableCount: 1,
      },
    )

    expect(csv).toContain('Receitas realizadas')
    expect(csv).toContain('1000.00')
    expect(csv).toContain('A receber (a vencer)')
    expect(csv).toContain('300.00')
  })

  it('gera csv de valores a vencer', () => {
    const csv = buildCustomReportPendingItemsCsv([
      {
        id: 'p-1',
        dueDate: '2026-04-05',
        description: 'Mensalidade — João',
        category: 'Mensalidade',
        type: 'Receita',
        amount: 150,
        source: 'membership',
        statusLabel: 'A vencer',
        brotherName: 'João',
        periodLabel: 'Abr/2026',
      },
    ])

    expect(csv).toContain('Mensalidade — João')
    expect(csv).toContain('150.00')
    expect(csv).toContain('João')
  })

  it('gera csv de lançamentos com observações', () => {
    const transactions: Transaction[] = [
      {
        id: 'tx-1',
        date: '2026-03-01',
        description: 'Mensalidade João',
        category: 'Mensalidade',
        type: 'Receita',
        amount: 150,
        accountId: 'acc-1',
        attachmentNotes: 'PIX',
      },
    ]

    const csv = buildCustomReportTransactionsCsv(
      transactions,
      { 'acc-1': 'Stone' },
      true,
      {
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
      },
    )

    expect(csv).toContain('Stone')
    expect(csv).toContain('PIX')
    expect(csv).toContain('recibo.pdf')
  })

  it('planeja caminhos de comprovantes no zip', () => {
    const plans = buildCustomReportAttachmentZipPlans(
      [
        {
          id: 'tx-1',
          date: '2026-03-01',
          description: 'Mensalidade João',
          category: 'Mensalidade',
          type: 'Receita',
          amount: 150,
          accountId: 'acc-1',
        },
      ],
      { 'acc-1': 'Stone' },
      {
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
      },
    )

    expect(plans).toHaveLength(1)
    expect(plans[0].zipPath).toMatch(/^comprovantes\//)
  })

  it('monta nome do arquivo zip', () => {
    expect(buildCustomReportZipFilename('Março 2026', '2026-03-09')).toContain(
      'relatorio-financeiro-personalizado',
    )
  })
})
