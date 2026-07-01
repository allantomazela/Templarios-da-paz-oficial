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
          <div className="balancete-table-wrap">
            <table className="balancete-table">
              <thead>
                <tr>
                  <th>Mês</th>
                  <th className="balancete-num">Prev. receitas</th>
                  <th className="balancete-num">Real. receitas</th>
                  <th className="balancete-num">Prev. despesas</th>
                  <th className="balancete-num">Real. despesas</th>
                  <th className="balancete-num">Economia</th>
                  <th className="balancete-num">Líq. previsto</th>
                  <th className="balancete-num">Líq. realizado</th>
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
                    <td className="balancete-num">
                      {formatCurrencyBRL(row.expectedExpense)}
                    </td>
                    <td className="balancete-num balancete-debit">
                      {formatCurrencyBRL(row.realizedExpense)}
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

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
          cobrança; demais itens exigem vínculo explícito nas transações.
        </p>
      ) : null}
    </div>
  )
}
