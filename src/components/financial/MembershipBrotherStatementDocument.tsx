import { ReportHeader } from '@/components/reports/ReportHeader'
import { formatCurrencyBRL, formatDateBR } from '@/lib/format-utils'
import {
  membershipContributionStatusLabel,
  type MembershipBrotherStatementData,
} from '@/lib/membership-report'
import { membershipStatusLabel } from '@/lib/membership-schedule'

interface MembershipBrotherStatementDocumentProps {
  statement: MembershipBrotherStatementData
}

export function MembershipBrotherStatementDocument({
  statement,
}: MembershipBrotherStatementDocumentProps) {
  const { schedule } = statement

  return (
    <div className="balancete-document financial-summary-print-document w-full min-w-0 bg-white text-black">
      <ReportHeader
        title="Extrato de Mensalidades"
        subtitle={statement.brotherName}
      />

      <section className="balancete-section">
        <h3 className="balancete-section-title">Resumo</h3>
        <div className="balancete-table-wrap">
          <table className="balancete-table balancete-table-compact">
            <tbody>
              <tr>
                <td>Total pago (cronograma)</td>
                <td className="balancete-num balancete-credit">
                  {formatCurrencyBRL(schedule.totalPaid)}
                </td>
              </tr>
              <tr>
                <td>Em aberto (a vencer / parcial)</td>
                <td className="balancete-num">
                  {formatCurrencyBRL(schedule.totalOpen)}
                </td>
              </tr>
              <tr>
                <td>Em atraso</td>
                <td className="balancete-num balancete-debit">
                  {formatCurrencyBRL(schedule.totalOverdue)}
                </td>
              </tr>
              <tr>
                <td>Situação</td>
                <td className="balancete-strong">
                  {schedule.isUpToDate ? 'Em dia' : 'Com pendências'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="balancete-section balancete-ledger-section">
        <h3 className="balancete-subsection-title">Cronograma de mensalidades</h3>
        <div className="balancete-table-wrap">
          <table className="balancete-table balancete-table-ledger balancete-table-ledger-compact">
            <thead>
              <tr>
                <th>Referência</th>
                <th>Vencimento</th>
                <th className="balancete-num">Previsto</th>
                <th className="balancete-num">Pago</th>
                <th className="balancete-num">Em aberto</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {schedule.entries.map((entry) => (
                <tr key={`${entry.year}-${entry.month}`}>
                  <td>{entry.periodLabel}</td>
                  <td>{formatDateBR(entry.dueDate)}</td>
                  <td className="balancete-num">
                    {formatCurrencyBRL(entry.expectedAmount)}
                  </td>
                  <td className="balancete-num">
                    {formatCurrencyBRL(entry.paidAmount)}
                  </td>
                  <td className="balancete-num">
                    {entry.remainingAmount > 0
                      ? formatCurrencyBRL(entry.remainingAmount)
                      : '—'}
                  </td>
                  <td>{membershipStatusLabel(entry.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="balancete-section balancete-ledger-section">
        <h3 className="balancete-subsection-title">
          Lançamentos registrados ({statement.contributions.length})
        </h3>
        {statement.contributions.length === 0 ? (
          <p className="balancete-muted text-sm">Nenhum lançamento cadastrado.</p>
        ) : (
          <div className="balancete-table-wrap">
            <table className="balancete-table balancete-table-ledger balancete-table-ledger-compact">
              <thead>
                <tr>
                  <th>Referência</th>
                  <th>Data pagamento</th>
                  <th className="balancete-num">Valor</th>
                  <th>Status</th>
                  <th>Caixa</th>
                  <th>Observações</th>
                </tr>
              </thead>
              <tbody>
                {statement.contributions.map((contribution) => (
                  <tr key={contribution.id}>
                    <td>
                      {contribution.month}/{contribution.year}
                    </td>
                    <td>
                      {contribution.paymentDate
                        ? formatDateBR(contribution.paymentDate)
                        : '—'}
                    </td>
                    <td className="balancete-num">
                      {formatCurrencyBRL(contribution.amount)}
                    </td>
                    <td>
                      {membershipContributionStatusLabel(contribution.status)}
                    </td>
                    <td>{contribution.transactionId ? 'Sim' : 'Não'}</td>
                    <td>{contribution.notes?.trim() || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="balancete-footer">
        Documento para conferência de pagamentos de mensalidades. Valores no caixa indicam
        receita vinculada na tesouraria. Emitido pela tesouraria mediante solicitação do
        irmão.
      </p>
    </div>
  )
}
