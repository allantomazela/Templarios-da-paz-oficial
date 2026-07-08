import { ReportHeader } from '@/components/reports/ReportHeader'
import { formatCurrencyBRL, formatDateBR } from '@/lib/format-utils'
import {
  filterMemberPaymentsByType,
  memberPaymentStatusLabel,
  membershipContributionStatusLabel,
  type MembershipBrotherStatementData,
} from '@/lib/membership-report'
import { MEMBER_PAYMENT_TYPE_LABELS } from '@/lib/member-payments'
import { membershipStatusLabel } from '@/lib/membership-schedule'
import { MEMBERSHIP_LABELS } from '@/lib/membership-labels'

interface MembershipBrotherStatementDocumentProps {
  statement: MembershipBrotherStatementData
}

function PaymentRows({
  payments,
  emptyMessage,
}: {
  payments: MembershipBrotherStatementData['paidPayments']
  emptyMessage: string
}) {
  if (payments.length === 0) {
    return <p className="balancete-muted text-sm">{emptyMessage}</p>
  }

  return (
    <div className="balancete-table-wrap">
      <table className="balancete-table balancete-table-ledger balancete-table-ledger-compact">
        <thead>
          <tr>
            <th>Descrição</th>
            <th>Data pagamento</th>
            <th className="balancete-num">Valor</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => (
            <tr key={`${payment.type}-${payment.id}`}>
              <td>{payment.description}</td>
              <td>
                {payment.paymentDate
                  ? formatDateBR(payment.paymentDate)
                  : formatDateBR(payment.dueDate)}
              </td>
              <td className="balancete-num">{formatCurrencyBRL(payment.amount)}</td>
              <td>{memberPaymentStatusLabel(payment.status)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function MembershipBrotherStatementDocument({
  statement,
}: MembershipBrotherStatementDocumentProps) {
  const { schedule, summaryByType } = statement
  const ceremonyPaid = filterMemberPaymentsByType(statement.paidPayments, 'ceremony')
  const agapePaid = filterMemberPaymentsByType(statement.paidPayments, 'agape')
  const charityPaid = filterMemberPaymentsByType(statement.paidPayments, 'charity')

  return (
    <div className="balancete-document financial-summary-print-document w-full min-w-0 bg-white text-black">
      <ReportHeader
        title="Extrato Financeiro do Irmão"
        subtitle={statement.brotherName}
      />

      <section className="balancete-section">
        <h3 className="balancete-section-title">Resumo geral</h3>
        <div className="balancete-table-wrap">
          <table className="balancete-table balancete-table-compact">
            <tbody>
              <tr>
                <td>Total pago (todas as categorias)</td>
                <td className="balancete-num balancete-credit">
                  {formatCurrencyBRL(statement.totalPaidAll)}
                </td>
              </tr>
              <tr>
                <td>Mensalidades pagas (cronograma)</td>
                <td className="balancete-num balancete-credit">
                  {formatCurrencyBRL(schedule.totalPaid)}
                </td>
              </tr>
              <tr>
                <td>Mensalidades à vencer / parcial</td>
                <td className="balancete-num">
                  {formatCurrencyBRL(schedule.totalOpen)}
                </td>
              </tr>
              <tr>
                <td>Mensalidades em atraso</td>
                <td className="balancete-num balancete-debit">
                  {formatCurrencyBRL(schedule.totalOverdue)}
                </td>
              </tr>
              <tr>
                <td>Taxas de grau pagas</td>
                <td className="balancete-num">
                  {formatCurrencyBRL(summaryByType.ceremony.paidTotal)}
                </td>
              </tr>
              <tr>
                <td>Ágape pago</td>
                <td className="balancete-num">
                  {formatCurrencyBRL(summaryByType.agape.paidTotal)}
                </td>
              </tr>
              <tr>
                <td>Tronco de beneficência</td>
                <td className="balancete-num">
                  {formatCurrencyBRL(summaryByType.charity.paidTotal)}
                </td>
              </tr>
              <tr>
                <td>Situação das mensalidades</td>
                <td className="balancete-strong">
                  {schedule.isUpToDate ? 'Em dia' : 'Com pendências'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="balancete-section balancete-ledger-section">
        <h3 className="balancete-subsection-title">
          Extrato consolidado — pagamentos realizados ({statement.paidPayments.length})
        </h3>
        <PaymentRows
          payments={statement.paidPayments}
          emptyMessage="Nenhum pagamento registrado."
        />
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
                <th className="balancete-num">{MEMBERSHIP_LABELS.toReceive}</th>
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
          Lançamentos de mensalidade ({statement.contributions.length})
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

      <section className="balancete-section balancete-ledger-section">
        <h3 className="balancete-subsection-title">
          {MEMBER_PAYMENT_TYPE_LABELS.ceremony} ({ceremonyPaid.length})
        </h3>
        <PaymentRows
          payments={ceremonyPaid}
          emptyMessage="Nenhuma taxa de grau (iniciação, elevação, exaltação) registrada como paga."
        />
      </section>

      <section className="balancete-section balancete-ledger-section">
        <h3 className="balancete-subsection-title">
          {MEMBER_PAYMENT_TYPE_LABELS.agape} ({agapePaid.length})
        </h3>
        <PaymentRows
          payments={agapePaid}
          emptyMessage="Nenhum pagamento de ágape registrado."
        />
      </section>

      <section className="balancete-section balancete-ledger-section">
        <h3 className="balancete-subsection-title">
          {MEMBER_PAYMENT_TYPE_LABELS.charity} ({charityPaid.length})
        </h3>
        <PaymentRows
          payments={charityPaid}
          emptyMessage="Nenhuma doação ao tronco registrada."
        />
      </section>

      <p className="balancete-footer">
        Documento para conferência de pagamentos do irmão (mensalidades, taxas de grau,
        ágape e tronco). Valores no caixa indicam receita vinculada na tesouraria.
        Emitido pela tesouraria mediante solicitação do irmão.
      </p>
    </div>
  )
}
