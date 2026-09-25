import { ReportHeader } from '@/components/reports/ReportHeader'
import { formatCurrencyBRL, formatDateBR } from '@/lib/format-utils'
import { membershipStatusLabel } from '@/lib/membership-schedule'
import type { MembershipOpenReportData } from '@/lib/membership-open-paid-report'

interface MembershipOpenReportDocumentProps {
  data: MembershipOpenReportData
}

export function MembershipOpenReportDocument({
  data,
}: MembershipOpenReportDocumentProps) {
  return (
    <div className="balancete-document financial-summary-print-document w-full min-w-0 bg-white text-black">
      <ReportHeader
        title="Relatório de Mensalidades em Aberto"
        subtitle="Pendências e atrasos por irmão para cobrança da tesouraria"
      />

      <section className="balancete-section">
        <h3 className="balancete-section-title">Resumo</h3>
        <div className="balancete-table-wrap">
          <table className="balancete-table balancete-table-compact">
            <tbody>
              <tr>
                <td>Irmãos com mensalidade em aberto</td>
                <td className="balancete-num balancete-strong">
                  {data.summary.brotherCount}
                </td>
              </tr>
              <tr>
                <td>Meses em aberto</td>
                <td className="balancete-num">{data.summary.openMonthCount}</td>
              </tr>
              <tr>
                <td>Valor total em aberto</td>
                <td className="balancete-num balancete-debit balancete-strong">
                  {formatCurrencyBRL(data.summary.totalOpenAmount)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {data.rows.length === 0 ? (
        <p className="balancete-muted text-sm">
          Não há mensalidades em aberto na data de referência.
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
                    <th className="balancete-num">Meses</th>
                    <th>Períodos</th>
                    <th className="balancete-num">Em aberto</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row) => (
                    <tr key={row.brotherId}>
                      <td>{row.brotherName}</td>
                      <td className="balancete-num">{row.openMonthCount}</td>
                      <td>{row.periodsLabel}</td>
                      <td className="balancete-num balancete-debit">
                        {formatCurrencyBRL(row.totalOpenAmount)}
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
                        <td className="balancete-num">
                          {formatCurrencyBRL(entry.paidAmount)}
                        </td>
                        <td className="balancete-num balancete-debit">
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
