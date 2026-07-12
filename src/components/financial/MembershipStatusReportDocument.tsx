import { ReportHeader } from '@/components/reports/ReportHeader'
import { formatCurrencyBRL, formatDateBR } from '@/lib/format-utils'
import type { MembershipStatusReportData } from '@/lib/membership-report'

interface MembershipStatusReportDocumentProps {
  data: MembershipStatusReportData
}

function situationFilterLabel(
  situation: MembershipStatusReportData['filters']['situation'],
): string {
  switch (situation) {
    case 'up_to_date':
      return 'Em dia'
    case 'overdue':
      return 'Em atraso'
    case 'pending':
      return 'Com pendências'
    default:
      return 'Todos'
  }
}

export function MembershipStatusReportDocument({
  data,
}: MembershipStatusReportDocumentProps) {
  return (
    <div className="balancete-document financial-summary-print-document w-full min-w-0 bg-white text-black">
      <ReportHeader
        title="Relatório de Situação das Mensalidades"
        subtitle="Adimplência, pendências e atrasos por irmão"
      />

      <section className="balancete-section">
        <h3 className="balancete-section-title">Resumo</h3>
        <div className="balancete-table-wrap">
          <table className="balancete-table balancete-table-compact">
            <tbody>
              <tr>
                <td>Irmãos listados</td>
                <td className="balancete-num balancete-strong">
                  {data.summary.totalBrothers}
                </td>
              </tr>
              <tr>
                <td>Em dia</td>
                <td className="balancete-num">{data.summary.upToDateCount}</td>
              </tr>
              <tr>
                <td>Em atraso</td>
                <td className="balancete-num balancete-debit">
                  {data.summary.overdueCount}
                </td>
              </tr>
              <tr>
                <td>Com pendências à vencer</td>
                <td className="balancete-num">{data.summary.pendingCount}</td>
              </tr>
              <tr>
                <td>Valor total em atraso</td>
                <td className="balancete-num balancete-debit balancete-strong">
                  {formatCurrencyBRL(data.summary.totalOverdueAmount)}
                </td>
              </tr>
              <tr>
                <td>Prioridade tesouraria (3+ meses)</td>
                <td className="balancete-num">{data.summary.escalationCount}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="balancete-section">
        <h3 className="balancete-section-title">Filtros aplicados</h3>
        <p className="balancete-muted text-sm">
          Situação: {situationFilterLabel(data.filters.situation)}
          {data.filters.minOverdueMonths > 0
            ? ` · Mínimo ${data.filters.minOverdueMonths} mês(es) em atraso`
            : ''}
          {data.filters.escalationOnly ? ' · Somente prioridade tesouraria' : ''}
          {data.filters.searchTerm.trim()
            ? ` · Busca: "${data.filters.searchTerm.trim()}"`
            : ''}
        </p>
      </section>

      <section className="balancete-section balancete-ledger-section">
        <h3 className="balancete-subsection-title">Detalhamento por irmão</h3>
        {data.rows.length === 0 ? (
          <p className="balancete-muted text-sm">
            Nenhum irmão encontrado com os filtros selecionados.
          </p>
        ) : (
          <div className="balancete-table-wrap">
            <table className="balancete-table balancete-table-ledger balancete-table-ledger-compact">
              <thead>
                <tr>
                  <th>Irmão</th>
                  <th>Situação</th>
                  <th className="balancete-num">Meses atraso</th>
                  <th>Períodos em atraso</th>
                  <th className="balancete-num">Em atraso</th>
                  <th className="balancete-num">À vencer</th>
                  <th className="balancete-num">Total pago</th>
                  <th>Último quitado</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => (
                  <tr key={row.brotherId}>
                    <td className="balancete-strong">{row.brotherName}</td>
                    <td>{row.situationLabel}</td>
                    <td className="balancete-num">{row.overdueMonthCount}</td>
                    <td>{row.overduePeriodsLabel || '—'}</td>
                    <td className="balancete-num balancete-debit">
                      {formatCurrencyBRL(row.totalOverdue)}
                    </td>
                    <td className="balancete-num">
                      {formatCurrencyBRL(row.totalOpen)}
                    </td>
                    <td className="balancete-num">
                      {formatCurrencyBRL(row.totalPaid)}
                    </td>
                    <td>{row.lastPaidPeriod ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="balancete-footer">
        Relatório gerado em {formatDateBR(data.summary.generatedAt)} pelo módulo
        financeiro. Considera o cronograma de mensalidades a partir de jun/2026.
      </p>
    </div>
  )
}
