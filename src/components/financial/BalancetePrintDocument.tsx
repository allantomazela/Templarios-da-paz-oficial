import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ReportHeader } from '@/components/reports/ReportHeader'
import { formatCurrencyBRL, formatDateBR } from '@/lib/format-utils'
import type { AccountingBalanceteData } from '@/lib/accounting-balancete'

interface BalancetePrintDocumentProps {
  title: string
  periodLabel: string
  accountFilterLabel?: string
  data: AccountingBalanceteData
}

export function BalancetePrintDocument({
  title,
  periodLabel,
  accountFilterLabel,
  data,
}: BalancetePrintDocumentProps) {
  const subtitle = accountFilterLabel
    ? `${periodLabel} — ${accountFilterLabel}`
    : periodLabel

  return (
    <div className="bg-white text-black">
      <ReportHeader title={title} subtitle={subtitle} />

      <section className="mb-6">
        <h3 className="mb-2 text-sm font-bold uppercase tracking-wide">
          Resumo consolidado
        </h3>
        <Table>
          <TableHeader>
            <TableRow className="border-black">
              <TableHead className="text-black">Conta</TableHead>
              <TableHead className="text-right text-black">Saldo inicial</TableHead>
              <TableHead className="text-right text-black">Créditos</TableHead>
              <TableHead className="text-right text-black">Débitos</TableHead>
              <TableHead className="text-right text-black">Saldo final</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.accountSections.map((section) => (
              <TableRow key={section.accountId} className="border-gray-300">
                <TableCell className="font-medium">{section.accountName}</TableCell>
                <TableCell className="text-right">
                  {formatCurrencyBRL(section.openingBalance)}
                </TableCell>
                <TableCell className="text-right text-green-700">
                  {formatCurrencyBRL(section.totalCredits)}
                </TableCell>
                <TableCell className="text-right text-red-700">
                  {formatCurrencyBRL(section.totalDebits)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrencyBRL(section.closingBalance)}
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="border-t-2 border-black font-bold">
              <TableCell>{data.totalsRow.accountName}</TableCell>
              <TableCell className="text-right">
                {formatCurrencyBRL(data.totalsRow.openingBalance)}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrencyBRL(data.totalsRow.totalCredits)}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrencyBRL(data.totalsRow.totalDebits)}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrencyBRL(data.totalsRow.closingBalance)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </section>

      <div className="mb-6 grid grid-cols-2 gap-6">
        <CategoryPrintBlock title="Receitas por categoria" data={data.incomeByCategory} />
        <CategoryPrintBlock title="Despesas por categoria" data={data.expenseByCategory} />
      </div>

      {data.accountSections.map((section) => (
        <AccountLedgerSection key={section.accountId} section={section} />
      ))}

      {data.unassignedEntries.length > 0 && (
        <AccountLedgerSection
          section={{
            accountId: 'unassigned',
            accountName: 'Lançamentos sem conta vinculada',
            accountType: '',
            openingBalance: 0,
            totalCredits: data.unassignedEntries
              .filter((entry) => entry.type === 'Receita')
              .reduce((sum, entry) => sum + entry.amount, 0),
            totalDebits: data.unassignedEntries
              .filter((entry) => entry.type === 'Despesa')
              .reduce((sum, entry) => sum + entry.amount, 0),
            closingBalance: 0,
            entries: data.unassignedEntries,
          }}
        />
      )}

      <p className="mt-8 border-t pt-4 text-[10px] text-gray-600">
        Documento gerado pelo sistema financeiro. Comprovantes digitais (notas fiscais e recibos)
        estão arquivados no sistema e listados por lançamento abaixo. Total de{' '}
        {data.periodTransactionCount} movimentação(ões) no período.
      </p>
    </div>
  )
}

interface CategoryPrintBlockProps {
  title: string
  data: Record<string, number>
}

function CategoryPrintBlock({ title, data }: CategoryPrintBlockProps) {
  const entries = Object.entries(data)

  return (
    <div>
      <h4 className="mb-2 text-sm font-bold">{title}</h4>
      <Table>
        <TableBody>
          {entries.length === 0 ? (
            <TableRow>
              <TableCell colSpan={2} className="text-muted-foreground">
                Sem lançamentos
              </TableCell>
            </TableRow>
          ) : (
            entries.map(([category, amount]) => (
              <TableRow key={category} className="border-gray-200">
                <TableCell>{category}</TableCell>
                <TableCell className="text-right">{formatCurrencyBRL(amount)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

interface AccountLedgerSectionProps {
  section: AccountingBalanceteData['accountSections'][number]
}

function AccountLedgerSection({ section }: AccountLedgerSectionProps) {
  if (section.entries.length === 0) return null

  return (
    <section className="mb-8 break-inside-avoid">
      <h3 className="mb-2 border-b border-gray-300 pb-1 text-sm font-bold">
        Razão analítico — {section.accountName}
        {section.accountType ? ` (${section.accountType})` : ''}
      </h3>

      <Table className="text-[10px] print:text-[9px]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[72px]">Data</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead className="text-right">Crédito</TableHead>
            <TableHead className="text-right">Débito</TableHead>
            <TableHead>Observações / Comprovantes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {section.entries.map((entry) => (
            <TableRow key={entry.id} className="align-top border-gray-200">
              <TableCell>{formatDateBR(entry.date)}</TableCell>
              <TableCell>{entry.description}</TableCell>
              <TableCell>{entry.category}</TableCell>
              <TableCell className="text-right text-green-700">
                {entry.credit > 0 ? formatCurrencyBRL(entry.credit) : '—'}
              </TableCell>
              <TableCell className="text-right text-red-700">
                {entry.debit > 0 ? formatCurrencyBRL(entry.debit) : '—'}
              </TableCell>
              <TableCell>
                {entry.attachmentNotes && (
                  <p className="mb-1">
                    <span className="font-medium">Obs:</span> {entry.attachmentNotes}
                  </p>
                )}
                {entry.attachments.length > 0 ? (
                  <ul className="space-y-0.5">
                    {entry.attachments.map((attachment) => (
                      <li key={`${entry.id}-${attachment.fileName}`}>
                        {attachment.documentTypeLabel}: {attachment.fileName}
                      </li>
                    ))}
                  </ul>
                ) : (
                  !entry.attachmentNotes && (
                    <span className="text-gray-500">Sem comprovante anexado</span>
                  )
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  )
}
