import type { AccountingBalanceteData, BalanceteLedgerEntry } from '@/lib/accounting-balancete'
import type { FinancialTransactionAttachment } from '@/lib/financial-attachments'

export interface AttachmentZipPlanItem {
  transactionId: string
  entry: BalanceteLedgerEntry
  attachment: FinancialTransactionAttachment
  zipPath: string
}

export function sanitizeZipPathSegment(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60) || 'item'
}

function escapeCsvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`
}

function rowsToCsv(headers: string[], rows: string[][]): string {
  return [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => row.map((cell) => escapeCsvCell(cell)).join(',')),
  ].join('\n')
}

export function collectBalanceteLedgerEntries(
  balancete: AccountingBalanceteData,
): BalanceteLedgerEntry[] {
  return [
    ...balancete.accountSections.flatMap((section) => section.entries),
    ...balancete.unassignedEntries,
  ]
}

export function buildBalanceteResumoContasCsv(balancete: AccountingBalanceteData): string {
  const headers = [
    'Conta',
    'Tipo',
    'Saldo Inicial',
    'Creditos',
    'Debitos',
    'Saldo Final',
  ]

  const rows = balancete.accountSections.map((section) => [
    section.accountName,
    section.accountType,
    section.openingBalance.toFixed(2),
    section.totalCredits.toFixed(2),
    section.totalDebits.toFixed(2),
    section.closingBalance.toFixed(2),
  ])

  rows.push([
    balancete.totalsRow.accountName,
    '',
    balancete.totalsRow.openingBalance.toFixed(2),
    balancete.totalsRow.totalCredits.toFixed(2),
    balancete.totalsRow.totalDebits.toFixed(2),
    balancete.totalsRow.closingBalance.toFixed(2),
  ])

  return `\uFEFF${rowsToCsv(headers, rows)}`
}

export function buildBalanceteLancamentosCsv(entries: BalanceteLedgerEntry[]): string {
  const headers = [
    'Data',
    'Conta',
    'Tipo',
    'Categoria',
    'Descricao',
    'Credito',
    'Debito',
    'Observacoes',
    'Comprovantes',
  ]

  const rows = entries.map((entry) => [
    entry.date,
    entry.accountName,
    entry.type,
    entry.category,
    entry.description,
    entry.credit > 0 ? entry.credit.toFixed(2) : '',
    entry.debit > 0 ? entry.debit.toFixed(2) : '',
    entry.attachmentNotes ?? '',
    entry.attachments
      .map((attachment) => `${attachment.documentTypeLabel}: ${attachment.fileName}`)
      .join(' | '),
  ])

  return `\uFEFF${rowsToCsv(headers, rows)}`
}

export function buildAttachmentZipPlans(
  entries: BalanceteLedgerEntry[],
  attachmentsByTransactionId: Record<string, FinancialTransactionAttachment[]>,
): AttachmentZipPlanItem[] {
  const usedPaths = new Set<string>()
  const plans: AttachmentZipPlanItem[] = []

  for (const entry of entries) {
    const attachments = attachmentsByTransactionId[entry.id] ?? []
    attachments.forEach((attachment, index) => {
      const extension = attachment.fileName.includes('.')
        ? attachment.fileName.slice(attachment.fileName.lastIndexOf('.'))
        : ''
      const baseName = sanitizeZipPathSegment(
        `${entry.date}_${entry.accountName}_${entry.category}_${entry.description}`,
      )
      let zipPath = `comprovantes/${baseName}_${index + 1}${extension}`
      let suffix = 2

      while (usedPaths.has(zipPath)) {
        zipPath = `comprovantes/${baseName}_${index + 1}_${suffix}${extension}`
        suffix += 1
      }

      usedPaths.add(zipPath)
      plans.push({
        transactionId: entry.id,
        entry,
        attachment,
        zipPath,
      })
    })
  }

  return plans
}

export function buildIndiceComprovantesCsv(plans: AttachmentZipPlanItem[]): string {
  const headers = [
    'Data',
    'Conta',
    'Descricao',
    'Categoria',
    'Tipo Documento',
    'Arquivo Original',
    'Arquivo no ZIP',
  ]

  const rows = plans.map((plan) => [
    plan.entry.date,
    plan.entry.accountName,
    plan.entry.description,
    plan.entry.category,
    plan.attachment.documentType,
    plan.attachment.fileName,
    plan.zipPath,
  ])

  return `\uFEFF${rowsToCsv(headers, rows)}`
}

export function buildBalanceteReadmeText(options: {
  periodLabel: string
  accountFilterLabel?: string
  typeFilterLabel?: string
  attachmentCount: number
}): string {
  const filterLine = options.accountFilterLabel
    ? `Conta filtrada: ${options.accountFilterLabel}`
    : 'Conta filtrada: Todas as contas'
  const typeLine = options.typeFilterLabel
    ? `Tipo: ${options.typeFilterLabel}`
    : 'Tipo: Receitas e Despesas'

  return [
    'Pacote contábil — Templários da Paz',
    '================================',
    '',
    `Período: ${options.periodLabel}`,
    typeLine,
    filterLine,
    `Gerado em: ${new Date().toLocaleString('pt-BR')}`,
    '',
    'Conteúdo do pacote:',
    '- balancete-resumo-contas.csv — saldos por conta',
    '- balancete-lancamentos.csv — razão analítico com observações',
    `- indice-comprovantes.csv — índice de ${options.attachmentCount} comprovante(s)`,
    '- comprovantes/ — notas fiscais, recibos e demais anexos',
    '',
    'Para o PDF do balancete formatado, use "Imprimir / Salvar PDF" no sistema.',
  ].join('\n')
}

export function buildBalanceteZipFilename(periodLabel: string, dateIso: string): string {
  const periodSlug = sanitizeZipPathSegment(periodLabel)
  return `balancete-contabil_${periodSlug}_${dateIso}.zip`
}
