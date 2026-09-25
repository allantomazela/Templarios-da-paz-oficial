import { ReportHeader } from '@/components/reports/ReportHeader'
import { formatCurrencyBRL, formatDateBR } from '@/lib/format-utils'
import { membershipStatusLabel } from '@/lib/membership-schedule'
import type { MembershipPaidByBrotherReportData } from '@/lib/membership-open-paid-report'

interface MembershipPaidByBrotherReportDocumentProps {
  data: MembershipPaidByBrotherReportData
}

export function MembershipPaidByBrotherReportDocument({
  data,
}: MembershipPaidByBrotherReportDocumentProps) {
  const scopeLabel = data.selectedBrotherId
    ? data.rows[0]?.brotherName ?? 'Irmão selecionado'
    : 'Todos os irmãos'

  return (
    <div className="balancete-document financial-summary-print-document w-full min-w-0 bg-white text-black">
      <ReportHeader
        title="Relatório de Mensalidades Pagas por Irmão"
        subtitle={`Conferência de pagamentos — ${scopeLabel}`}
      />

      <section className="balancete-section">
        <h3 className="balancete-section-title">Resumo</h3>
        <div className="balancete-table-wrap">
          <table className="balancete-table balancete-table-compact">
            <tbody>
              <tr>
                <td>Irmãos com pagamento</td>
                <td className="balancete-num balancete-strong">
                  {data.summary.brotherCount}
                </td>
              </tr>
              <tr>
                <td>Meses com pagamento</td>
                <td className="balancete-num">{data.summary.paidMonthCount}</td>
              </tr>
              <tr>
                <td>Total pago</td>
                <td className="balancete-num balancete-credit balancete-strong">
                  {formatCurrencyBRL(data.summary.totalPaidAmount)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {data.rows.length === 0 ? (
        <p className="balancete-muted text-sm">
          Nenhum pagamento de mensalidade encontrado para o filtro atual.
        </p>
      ) : (
        <>
          <section className="balancete-section">
            <h3 className="balancete-subsection-title">Por irmão</h3>
            <div className="balancete-table-wrap">
              <table className="balancete-table balancete-table-compact">
                <thead>
                  <tr>
                    <th>Irmão</th>
                    <th className="balancete-num">Meses pagos</th>
                    <th>Períodos</th>
                    <th className="balancete-num">Total pago</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row) => (
                    <tr key={row.brotherId}>
                      <td>{row.brotherName}</td>
                      <td className="balancete-num">{row.paidMonthCount}</td>
                      <td>{row.periodsLabel}</td>
                      <td className="balancete-num balancete-credit">
                        {formatCurrencyBRL(row.totalPaidAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="balancete-section balancete-ledger-section">
            <h3 className="balancete-subsection-title">Detalhamento por mês</h3>
            <div className="balancete-table-wrap">
              <table className="balancete-table balancete-table-ledger balancete-table-ledger-compact">
                <thead>
                  <tr>
                    <th>Irmão</th>
                    <th>Referência</th>
                    <th>Vencimento</th>
                    <th className="balancete-num">Previsto</th>
                    <th className="balancete-num">Pago</th>
                    <th className="balancete-num">Em aberto</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.flatMap((row) =>
                    row.entries.map((entry) => (
                      <tr key={`${row.brotherId}-${entry.year}-${entry.month}`}>
                        <td>{row.brotherName}</td>
                        <td>{entry.periodLabel}</td>
                        <td>{formatDateBR(entry.dueDate)}</td>
                        <td className="balancete-num">
                          {formatCurrencyBRL(entry.expectedAmount)}
                        </td>
                        <td className="balancete-num balancete-credit">
                          {formatCurrencyBRL(entry.paidAmount)}
                        </td>
                        <td className="balancete-num">
                          {formatCurrencyBRL(entry.remainingAmount)}
                        </td>
                        <td>{membershipStatusLabel(entry.status)}</td>
                      </tr>
                    )),
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      <p className="balancete-muted mt-4 text-xs">
        Relatório gerado em {formatDateBR(data.summary.generatedAt)} pelo módulo
        financeiro.
      </p>
    </div>
  )
}
