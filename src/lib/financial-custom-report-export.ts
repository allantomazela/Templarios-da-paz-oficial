import type { Transaction } from '@/lib/data'
import type { AccountPeriodBreakdownResult } from '@/lib/cash-flow'
import type { FinancialCustomReportDisplayOptions } from '@/lib/financial-custom-report-display'
import type {
  PendingFinancialReportItem,
  PendingFinancialReportSummary,
} from '@/lib/financial-pending-report'
import {
  createAttachmentDownloadUrl,
  type FinancialTransactionAttachment,
} from '@/lib/financial-attachments'
import { downloadBlob } from '@/lib/export-utils'
import { todayLocalISODate } from '@/lib/format-utils'
import {
  buildIndiceComprovantesCsv,
  sanitizeZipPathSegment,
  type AttachmentZipPlanItem,
} from '@/lib/balancete-zip-build'

const DOWNLOAD_CONCURRENCY = 3

export interface CustomReportAttachmentZipPlan {
  transaction: Transaction
  attachment: FinancialTransactionAttachment
  zipPath: string
}

export interface ExportCustomFinancialReportZipInput {
  periodLabel: string
  contentModeLabel: string
  accountFilterLabel?: string
  typeFilterLabel?: string
  display: FinancialCustomReportDisplayOptions
  pendingItems: PendingFinancialReportItem[]
  pendingSummary: PendingFinancialReportSummary
  realizedTotals: {
    totalIncome: number
    totalExpense: number
    balance: number
  }
  incomeByCategory: { category: string; amount: number }[]
  expenseByCategory: { category: string; amount: number }[]
  accountBreakdown: AccountPeriodBreakdownResult
  transactions: Transaction[]
  accountNames: Record<string, string>
  attachmentsByTransactionId?: Record<string, FinancialTransactionAttachment[]>
}

function escapeCsvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`
}

function rowsToCsv(headers: string[], rows: string[][]): string {
  return `\uFEFF${[
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => row.map((cell) => escapeCsvCell(cell)).join(',')),
  ].join('\n')}`
}

function pendingSourceLabel(source: PendingFinancialReportItem['source']): string {
  return source === 'membership' ? 'Mensalidade' : 'Planejamento'
}

export function buildCustomReportResumoGeralCsv(
  display: FinancialCustomReportDisplayOptions,
  realizedTotals: ExportCustomFinancialReportZipInput['realizedTotals'],
  pendingSummary: PendingFinancialReportSummary,
): string {
  const headers = ['Indicador', 'Valor (R$)']
  const rows: string[][] = []

  if (display.showRealizedSummary) {
    rows.push(
      ['Receitas realizadas', realizedTotals.totalIncome.toFixed(2)],
      ['Despesas realizadas', realizedTotals.totalExpense.toFixed(2)],
      ['Saldo realizado', realizedTotals.balance.toFixed(2)],
    )
  }

  if (display.showPendingSection) {
    rows.push(
      ['A receber (a vencer)', pendingSummary.totalReceivable.toFixed(2)],
      ['A pagar (a vencer)', pendingSummary.totalPayable.toFixed(2)],
      ['Saldo pendente', pendingSummary.netPending.toFixed(2)],
      ['Itens a receber (qtd)', String(pendingSummary.receivableCount)],
      ['Itens a pagar (qtd)', String(pendingSummary.payableCount)],
    )
  }

  return rowsToCsv(headers, rows)
}

export function buildCustomReportPendingItemsCsv(
  items: PendingFinancialReportItem[],
): string {
  const headers = [
    'Vencimento',
    'Descricao',
    'Categoria',
    'Origem',
    'Status',
    'Tipo',
    'Valor (R$)',
    'Irmao',
    'Periodo',
  ]

  const rows = items.map((item) => [
    item.dueDate,
    item.description,
    item.category,
    pendingSourceLabel(item.source),
    item.statusLabel,
    item.type,
    item.amount.toFixed(2),
    item.brotherName ?? '',
    item.periodLabel ?? '',
  ])

  return rowsToCsv(headers, rows)
}

export function buildCustomReportAccountBreakdownCsv(
  breakdown: AccountPeriodBreakdownResult,
): string {
  const headers = ['Conta', 'Receitas (R$)', 'Despesas (R$)', 'Liquido (R$)']

  const rows = breakdown.rows.map((row) => [
    row.accountName,
    row.periodIncome.toFixed(2),
    row.periodExpense.toFixed(2),
    row.netCashFlow.toFixed(2),
  ])

  rows.push([
    breakdown.totals.accountName,
    breakdown.totals.periodIncome.toFixed(2),
    breakdown.totals.periodExpense.toFixed(2),
    breakdown.totals.netCashFlow.toFixed(2),
  ])

  return rowsToCsv(headers, rows)
}

export function buildCustomReportCategoryCsv(
  items: { category: string; amount: number }[],
): string {
  const headers = ['Categoria', 'Valor (R$)']
  const rows = items.map((item) => [item.category, item.amount.toFixed(2)])
  return rowsToCsv(headers, rows)
}

export function buildCustomReportTransactionsCsv(
  transactions: Transaction[],
  accountNames: Record<string, string>,
  includeNotes: boolean,
  attachmentsByTransactionId: Record<string, FinancialTransactionAttachment[]> = {},
): string {
  const headers = includeNotes
    ? [
        'Data',
        'Conta',
        'Tipo',
        'Categoria',
        'Descricao',
        'Valor (R$)',
        'Observacoes',
        'Comprovantes',
      ]
    : ['Data', 'Conta', 'Tipo', 'Categoria', 'Descricao', 'Valor (R$)']

  const rows = transactions.map((transaction) => {
    const base = [
      transaction.date,
      transaction.accountId ? accountNames[transaction.accountId] ?? transaction.accountId : '',
      transaction.type,
      transaction.category,
      transaction.description,
      transaction.amount.toFixed(2),
    ]

    if (!includeNotes) return base

    const attachments = attachmentsByTransactionId[transaction.id] ?? []
    return [
      ...base,
      transaction.attachmentNotes?.trim() ?? '',
      attachments.map((attachment) => `${attachment.documentType}: ${attachment.fileName}`).join(' | '),
    ]
  })

  return rowsToCsv(headers, rows)
}

export function buildCustomReportAttachmentZipPlans(
  transactions: Transaction[],
  accountNames: Record<string, string>,
  attachmentsByTransactionId: Record<string, FinancialTransactionAttachment[]>,
): CustomReportAttachmentZipPlan[] {
  const usedPaths = new Set<string>()
  const plans: CustomReportAttachmentZipPlan[] = []

  for (const transaction of transactions) {
    const attachments = attachmentsByTransactionId[transaction.id] ?? []
    const accountName = transaction.accountId
      ? accountNames[transaction.accountId] ?? transaction.accountId
      : 'Sem conta'

    attachments.forEach((attachment, index) => {
      const extension = attachment.fileName.includes('.')
        ? attachment.fileName.slice(attachment.fileName.lastIndexOf('.'))
        : ''
      const baseName = sanitizeZipPathSegment(
        `${transaction.date}_${accountName}_${transaction.category}_${transaction.description}`,
      )
      let zipPath = `comprovantes/${baseName}_${index + 1}${extension}`
      let suffix = 2

      while (usedPaths.has(zipPath)) {
        zipPath = `comprovantes/${baseName}_${index + 1}_${suffix}${extension}`
        suffix += 1
      }

      usedPaths.add(zipPath)
      plans.push({ transaction, attachment, zipPath })
    })
  }

  return plans
}

export function buildCustomReportReadmeText(options: {
  periodLabel: string
  contentModeLabel: string
  accountFilterLabel?: string
  typeFilterLabel?: string
  files: string[]
  attachmentCount: number
}): string {
  const accountLine = options.accountFilterLabel
    ? `Conta (realizado): ${options.accountFilterLabel}`
    : 'Conta (realizado): Todas as contas'
  const typeLine = options.typeFilterLabel
    ? `Tipo (realizado): ${options.typeFilterLabel}`
    : 'Tipo (realizado): Receitas e Despesas'

  return [
    'Relatório financeiro personalizado — Templários da Paz',
    '====================================================',
    '',
    `Período: ${options.periodLabel}`,
    `Conteúdo: ${options.contentModeLabel}`,
    typeLine,
    accountLine,
    `Gerado em: ${new Date().toLocaleString('pt-BR')}`,
    '',
    'Conteúdo do pacote:',
    ...options.files.map((file) => `- ${file}`),
    options.attachmentCount > 0
      ? `- comprovantes/ — ${options.attachmentCount} anexo(s) de lançamentos realizados`
      : '',
    '',
    'Para o PDF formatado, use "Imprimir / Salvar PDF" no sistema.',
    'Valores a vencer usam a data de vencimento; realizados usam a data do lançamento.',
  ]
    .filter(Boolean)
    .join('\n')
}

export function buildCustomReportZipFilename(
  periodLabel: string,
  dateIso: string,
): string {
  const periodSlug = sanitizeZipPathSegment(periodLabel)
  return `relatorio-financeiro-personalizado_${periodSlug}_${dateIso}.zip`
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) return []

  const results = new Array<R>(items.length)
  let nextIndex = 0

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex
      nextIndex += 1
      results[currentIndex] = await mapper(items[currentIndex], currentIndex)
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => worker(),
  )
  await Promise.all(workers)
  return results
}

function toBalanceteAttachmentPlans(
  plans: CustomReportAttachmentZipPlan[],
  accountNames: Record<string, string>,
): AttachmentZipPlanItem[] {
  return plans.map((plan) => ({
    transactionId: plan.transaction.id,
    entry: {
      id: plan.transaction.id,
      date: plan.transaction.date,
      description: plan.transaction.description,
      category: plan.transaction.category,
      type: plan.transaction.type,
      amount: plan.transaction.amount,
      credit: plan.transaction.type === 'Receita' ? plan.transaction.amount : 0,
      debit: plan.transaction.type === 'Despesa' ? plan.transaction.amount : 0,
      accountName: plan.transaction.accountId
        ? accountNames[plan.transaction.accountId] ?? plan.transaction.accountId
        : 'Sem conta',
      attachmentNotes: plan.transaction.attachmentNotes,
      attachments: [],
    },
    attachment: plan.attachment,
    zipPath: plan.zipPath,
  }))
}

export async function exportCustomFinancialReportZip(
  input: ExportCustomFinancialReportZipInput,
): Promise<void> {
  const { default: JSZip } = await import('jszip')
  const zip = new JSZip()
  const attachmentsByTransactionId = input.attachmentsByTransactionId ?? {}
  const includedFiles: string[] = []

  if (input.display.showSummary) {
    zip.file(
      'resumo-geral.csv',
      buildCustomReportResumoGeralCsv(
        input.display,
        input.realizedTotals,
        input.pendingSummary,
      ),
    )
    includedFiles.push('resumo-geral.csv — totais gerais do relatório')
  }

  if (input.display.showPendingSection) {
    zip.file(
      'valores-a-vencer.csv',
      buildCustomReportPendingItemsCsv(input.pendingItems),
    )
    includedFiles.push(
      `valores-a-vencer.csv — ${input.pendingItems.length} item(ns) pendente(s)`,
    )
  }

  if (input.display.showAccountBreakdown && input.accountBreakdown.rows.length > 0) {
    zip.file(
      'movimentacao-por-conta.csv',
      buildCustomReportAccountBreakdownCsv(input.accountBreakdown),
    )
    includedFiles.push('movimentacao-por-conta.csv — receitas/despesas por conta (realizado)')
  }

  if (input.display.showIncomeCategories) {
    zip.file(
      'receitas-por-categoria.csv',
      buildCustomReportCategoryCsv(input.incomeByCategory),
    )
    includedFiles.push('receitas-por-categoria.csv')
  }

  if (input.display.showExpenseCategories) {
    zip.file(
      'despesas-por-categoria.csv',
      buildCustomReportCategoryCsv(input.expenseByCategory),
    )
    includedFiles.push('despesas-por-categoria.csv')
  }

  if (input.display.showRealizedLedger && input.transactions.length > 0) {
    zip.file(
      'lancamentos-realizados.csv',
      buildCustomReportTransactionsCsv(
        input.transactions,
        input.accountNames,
        input.display.showAttachmentDetails,
        attachmentsByTransactionId,
      ),
    )
    includedFiles.push(
      `lancamentos-realizados.csv — ${input.transactions.length} lançamento(s)`,
    )
  }

  const attachmentPlans =
    input.display.showRealizedLedger && input.transactions.length > 0
      ? buildCustomReportAttachmentZipPlans(
          input.transactions,
          input.accountNames,
          attachmentsByTransactionId,
        )
      : []

  if (attachmentPlans.length > 0) {
    zip.file(
      'indice-comprovantes.csv',
      buildIndiceComprovantesCsv(toBalanceteAttachmentPlans(attachmentPlans, input.accountNames)),
    )
    includedFiles.push(`indice-comprovantes.csv — índice de ${attachmentPlans.length} anexo(s)`)
  }

  zip.file(
    'LEIA-ME.txt',
    buildCustomReportReadmeText({
      periodLabel: input.periodLabel,
      contentModeLabel: input.contentModeLabel,
      accountFilterLabel: input.accountFilterLabel,
      typeFilterLabel: input.typeFilterLabel,
      files: includedFiles,
      attachmentCount: attachmentPlans.length,
    }),
  )

  const warnings: string[] = []

  await mapWithConcurrency(attachmentPlans, DOWNLOAD_CONCURRENCY, async (plan) => {
    try {
      const signedUrl = await createAttachmentDownloadUrl(plan.attachment.filePath)
      const response = await fetch(signedUrl)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const buffer = await response.arrayBuffer()
      zip.file(plan.zipPath, buffer)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erro desconhecido ao baixar arquivo'
      warnings.push(`${plan.zipPath} — ${plan.attachment.fileName}: ${message}`)
    }
  })

  if (warnings.length > 0) {
    zip.file(
      'avisos-download.txt',
      ['Alguns comprovantes não puderam ser incluídos no ZIP:', '', ...warnings].join('\n'),
    )
  }

  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  })

  downloadBlob(
    blob,
    buildCustomReportZipFilename(input.periodLabel, todayLocalISODate()),
  )
}
