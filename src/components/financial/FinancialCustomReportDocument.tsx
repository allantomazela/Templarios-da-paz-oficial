import { ReportHeader } from '@/components/reports/ReportHeader'
import { formatCurrencyBRL, formatDateBR } from '@/lib/format-utils'
import type { AccountPeriodBreakdownResult } from '@/lib/cash-flow'
import type { PendingFinancialReportItem, PendingFinancialReportSummary } from '@/lib/financial-pending-report'
import type { FinancialCustomReportDisplayOptions } from '@/lib/financial-custom-report-display'
import type { Transaction } from '@/lib/data'

interface FinancialCustomReportDocumentProps {
  title: string
  periodLabel: string
  contentModeLabel: string
  accountFilterLabel?: string
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
}

export function FinancialCustomReportDocument({
  title,
  periodLabel,
  contentModeLabel,
  accountFilterLabel,
  display,
  pendingItems,
  pendingSummary,
  realizedTotals,
  incomeByCategory,
  expenseByCategory,
  accountBreakdown,
  transactions,
}: FinancialCustomReportDocumentProps) {
  const subtitleParts = [periodLabel, contentModeLabel, accountFilterLabel].filter(Boolean)

  return (
    <div className="balancete-document financial-summary-print-document w-full min-w-0 bg-white text-black">
      <ReportHeader title={title} subtitle={subtitleParts.join(' · ')} />

      {display.showSummary ? (
        <section className="balancete-section">
          <h3 className="balancete-section-title">Resumo geral</h3>
          <div className="balancete-table-wrap">
            <table className="balancete-table balancete-table-compact">
              <tbody>
                {display.showRealizedSummary ? (
                  <>
                    <tr>
                      <td>Receitas realizadas</td>
                      <td className="balancete-num balancete-credit">
                        {formatCurrencyBRL(realizedTotals.totalIncome)}
                      </td>
                    </tr>
                    <tr>
                      <td>Despesas realizadas</td>
                      <td className="balancete-num balancete-debit">
                        {formatCurrencyBRL(realizedTotals.totalExpense)}
                      </td>
                    </tr>
                    <tr>
                      <td>Saldo realizado</td>
                      <td className="balancete-num balancete-strong">
                        {formatCurrencyBRL(realizedTotals.balance)}
                      </td>
                    </tr>
                  </>
                ) : null}
                {display.showPendingSection ? (
                  <>
                    <tr>
                      <td>A receber (a vencer)</td>
                      <td className="balancete-num balancete-credit">
                        {formatCurrencyBRL(pendingSummary.totalReceivable)}
                      </td>
                    </tr>
                    <tr>
                      <td>A pagar (a vencer)</td>
                      <td className="balancete-num balancete-debit">
                        {formatCurrencyBRL(pendingSummary.totalPayable)}
                      </td>
                    </tr>
                    <tr>
                      <td>Saldo pendente</td>
                      <td className="balancete-num balancete-strong">
                        {formatCurrencyBRL(pendingSummary.netPending)}
                      </td>
                    </tr>
                  </>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {display.showPendingSection ? (
        <section className="balancete-section balancete-ledger-section">
          <h3 className="balancete-subsection-title">
            Valores a vencer / pendentes ({pendingItems.length})
          </h3>
          {pendingItems.length === 0 ? (
            <p className="balancete-muted text-sm">Nenhum valor pendente no período selecionado.</p>
          ) : (
            <div className="balancete-table-wrap">
              <table className="balancete-table balancete-table-ledger balancete-table-ledger-compact">
                <thead>
                  <tr>
                    <th className="balancete-col-date">Vencimento</th>
                    <th className="balancete-col-description">Descrição</th>
                    <th className="balancete-col-category">Categoria</th>
                    <th>Origem</th>
                    <th>Status</th>
                    <th>Tipo</th>
                    <th className="balancete-col-amount balancete-num">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingItems.map((item) => (
                    <tr key={item.id}>
                      <td className="balancete-col-date">{formatDateBR(item.dueDate)}</td>
                      <td className="balancete-col-description" title={item.description}>
                        {item.description}
                      </td>
                      <td className="balancete-col-category">{item.category}</td>
                      <td>{item.source === 'membership' ? 'Mensalidade' : 'Planejamento'}</td>
                      <td>{item.statusLabel}</td>
                      <td>{item.type}</td>
                      <td className="balancete-num">{formatCurrencyBRL(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="balancete-total-row">
                    <td colSpan={6}>Total pendente (líquido)</td>
                    <td className="balancete-num balancete-strong">
                      {formatCurrencyBRL(pendingSummary.netPending)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </section>
      ) : null}

      {display.showAccountBreakdown && accountBreakdown.rows.length > 0 ? (
        <section className="balancete-section">
          <h3 className="balancete-section-title">Movimentação por conta (realizado)</h3>
          <div className="balancete-table-wrap">
            <table className="balancete-table balancete-table-compact">
              <thead>
                <tr>
                  <th>Conta</th>
                  <th className="balancete-num">Receitas</th>
                  <th className="balancete-num">Despesas</th>
                  <th className="balancete-num">Líquido</th>
                </tr>
              </thead>
              <tbody>
                {accountBreakdown.rows.map((row) => (
                  <tr key={row.accountId}>
                    <td>{row.accountName}</td>
                    <td className="balancete-num balancete-credit">
                      {formatCurrencyBRL(row.periodIncome)}
                    </td>
                    <td className="balancete-num balancete-debit">
                      {formatCurrencyBRL(row.periodExpense)}
                    </td>
                    <td className="balancete-num">{formatCurrencyBRL(row.netCashFlow)}</td>
                  </tr>
                ))}
                <tr className="balancete-total-row">
                  <td>{accountBreakdown.totals.accountName}</td>
                  <td className="balancete-num">
                    {formatCurrencyBRL(accountBreakdown.totals.periodIncome)}
                  </td>
                  <td className="balancete-num">
                    {formatCurrencyBRL(accountBreakdown.totals.periodExpense)}
                  </td>
                  <td className="balancete-num">
                    {formatCurrencyBRL(accountBreakdown.totals.netCashFlow)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {(display.showIncomeCategories || display.showExpenseCategories) && (
        <section className="balancete-section balancete-categories-grid">
          {display.showIncomeCategories ? (
            <CategoryBlock title="Receitas por categoria" items={incomeByCategory} />
          ) : null}
          {display.showExpenseCategories ? (
            <CategoryBlock title="Despesas por categoria" items={expenseByCategory} />
          ) : null}
        </section>
      )}

      {display.showRealizedLedger && transactions.length > 0 ? (
        <section className="balancete-section balancete-ledger-section">
          <h3 className="balancete-subsection-title">Lançamentos realizados</h3>
          <div className="balancete-table-wrap">
            <table className="balancete-table balancete-table-ledger balancete-table-ledger-compact">
              <thead>
                <tr>
                  <th className="balancete-col-date">Data</th>
                  <th className="balancete-col-description">Descrição</th>
                  <th className="balancete-col-category">Categoria</th>
                  <th>Tipo</th>
                  {display.showAttachmentDetails ? (
                    <th className="balancete-col-notes">Observações</th>
                  ) : null}
                  <th className="balancete-col-amount balancete-num">Valor</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="balancete-col-date">{formatDateBR(transaction.date)}</td>
                    <td className="balancete-col-description" title={transaction.description}>
                      {transaction.description}
                    </td>
                    <td className="balancete-col-category">{transaction.category}</td>
                    <td>{transaction.type}</td>
                    {display.showAttachmentDetails ? (
                      <td className="balancete-col-notes">
                        {transaction.attachmentNotes?.trim() || '—'}
                      </td>
                    ) : null}
                    <td className="balancete-num">{formatCurrencyBRL(transaction.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {display.showDocumentFooter ? (
        <p className="balancete-footer">
          Relatório personalizado gerado pelo módulo financeiro. Valores a vencer consideram
          vencimento no período (planejamento e mensalidades). Movimentações realizadas usam a
          data do lançamento no caixa.
        </p>
      ) : null}
    </div>
  )
}

function CategoryBlock({
  title,
  items,
}: {
  title: string
  items: { category: string; amount: number }[]
}) {
  return (
    <div className="balancete-category-block">
      <h4 className="balancete-subsection-title">{title}</h4>
      <div className="balancete-table-wrap">
        <table className="balancete-table balancete-table-compact">
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={2} className="balancete-muted">
                  Sem lançamentos
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.category}>
                  <td>{item.category}</td>
                  <td className="balancete-num">{formatCurrencyBRL(item.amount)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
