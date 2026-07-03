import { ReportHeader } from '@/components/reports/ReportHeader'
import { formatCurrencyBRL, formatDateBR } from '@/lib/format-utils'
import type { AccountingBalanceteData, BalanceteTypeFilter } from '@/lib/accounting-balancete'
import { BALANCETE_TYPE_FILTER_LABELS } from '@/lib/accounting-balancete'
import type { BalanceteReportDisplayOptions } from '@/lib/balancete-report-display'
import { cn } from '@/lib/utils'

interface BalancetePrintDocumentProps {
  title: string
  periodLabel: string
  accountFilterLabel?: string
  data: AccountingBalanceteData
  display: BalanceteReportDisplayOptions
}

export function BalancetePrintDocument({
  title,
  periodLabel,
  accountFilterLabel,
  data,
  display,
}: BalancetePrintDocumentProps) {
  const subtitleParts = [periodLabel, BALANCETE_TYPE_FILTER_LABELS[data.typeFilter]]
  if (accountFilterLabel) subtitleParts.push(accountFilterLabel)

  const showCategorySection =
    display.showIncomeCategories || display.showExpenseCategories

  return (
    <div className="balancete-document w-full min-w-0 bg-white text-black">
      <ReportHeader title={title} subtitle={subtitleParts.join(' · ')} />

      {display.showSummary && (
        <section className="balancete-section">
          <h3 className="balancete-section-title">Resumo consolidado</h3>
          <div className="balancete-table-wrap">
            <SummaryTable data={data} />
          </div>
        </section>
      )}

      {showCategorySection && (
        <section className="balancete-section balancete-categories-grid">
          {display.showIncomeCategories && (
            <CategoryBlock title="Receitas por categoria" data={data.incomeByCategory} />
          )}
          {display.showExpenseCategories && (
            <CategoryBlock title="Despesas por categoria" data={data.expenseByCategory} />
          )}
        </section>
      )}

      {display.showLedger &&
        data.accountSections.map((section) => (
          <LedgerSection
            key={section.accountId}
            section={section}
            typeFilter={data.typeFilter}
            showAttachmentDetails={display.showAttachmentDetails}
          />
        ))}

      {display.showLedger && data.unassignedEntries.length > 0 && (
        <LedgerSection
          typeFilter={data.typeFilter}
          showAttachmentDetails={display.showAttachmentDetails}
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

      {display.showDocumentFooter && (
        <p className="balancete-footer">
          Documento gerado pelo sistema financeiro.
          {display.showAttachmentDetails
            ? ' Comprovantes digitais estão arquivados no sistema e listados por lançamento.'
            : ''}{' '}
          Total de {data.periodTransactionCount} movimentação(ões) no período filtrado.
        </p>
      )}
    </div>
  )
}

function SummaryTable({ data }: { data: AccountingBalanceteData }) {
  if (data.typeFilter === 'all') {
    return (
      <table className="balancete-table">
        <thead>
          <tr>
            <th>Conta</th>
            <th className="balancete-num">Saldo inicial</th>
            <th className="balancete-num">Créditos</th>
            <th className="balancete-num">Débitos</th>
            <th className="balancete-num">Saldo final</th>
          </tr>
        </thead>
        <tbody>
          {data.accountSections.map((section) => (
            <tr key={section.accountId}>
              <td>{section.accountName}</td>
              <td className="balancete-num">{formatCurrencyBRL(section.openingBalance)}</td>
              <td className="balancete-num balancete-credit">
                {formatCurrencyBRL(section.totalCredits)}
              </td>
              <td className="balancete-num balancete-debit">
                {formatCurrencyBRL(section.totalDebits)}
              </td>
              <td className="balancete-num balancete-strong">
                {formatCurrencyBRL(section.closingBalance)}
              </td>
            </tr>
          ))}
          <tr className="balancete-total-row">
            <td>{data.totalsRow.accountName}</td>
            <td className="balancete-num">{formatCurrencyBRL(data.totalsRow.openingBalance)}</td>
            <td className="balancete-num">{formatCurrencyBRL(data.totalsRow.totalCredits)}</td>
            <td className="balancete-num">{formatCurrencyBRL(data.totalsRow.totalDebits)}</td>
            <td className="balancete-num">{formatCurrencyBRL(data.totalsRow.closingBalance)}</td>
          </tr>
        </tbody>
      </table>
    )
  }

  const amountLabel = data.typeFilter === 'Receita' ? 'Total receitas' : 'Total despesas'

  return (
    <table className="balancete-table">
      <thead>
        <tr>
          <th>Conta</th>
          <th className="balancete-num">Lançamentos</th>
          <th className="balancete-num">{amountLabel}</th>
        </tr>
      </thead>
      <tbody>
        {data.accountSections.map((section) => (
          <tr key={section.accountId}>
            <td>{section.accountName}</td>
            <td className="balancete-num">{section.entries.length}</td>
            <td
              className={cn(
                'balancete-num balancete-strong',
                data.typeFilter === 'Receita' ? 'balancete-credit' : 'balancete-debit',
              )}
            >
              {formatCurrencyBRL(section.closingBalance)}
            </td>
          </tr>
        ))}
        <tr className="balancete-total-row">
          <td>{data.totalsRow.accountName}</td>
          <td className="balancete-num">{data.periodTransactionCount}</td>
          <td className="balancete-num">{formatCurrencyBRL(data.totalsRow.closingBalance)}</td>
        </tr>
      </tbody>
    </table>
  )
}

interface CategoryBlockProps {
  title: string
  data: Record<string, number>
}

function CategoryBlock({ title, data }: CategoryBlockProps) {
  const entries = Object.entries(data)

  return (
    <div className="balancete-category-block">
      <h4 className="balancete-subsection-title">{title}</h4>
      <div className="balancete-table-wrap">
        <table className="balancete-table balancete-table-compact">
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={2} className="balancete-muted">
                  Sem lançamentos
                </td>
              </tr>
            ) : (
              entries.map(([category, amount]) => (
                <tr key={category}>
                  <td>{category}</td>
                  <td className="balancete-num">{formatCurrencyBRL(amount)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

interface LedgerSectionProps {
  section: AccountingBalanceteData['accountSections'][number]
  typeFilter: BalanceteTypeFilter
  showAttachmentDetails: boolean
}

function LedgerSection({ section, typeFilter, showAttachmentDetails }: LedgerSectionProps) {
  if (section.entries.length === 0) return null

  const showBothAmountColumns = typeFilter === 'all'

  return (
    <section className="balancete-section balancete-ledger-section">
      <h3 className="balancete-subsection-title">
        Razão analítico — {section.accountName}
        {section.accountType ? ` (${section.accountType})` : ''}
      </h3>

      <div className="balancete-table-wrap">
        <table
          className={cn(
            'balancete-table balancete-table-ledger',
            !showAttachmentDetails && 'balancete-table-ledger-compact',
          )}
        >
          <thead>
            <tr>
              <th className="balancete-col-date">Data</th>
              <th className="balancete-col-description">Descrição</th>
              <th className="balancete-col-category">Categoria</th>
              {showBothAmountColumns ? (
                <>
                  <th className="balancete-num balancete-col-amount">Crédito</th>
                  <th className="balancete-num balancete-col-amount">Débito</th>
                </>
              ) : (
                <th className="balancete-num balancete-col-amount">Valor</th>
              )}
              {showAttachmentDetails && (
                <th className="balancete-col-notes">Observações / Comprovantes</th>
              )}
            </tr>
          </thead>
          <tbody>
            {section.entries.map((entry) => (
              <tr key={entry.id}>
                <td className="balancete-col-date">{formatDateBR(entry.date)}</td>
                <td className="balancete-col-description">{entry.description}</td>
                <td className="balancete-col-category">{entry.category}</td>
                {showBothAmountColumns ? (
                  <>
                    <td className="balancete-num balancete-credit">
                      {entry.credit > 0 ? formatCurrencyBRL(entry.credit) : '—'}
                    </td>
                    <td className="balancete-num balancete-debit">
                      {entry.debit > 0 ? formatCurrencyBRL(entry.debit) : '—'}
                    </td>
                  </>
                ) : (
                  <td
                    className={cn(
                      'balancete-num balancete-strong',
                      entry.type === 'Receita' ? 'balancete-credit' : 'balancete-debit',
                    )}
                  >
                    {formatCurrencyBRL(entry.amount)}
                  </td>
                )}
                {showAttachmentDetails && (
                  <td className="balancete-col-notes">
                    {entry.attachmentNotes?.trim() ? (
                      <p className="balancete-note-line">
                        <span className="balancete-strong">Obs:</span>{' '}
                        {entry.attachmentNotes.trim()}
                      </p>
                    ) : null}
                    {entry.attachments.length > 0 ? (
                      <ul className="balancete-attachment-list">
                        {entry.attachments.map((attachment) => (
                          <li key={`${entry.id}-${attachment.fileName}`}>
                            {attachment.documentTypeLabel}: {attachment.fileName}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      !entry.attachmentNotes?.trim() && (
                        <span className="balancete-muted">Sem observação ou comprovante</span>
                      )
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
