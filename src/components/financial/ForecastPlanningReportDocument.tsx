import type { ForecastProjectionResult } from '@/lib/forecast-types'
import { formatCurrencyBRL, formatDateBR } from '@/lib/format-utils'
import {
  buildForecastPlanningSummaryRows,
  computeTotalEconomyAcrossMonths,
} from '@/lib/forecast-report-export'
import {
  getForecastRowStatusLabel,
  isForecastEconomyRow,
} from '@/lib/forecast-projection'
import type { ForecastReportDisplayOptions } from '@/lib/forecast-report-display'
import { ReportHeader } from '@/components/reports/ReportHeader'
import { cn } from '@/lib/utils'

const FORECAST_PRINT_PAGE_STYLE = `
  @page { size: A4 landscape; margin: 10mm; }
  @media print {
    body {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  }
`

export { FORECAST_PRINT_PAGE_STYLE }

interface ForecastPlanningReportDocumentProps {
  projection: ForecastProjectionResult
  periodLabel: string
  generatedAt: string
  display: ForecastReportDisplayOptions
  monthScope: 'all' | number
}

export function ForecastPlanningReportDocument({
  projection,
  periodLabel,
  generatedAt,
  display,
  monthScope,
}: ForecastPlanningReportDocumentProps) {
  const summaryRows = buildForecastPlanningSummaryRows(projection)
  const totalEconomy = computeTotalEconomyAcrossMonths(projection.months)
  const detailMonths =
    monthScope === 'all'
      ? projection.months
      : projection.months.filter((_, index) => index === monthScope)

  return (
    <div className="balancete-document w-full min-w-0 bg-white text-black">
      <ReportHeader
        title="Planejamento Financeiro — Previsto × Realizado"
        subtitle={periodLabel}
      />

      {display.showGlobalMetrics ? (
        <section className="balancete-section">
          <h3 className="balancete-section-title">Indicadores gerais</h3>
          <div className="balancete-table-wrap">
            <table className="balancete-table balancete-table-compact">
              <tbody>
                <tr>
                  <td>Saldo atual (todas as contas)</td>
                  <td className="balancete-num balancete-strong">
                    {formatCurrencyBRL(projection.globalCurrentBalance)}
                  </td>
                </tr>
                <tr>
                  <td>Saldo projetado (horizonte de 3 meses)</td>
                  <td className="balancete-num balancete-strong">
                    {formatCurrencyBRL(projection.globalProjectedBalance)}
                  </td>
                </tr>
                {totalEconomy > 0 ? (
                  <tr>
                    <td>Economia acumulada no período</td>
                    <td className="balancete-num balancete-credit">
                      {formatCurrencyBRL(totalEconomy)}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {display.showMonthSummary ? (
        <section className="balancete-section">
          <h3 className="balancete-section-title">Resumo por mês</h3>
          <p className="balancete-muted mb-2 text-xs">
            &quot;Real. planejamento&quot; considera itens previstos e mensalidades. &quot;Caixa
            (fluxo)&quot; soma todas as movimentações do mês, como no relatório de fluxo de
            caixa.
          </p>
          <div className="balancete-table-wrap">
            <table className="balancete-table">
              <thead>
                <tr>
                  <th>Mês</th>
                  <th className="balancete-num">Prev. receitas</th>
                  <th className="balancete-num">Real. planej.</th>
                  <th className="balancete-num">Caixa receitas</th>
                  <th className="balancete-num">Prev. despesas</th>
                  <th className="balancete-num">Real. planej.</th>
                  <th className="balancete-num">Caixa despesas</th>
                  <th className="balancete-num">Economia</th>
                  <th className="balancete-num">Líq. previsto</th>
                  <th className="balancete-num">Líq. planej.</th>
                  <th className="balancete-num">Líq. caixa</th>
                  <th className="balancete-num">Fora do prev.</th>
                </tr>
              </thead>
              <tbody>
                {summaryRows.map((row) => (
                  <tr key={row.label}>
                    <td>{row.label}</td>
                    <td className="balancete-num">
                      {formatCurrencyBRL(row.expectedIncome)}
                    </td>
                    <td className="balancete-num balancete-credit">
                      {formatCurrencyBRL(row.realizedIncome)}
                    </td>
                    <td className="balancete-num balancete-credit">
                      {formatCurrencyBRL(row.cashFlowIncome)}
                    </td>
                    <td className="balancete-num">
                      {formatCurrencyBRL(row.expectedExpense)}
                    </td>
                    <td className="balancete-num balancete-debit">
                      {formatCurrencyBRL(row.realizedExpense)}
                    </td>
                    <td className="balancete-num balancete-debit">
                      {formatCurrencyBRL(row.cashFlowExpense)}
                    </td>
                    <td className="balancete-num balancete-credit">
                      {row.economyTotal > 0
                        ? formatCurrencyBRL(row.economyTotal)
                        : '—'}
                    </td>
                    <td className="balancete-num">{formatCurrencyBRL(row.netExpected)}</td>
                    <td className="balancete-num balancete-strong">
                      {formatCurrencyBRL(row.netRealized)}
                    </td>
                    <td className="balancete-num balancete-strong">
                      {formatCurrencyBRL(row.cashFlowNet)}
                    </td>
                    <td
                      className={cn(
                        'balancete-num',
                        row.unplannedNet > 0
                          ? 'balancete-credit'
                          : row.unplannedNet < 0
                            ? 'balancete-debit'
                            : '',
                      )}
                    >
                      {row.unplannedNet === 0
                        ? '—'
                        : formatCurrencyBRL(row.unplannedNet)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {display.showCashFlowComparison
        ? detailMonths.map((month) => (
            <section
              key={`cashflow-${month.year}-${month.month}`}
              className="balancete-section"
            >
              <h3 className="balancete-section-title">
                Fluxo de caixa — {month.label}
              </h3>
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
                    {month.cashFlow.accounts.map((account) => (
                      <tr key={account.accountId}>
                        <td>{account.accountName}</td>
                        <td className="balancete-num balancete-credit">
                          {formatCurrencyBRL(account.periodIncome)}
                        </td>
                        <td className="balancete-num balancete-debit">
                          {formatCurrencyBRL(account.periodExpense)}
                        </td>
                        <td className="balancete-num balancete-strong">
                          {formatCurrencyBRL(account.netCashFlow)}
                        </td>
                      </tr>
                    ))}
                    <tr className="balancete-total-row">
                      <td>{month.cashFlow.totals.accountName}</td>
                      <td className="balancete-num balancete-credit">
                        {formatCurrencyBRL(month.cashFlow.totals.periodIncome)}
                      </td>
                      <td className="balancete-num balancete-debit">
                        {formatCurrencyBRL(month.cashFlow.totals.periodExpense)}
                      </td>
                      <td className="balancete-num balancete-strong">
                        {formatCurrencyBRL(month.cashFlow.totals.netCashFlow)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          ))
        : null}

      {display.showUnplannedTransactions
        ? detailMonths
            .filter((month) => month.cashFlow.unplannedTransactions.length > 0)
            .map((month) => (
              <section
                key={`unplanned-${month.year}-${month.month}`}
                className="balancete-section balancete-ledger-section"
              >
                <h3 className="balancete-subsection-title">
                  Lançamentos fora do previsto — {month.label}
                </h3>
                <p className="balancete-muted mb-2 text-xs">
                  Movimentações do mês que não entram no previsto × realizado (sem vínculo
                  com item de planejamento e que não são mensalidades).
                </p>
                <div className="balancete-table-wrap">
                  <table className="balancete-table balancete-table-ledger-compact">
                    <thead>
                      <tr>
                        <th className="balancete-col-date">Data</th>
                        <th className="balancete-col-description">Descrição</th>
                        <th className="balancete-col-category">Categoria</th>
                        <th>Conta</th>
                        <th>Tipo</th>
                        <th className="balancete-col-amount balancete-num">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {month.cashFlow.unplannedTransactions.map((transaction) => (
                        <tr key={transaction.id}>
                          <td className="balancete-col-date">
                            {formatDateBR(transaction.date)}
                          </td>
                          <td className="balancete-col-description">
                            {transaction.description}
                          </td>
                          <td className="balancete-col-category">
                            {transaction.category}
                          </td>
                          <td>{transaction.accountName ?? '—'}</td>
                          <td>{transaction.type}</td>
                          <td
                            className={cn(
                              'balancete-num',
                              transaction.type === 'Receita'
                                ? 'balancete-credit'
                                : 'balancete-debit',
                            )}
                          >
                            {formatCurrencyBRL(transaction.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="balancete-total-row">
                        <td colSpan={5}>Total fora do previsto (líquido)</td>
                        <td
                          className={cn(
                            'balancete-num balancete-strong',
                            month.cashFlow.unplannedNet >= 0
                              ? 'balancete-credit'
                              : 'balancete-debit',
                          )}
                        >
                          {formatCurrencyBRL(month.cashFlow.unplannedNet)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </section>
            ))
        : null}

      {display.showAccountProjections && projection.accountProjections.length > 0 ? (
        <section className="balancete-section">
          <h3 className="balancete-section-title">Projeção por conta bancária</h3>
          <div className="balancete-table-wrap">
            <table className="balancete-table balancete-table-compact">
              <thead>
                <tr>
                  <th>Conta</th>
                  <th className="balancete-num">Saldo atual</th>
                  <th className="balancete-num">Receitas pendentes</th>
                  <th className="balancete-num">Despesas pendentes</th>
                  <th className="balancete-num">Saldo projetado</th>
                </tr>
              </thead>
              <tbody>
                {projection.accountProjections.map((account) => (
                  <tr key={account.accountId}>
                    <td>{account.accountName}</td>
                    <td className="balancete-num">
                      {formatCurrencyBRL(account.currentBalance)}
                    </td>
                    <td className="balancete-num balancete-credit">
                      {formatCurrencyBRL(account.expectedIncomeRemaining)}
                    </td>
                    <td className="balancete-num balancete-debit">
                      {formatCurrencyBRL(account.expectedExpenseRemaining)}
                    </td>
                    <td className="balancete-num balancete-strong">
                      {formatCurrencyBRL(account.projectedBalance)}
                    </td>
                  </tr>
                ))}
                <tr className="balancete-total-row">
                  <td>{projection.accountProjectionsTotals.accountName}</td>
                  <td className="balancete-num">
                    {formatCurrencyBRL(projection.accountProjectionsTotals.currentBalance)}
                  </td>
                  <td className="balancete-num balancete-credit">
                    {formatCurrencyBRL(
                      projection.accountProjectionsTotals.expectedIncomeRemaining,
                    )}
                  </td>
                  <td className="balancete-num balancete-debit">
                    {formatCurrencyBRL(
                      projection.accountProjectionsTotals.expectedExpenseRemaining,
                    )}
                  </td>
                  <td className="balancete-num balancete-strong">
                    {formatCurrencyBRL(projection.accountProjectionsTotals.projectedBalance)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {display.showComparisonByMonth
        ? detailMonths.map((month) => (
            <section
              key={`${month.year}-${month.month}`}
              className="balancete-section balancete-ledger-section"
            >
              <h3 className="balancete-subsection-title">
                Detalhamento — {month.label}
              </h3>
              <div className="balancete-table-wrap">
                <table className="balancete-table balancete-table-ledger-compact">
                  <thead>
                    <tr>
                      <th className="balancete-col-date">Vencimento</th>
                      <th className="balancete-col-description">Descrição</th>
                      <th className="balancete-col-category">Categoria</th>
                      <th className="balancete-col-amount balancete-num">Previsto</th>
                      <th className="balancete-col-amount balancete-num">Realizado</th>
                      <th className="balancete-col-amount balancete-num">Variação</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {month.rows.map((row) => (
                      <tr
                        key={row.id}
                        className={cn(isForecastEconomyRow(row) && 'balancete-economy-row')}
                      >
                        <td className="balancete-col-date">
                          {formatDateBR(row.dueDate)}
                        </td>
                        <td className="balancete-col-description">{row.description}</td>
                        <td className="balancete-col-category">{row.categoryName}</td>
                        <td className="balancete-num">
                          {formatCurrencyBRL(row.expectedAmount)}
                        </td>
                        <td className="balancete-num">
                          {formatCurrencyBRL(row.realizedAmount)}
                        </td>
                        <td
                          className={cn(
                            'balancete-num',
                            isForecastEconomyRow(row)
                              ? 'balancete-credit balancete-strong'
                              : row.variance < 0
                                ? 'balancete-debit'
                                : '',
                          )}
                        >
                          {formatCurrencyBRL(row.variance)}
                        </td>
                        <td>{getForecastRowStatusLabel(row)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))
        : null}

      {display.showDocumentFooter ? (
        <p className="balancete-footer">
          Documento gerado em {generatedAt} pelo módulo financeiro. Horizonte de
          planejamento: {periodLabel}. Mensalidades utilizam o cronograma de
          cobrança; demais itens exigem vínculo explícito nas transações. Colunas
          &quot;Caixa&quot; refletem todas as movimentações do mês (fluxo de caixa).
        </p>
      ) : null}
    </div>
  )
}
