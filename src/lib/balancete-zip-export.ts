import type { AccountingBalanceteData } from '@/lib/accounting-balancete'
import {
  createAttachmentDownloadUrl,
  type FinancialTransactionAttachment,
} from '@/lib/financial-attachments'
import { downloadBlob } from '@/lib/export-utils'
import { formatCurrencyBRL, todayLocalISODate } from '@/lib/format-utils'
import {
  buildAttachmentZipPlans,
  buildBalanceteLancamentosCsv,
  buildBalanceteReadmeText,
  buildBalanceteResumoContasCsv,
  buildBalanceteZipFilename,
  buildIndiceComprovantesCsv,
  collectBalanceteLedgerEntries,
} from '@/lib/balancete-zip-build'

const DOWNLOAD_CONCURRENCY = 3

export interface ExportBalanceteZipInput {
  balancete: AccountingBalanceteData
  periodLabel: string
  accountFilterLabel?: string
  typeFilterLabel?: string
  attachmentsByTransactionId: Record<string, FinancialTransactionAttachment[]>
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

export async function exportBalanceteZip(input: ExportBalanceteZipInput): Promise<void> {
  const { default: JSZip } = await import('jszip')
  const zip = new JSZip()
  const entries = collectBalanceteLedgerEntries(input.balancete)
  const attachmentPlans = buildAttachmentZipPlans(
    entries,
    input.attachmentsByTransactionId,
  )

  zip.file(
    'LEIA-ME.txt',
    buildBalanceteReadmeText({
      periodLabel: input.periodLabel,
      accountFilterLabel: input.accountFilterLabel,
      typeFilterLabel: input.typeFilterLabel,
      attachmentCount: attachmentPlans.length,
    }),
  )
  zip.file('balancete-resumo-contas.csv', buildBalanceteResumoContasCsv(input.balancete))
  zip.file('balancete-lancamentos.csv', buildBalanceteLancamentosCsv(entries))

  if (attachmentPlans.length > 0) {
    zip.file('indice-comprovantes.csv', buildIndiceComprovantesCsv(attachmentPlans))
  }

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
    buildBalanceteZipFilename(input.periodLabel, todayLocalISODate()),
  )
}

export function formatBalanceteZipSummary(balancete: AccountingBalanceteData): string {
  return `${balancete.periodTransactionCount} lançamento(s) — saldo final ${formatCurrencyBRL(balancete.totalsRow.closingBalance)}`
}

export {
  buildAttachmentZipPlans,
  buildBalanceteLancamentosCsv,
  buildBalanceteResumoContasCsv,
  sanitizeZipPathSegment,
} from '@/lib/balancete-zip-build'
