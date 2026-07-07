import { ReportHeader } from '@/components/reports/ReportHeader'
import { formatCurrencyBRL, formatDateBR } from '@/lib/format-utils'
import {
  formatOverdueLabels,
  getOverdueEntriesForBrother,
  sortAlertsByPriority,
  type MembershipOverdueReportData,
} from '@/lib/membership-report'
import { membershipStatusLabel } from '@/lib/membership-schedule'

interface MembershipOverdueReportDocumentProps {
  data: MembershipOverdueReportData
}

export function MembershipOverdueReportDocument({
  data,
}: MembershipOverdueReportDocumentProps) {
  const alerts = sortAlertsByPriority(data.alerts)
  const priorityAlerts = alerts.filter((alert) => alert.requiresEscalation)
  const regularAlerts = alerts.filter((alert) => !alert.requiresEscalation)

  return (
    <div className="balancete-document financial-summary-print-document w-full min-w-0 bg-white text-black">
      <ReportHeader
        title="Relatório de Mensalidades em Atraso"
        subtitle="Verificação para cobrança e conferência da tesouraria"
      />

      <section className="balancete-section">
        <h3 className="balancete-section-title">Resumo</h3>
        <div className="balancete-table-wrap">
          <table className="balancete-table balancete-table-compact">
            <tbody>
              <tr>
                <td>Irmãos com atraso</td>
                <td className="balancete-num balancete-strong">{data.summary.brotherCount}</td>
              </tr>
              <tr>
                <td>Valor total em aberto (atraso)</td>
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

      {data.summary.brotherCount === 0 ? (
        <p className="balancete-muted text-sm">
          Nenhum irmão com mensalidade em atraso na data de referência.
        </p>
      ) : (
        <>
          {priorityAlerts.length > 0 ? (
            <AlertSection title="Prioridade tesouraria" alerts={priorityAlerts} />
          ) : null}
          {regularAlerts.length > 0 ? (
            <AlertSection title="Demais irmãos em atraso" alerts={regularAlerts} />
          ) : null}

          <section className="balancete-section balancete-ledger-section">
            <h3 className="balancete-subsection-title">Detalhamento por mês em atraso</h3>
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
                  {alerts.flatMap((alert) => {
                    const entries = getOverdueEntriesForBrother(data, alert.brotherId)
                    return entries.map((entry) => (
                      <tr key={`${alert.brotherId}-${entry.year}-${entry.month}`}>
                        <td>{alert.brotherName}</td>
                        <td>{entry.periodLabel}</td>
                        <td>{formatDateBR(entry.dueDate)}</td>
                        <td className="balancete-num">
                          {formatCurrencyBRL(entry.expectedAmount)}
                        </td>
                        <td className="balancete-num">
                          {formatCurrencyBRL(entry.paidAmount)}
                        </td>
                        <td className="balancete-num">
                          {formatCurrencyBRL(entry.remainingAmount)}
                        </td>
                        <td>{membershipStatusLabel(entry.status)}</td>
                      </tr>
                    ))
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      <p className="balancete-footer">
        Relatório gerado pelo módulo financeiro. Considera apenas mensalidades com status
        &quot;Em atraso&quot; no cronograma (após o dia de vencimento configurado).
      </p>
    </div>
  )
}

function AlertSection({
  title,
  alerts,
}: {
  title: string
  alerts: MembershipOverdueReportData['alerts']
}) {
  return (
    <section className="balancete-section">
      <h3 className="balancete-section-title">{title}</h3>
      <div className="balancete-table-wrap">
        <table className="balancete-table balancete-table-compact">
          <thead>
            <tr>
              <th>Irmão</th>
              <th>Meses</th>
              <th>Períodos</th>
              <th className="balancete-num">Valor em aberto</th>
              <th>Venc. mais antigo</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((alert) => (
              <tr key={alert.brotherId}>
                <td className="balancete-strong">{alert.brotherName}</td>
                <td>{alert.overdueCount}</td>
                <td>{formatOverdueLabels(alert.overdueLabels)}</td>
                <td className="balancete-num balancete-debit">
                  {formatCurrencyBRL(alert.overdueAmount)}
                </td>
                <td>
                  {alert.oldestOverdueDueDate
                    ? formatDateBR(alert.oldestOverdueDueDate)
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
