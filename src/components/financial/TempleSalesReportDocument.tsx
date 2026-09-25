import { ReportHeader } from '@/components/reports/ReportHeader'
import { formatCurrencyBRL, formatDateBR } from '@/lib/format-utils'
import {
  TEMPLE_SALE_PAYMENT_MODE_LABELS,
  templeSaleStatusLabel,
  type TempleSale,
  type TempleSaleStatus,
} from '@/lib/temple-sale-types'

export interface TempleSalesReportData {
  sales: TempleSale[]
  summary: {
    openCount: number
    openAmount: number
    paidCount: number
    paidAmount: number
    brotherFilterLabel: string
    statusFilterLabel: string
    generatedAt: string
  }
}

interface TempleSalesReportDocumentProps {
  data: TempleSalesReportData
}

export function TempleSalesReportDocument({
  data,
}: TempleSalesReportDocumentProps) {
  return (
    <div className="balancete-document financial-summary-print-document w-full min-w-0 bg-white text-black">
      <ReportHeader
        title="Relatório de Vendas do Templo"
        subtitle={`Filtro: ${data.summary.brotherFilterLabel} · ${data.summary.statusFilterLabel}`}
      />

      <section className="balancete-section">
        <h3 className="balancete-section-title">Resumo</h3>
        <div className="balancete-table-wrap">
          <table className="balancete-table balancete-table-compact">
            <tbody>
              <tr>
                <td>Vendas em aberto</td>
                <td className="balancete-num balancete-strong">
                  {data.summary.openCount}
                </td>
              </tr>
              <tr>
                <td>Valor em aberto</td>
                <td className="balancete-num balancete-debit">
                  {formatCurrencyBRL(data.summary.openAmount)}
                </td>
              </tr>
              <tr>
                <td>Vendas pagas</td>
                <td className="balancete-num">{data.summary.paidCount}</td>
              </tr>
              <tr>
                <td>Valor pago</td>
                <td className="balancete-num balancete-credit balancete-strong">
                  {formatCurrencyBRL(data.summary.paidAmount)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {data.sales.length === 0 ? (
        <p className="balancete-muted text-sm">
          Nenhuma venda encontrada para o filtro atual.
        </p>
      ) : (
        <section className="balancete-section balancete-ledger-section">
          <h3 className="balancete-subsection-title">Detalhamento</h3>
          <div className="balancete-table-wrap">
            <table className="balancete-table balancete-table-ledger balancete-table-ledger-compact">
              <thead>
                <tr>
                  <th>Irmão</th>
                  <th>Descrição</th>
                  <th>Data</th>
                  <th>Vencimento</th>
                  <th>Forma</th>
                  <th className="balancete-num">Valor</th>
                  <th>Status</th>
                  <th>Pagamento</th>
                </tr>
              </thead>
              <tbody>
                {data.sales.map((sale) => (
                  <tr key={sale.id}>
                    <td>{sale.brotherName ?? '—'}</td>
                    <td>{sale.description}</td>
                    <td>{formatDateBR(sale.saleDate)}</td>
                    <td>
                      {sale.dueDate ? formatDateBR(sale.dueDate) : '—'}
                    </td>
                    <td>
                      {TEMPLE_SALE_PAYMENT_MODE_LABELS[sale.paymentMode]}
                    </td>
                    <td className="balancete-num">
                      {formatCurrencyBRL(sale.amount)}
                    </td>
                    <td>
                      {templeSaleStatusLabel(sale.status as TempleSaleStatus)}
                    </td>
                    <td>
                      {sale.paymentDate
                        ? formatDateBR(sale.paymentDate)
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <p className="balancete-muted mt-4 text-xs">
        Relatório gerado em {formatDateBR(data.summary.generatedAt)} pelo módulo
        financeiro — Vendas do Templo.
      </p>
    </div>
  )
}
