import type { ForecastProjectionResult } from '@/lib/forecast-types'
import { formatCurrencyBRL } from '@/lib/format-utils'
import {
  buildForecastPlanningSummaryRows,
  computeTotalEconomyAcrossMonths,
} from '@/lib/forecast-report-export'
import { getForecastRowStatusLabel } from '@/lib/forecast-projection'
import { ReportHeader } from '@/components/reports/ReportHeader'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface ForecastPlanningPrintViewProps {
  projection: ForecastProjectionResult
  generatedAt: string
}

export function ForecastPlanningPrintView({
  projection,
  generatedAt,
}: ForecastPlanningPrintViewProps) {
  const summaryRows = buildForecastPlanningSummaryRows(projection)
  const totalEconomy = computeTotalEconomyAcrossMonths(projection.months)

  return (
    <div className="space-y-6 p-2 text-black">
      <ReportHeader
        title="Planejamento Financeiro"
        subtitle="Previsto × Realizado — horizonte de 3 meses"
      />

      <p className="text-xs text-gray-600">
        Gerado em {generatedAt}. Saldo atual:{' '}
        {formatCurrencyBRL(projection.globalCurrentBalance)} · Saldo projetado:{' '}
        {formatCurrencyBRL(projection.globalProjectedBalance)}
        {totalEconomy > 0
          ? ` · Economia acumulada no período: ${formatCurrencyBRL(totalEconomy)}`
          : ''}
      </p>

      <div>
        <h2 className="mb-2 text-sm font-semibold">Resumo por mês</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mês</TableHead>
              <TableHead className="text-right">Prev. receitas</TableHead>
              <TableHead className="text-right">Real. receitas</TableHead>
              <TableHead className="text-right">Prev. despesas</TableHead>
              <TableHead className="text-right">Real. despesas</TableHead>
              <TableHead className="text-right">Economia</TableHead>
              <TableHead className="text-right">Líq. previsto</TableHead>
              <TableHead className="text-right">Líq. realizado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {summaryRows.map((row) => (
              <TableRow key={row.label}>
                <TableCell>{row.label}</TableCell>
                <TableCell className="text-right">
                  {formatCurrencyBRL(row.expectedIncome)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrencyBRL(row.realizedIncome)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrencyBRL(row.expectedExpense)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrencyBRL(row.realizedExpense)}
                </TableCell>
                <TableCell className="text-right">
                  {row.economyTotal > 0
                    ? formatCurrencyBRL(row.economyTotal)
                    : '—'}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrencyBRL(row.netExpected)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrencyBRL(row.netRealized)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {projection.accountProjections.length > 0 ? (
        <div>
          <h2 className="mb-2 text-sm font-semibold">Projeção por conta</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Conta</TableHead>
                <TableHead className="text-right">Saldo atual</TableHead>
                <TableHead className="text-right">Saldo projetado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projection.accountProjections.map((account) => (
                <TableRow key={account.accountId}>
                  <TableCell>{account.accountName}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrencyBRL(account.currentBalance)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrencyBRL(account.projectedBalance)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}

      {projection.months.map((month) => (
        <div key={`${month.year}-${month.month}`} className="break-inside-avoid">
          <h2 className="mb-2 text-sm font-semibold">{month.label}</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Venc.</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Previsto</TableHead>
                <TableHead className="text-right">Realizado</TableHead>
                <TableHead className="text-right">Variação</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {month.rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    {row.dueDate.split('-').reverse().join('/')}
                  </TableCell>
                  <TableCell>{row.description}</TableCell>
                  <TableCell>{row.categoryName}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrencyBRL(row.expectedAmount)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrencyBRL(row.realizedAmount)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrencyBRL(row.variance)}
                  </TableCell>
                  <TableCell>{getForecastRowStatusLabel(row)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ))}
    </div>
  )
}
