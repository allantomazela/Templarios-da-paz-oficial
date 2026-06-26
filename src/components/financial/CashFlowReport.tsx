import { useMemo, useRef, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Printer,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  endOfMonth,
  endOfYear,
  startOfMonth,
  startOfYear,
  subMonths,
} from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useReactToPrint } from 'react-to-print'
import { ReportHeader } from '@/components/reports/ReportHeader'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  formatCurrencyBRL,
  formatDateBR,
} from '@/lib/format-utils'
import { buildCashFlowReport, type CashFlowPeriod } from '@/lib/cash-flow'
import { useFinancialCoreData } from '@/hooks/use-financial-core-data'

const PERIOD_LABELS: Record<string, string> = {
  current_month: 'Mês Atual',
  last_month: 'Mês Passado',
  current_year: 'Ano Atual',
}

function getDateRange(period: string): CashFlowPeriod {
  const now = new Date()
  switch (period) {
    case 'current_month':
      return { start: startOfMonth(now), end: endOfMonth(now) }
    case 'last_month': {
      const lastMonth = subMonths(now, 1)
      return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) }
    }
    case 'current_year':
      return { start: startOfYear(now), end: endOfYear(now) }
    default:
      return { start: startOfMonth(now), end: endOfMonth(now) }
  }
}

export function CashFlowReport() {
  const { accounts, transactions, loading } = useFinancialCoreData()
  const { toast } = useToast()
  const [period, setPeriod] = useState('current_month')
  const [accountFilter, setAccountFilter] = useState('all')
  const printRef = useRef<HTMLDivElement>(null)

  const dateRange = useMemo(() => getDateRange(period), [period])

  const report = useMemo(
    () => buildCashFlowReport(accounts, transactions, dateRange, accountFilter),
    [accounts, transactions, dateRange, accountFilter],
  )

  const accountNames = useMemo(
    () => Object.fromEntries(accounts.map((account) => [account.id, account.name])),
    [accounts],
  )

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Fluxo_Caixa_${period}`,
    onAfterPrint: () => {
      toast({
        title: 'Relatório Impresso',
        description: 'Relatório de fluxo de caixa enviado para impressão.',
      })
    },
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Carregando dados do fluxo de caixa...</span>
        </div>
      </div>
    )
  }

  const {
    periodTotals,
    accountSummaries,
    totalsRow,
    reconciliation,
    periodTransactions,
    incomeByCategory,
    expenseByCategory,
  } = report

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between no-print">
        <div>
          <h3 className="text-lg font-medium">Fluxo de Caixa Detalhado</h3>
          <p className="text-sm text-muted-foreground">
            Saldos por conta, movimentações e conferência consolidada. Os saldos
            atuais refletem ajustes feitos em Contas Bancárias e na auditoria.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current_month">Mês Atual</SelectItem>
              <SelectItem value="last_month">Mês Passado</SelectItem>
              <SelectItem value="current_year">Ano Atual</SelectItem>
            </SelectContent>
          </Select>
          <Select value={accountFilter} onValueChange={setAccountFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Conta" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as contas</SelectItem>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => handlePrint()}>
            <Printer className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {reconciliation.isBalanced ? (
        <Alert className="border-green-200 bg-green-50 no-print">
          <CheckCircle2 className="h-4 w-4 text-green-700" />
          <AlertTitle className="text-green-800">Conferência ok</AlertTitle>
          <AlertDescription className="text-green-700">
            A soma dos saldos por conta ({formatCurrencyBRL(reconciliation.sumOfAccountClosingBalances)})
            corresponde ao saldo global ({formatCurrencyBRL(reconciliation.globalClosingBalance)}).
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="destructive" className="no-print">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Divergência detectada</AlertTitle>
          <AlertDescription>
            Diferença de {formatCurrencyBRL(reconciliation.difference)} entre saldo global e
            soma das contas. Verifique transações sem conta vinculada.
          </AlertDescription>
        </Alert>
      )}

      {reconciliation.orphanPeriodTransactions.length > 0 ? (
        <Alert className="border-amber-200 bg-amber-50 no-print">
          <AlertCircle className="h-4 w-4 text-amber-700" />
          <AlertTitle className="text-amber-800">Transações sem conta no período</AlertTitle>
          <AlertDescription className="text-amber-700">
            {reconciliation.orphanPeriodTransactions.length} movimentação(ões) sem conta
            vinculada: {formatCurrencyBRL(reconciliation.orphanPeriodIncome)} em entradas e{' '}
            {formatCurrencyBRL(reconciliation.orphanPeriodExpense)} em saídas não entram nos
            saldos individuais das contas.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-4 no-print">
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-medium text-green-800">
              Total Entradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              {formatCurrencyBRL(periodTotals.totalIncome)}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-medium text-red-800">Total Saídas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">
              {formatCurrencyBRL(periodTotals.totalExpense)}
            </div>
          </CardContent>
        </Card>
        <Card
          className={
            periodTotals.netCashFlow >= 0
              ? 'bg-blue-50 border-blue-200'
              : 'bg-orange-50 border-orange-200'
          }
        >
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-medium text-foreground">
              Resultado Líquido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                periodTotals.netCashFlow >= 0 ? 'text-blue-700' : 'text-orange-700'
              }`}
            >
              {formatCurrencyBRL(periodTotals.netCashFlow)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-medium">Saldo Global Atual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrencyBRL(reconciliation.globalClosingBalance)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Soma de todas as contas (acumulado)
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-md border bg-card no-print">
        <div className="border-b bg-muted/50 p-4 font-medium">Saldos por Conta</div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Conta</TableHead>
              <TableHead className="text-right">Saldo Inicial Cadastrado</TableHead>
              <TableHead className="text-right">Saldo Início Período</TableHead>
              <TableHead className="text-right">Entradas</TableHead>
              <TableHead className="text-right">Saídas</TableHead>
              <TableHead className="text-right">Saldo Final Período</TableHead>
              <TableHead className="text-right">Saldo Atual</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accountSummaries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Nenhuma conta cadastrada.
                </TableCell>
              </TableRow>
            ) : (
              <>
                {accountSummaries.map((row) => (
                  <TableRow key={row.accountId}>
                    <TableCell>
                      <div className="font-medium">{row.accountName}</div>
                      <div className="text-xs text-muted-foreground">{row.accountType}</div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {formatCurrencyBRL(row.registeredInitialBalance)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrencyBRL(row.openingBalance)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-green-600">
                      {formatCurrencyBRL(row.periodIncome)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-red-600">
                      {formatCurrencyBRL(row.periodExpense)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      {formatCurrencyBRL(row.closingBalance)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      {formatCurrencyBRL(row.currentBalance)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/30 font-semibold">
                  <TableCell>{totalsRow.accountName}</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrencyBRL(totalsRow.registeredInitialBalance)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrencyBRL(totalsRow.openingBalance)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-green-700">
                    {formatCurrencyBRL(totalsRow.periodIncome)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-red-700">
                    {formatCurrencyBRL(totalsRow.periodExpense)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrencyBRL(totalsRow.closingBalance)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrencyBRL(totalsRow.currentBalance)}
                  </TableCell>
                </TableRow>
              </>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-6 md:grid-cols-2 no-print">
        <CategoryTable title="Receitas por Categoria" data={incomeByCategory} valueClass="text-green-600" />
        <CategoryTable title="Despesas por Categoria" data={expenseByCategory} valueClass="text-red-600" />
      </div>

      <div className="rounded-md border bg-card no-print">
        <div className="border-b bg-muted/50 p-4 font-medium">
          Movimentações do Período ({periodTransactions.length})
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Conta</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {periodTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Nenhuma movimentação no período selecionado.
                </TableCell>
              </TableRow>
            ) : (
              periodTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{formatDateBR(transaction.date)}</TableCell>
                  <TableCell>
                    {transaction.accountId
                      ? accountNames[transaction.accountId] || 'Conta removida'
                      : 'Sem conta'}
                  </TableCell>
                  <TableCell className="font-medium">{transaction.description}</TableCell>
                  <TableCell>{transaction.category}</TableCell>
                  <TableCell>
                    <Badge
                      variant={transaction.type === 'Receita' ? 'default' : 'destructive'}
                      className={
                        transaction.type === 'Receita'
                          ? 'bg-green-600 hover:bg-green-600'
                          : undefined
                      }
                    >
                      {transaction.type}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={`text-right font-mono ${
                      transaction.type === 'Receita' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {formatCurrencyBRL(transaction.amount)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="hidden print:block p-8 bg-white text-black" ref={printRef}>
        <ReportHeader
          title="Relatório de Fluxo de Caixa"
          description={`Período: ${PERIOD_LABELS[period] ?? period}${
            accountFilter !== 'all'
              ? ` — Conta: ${accountNames[accountFilter] ?? accountFilter}`
              : ''
          }`}
        />

        <div className="grid grid-cols-4 gap-6 mb-8 border-b pb-6">
          <PrintMetric label="Entradas" value={periodTotals.totalIncome} className="text-green-700" />
          <PrintMetric label="Saídas" value={periodTotals.totalExpense} className="text-red-700" />
          <PrintMetric
            label="Resultado"
            value={periodTotals.netCashFlow}
            className={periodTotals.netCashFlow >= 0 ? 'text-blue-700' : 'text-red-700'}
          />
          <PrintMetric
            label="Saldo Global"
            value={reconciliation.globalClosingBalance}
            className="text-black"
          />
        </div>

        <h4 className="mb-2 text-lg font-bold">Saldos por Conta</h4>
        <Table className="mb-8">
          <TableHeader>
            <TableRow>
              <TableHead>Conta</TableHead>
              <TableHead className="text-right">Inicial</TableHead>
              <TableHead className="text-right">Entradas</TableHead>
              <TableHead className="text-right">Saídas</TableHead>
              <TableHead className="text-right">Final</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accountSummaries.map((row) => (
              <TableRow key={row.accountId}>
                <TableCell>{row.accountName}</TableCell>
                <TableCell className="text-right">{formatCurrencyBRL(row.openingBalance)}</TableCell>
                <TableCell className="text-right">{formatCurrencyBRL(row.periodIncome)}</TableCell>
                <TableCell className="text-right">{formatCurrencyBRL(row.periodExpense)}</TableCell>
                <TableCell className="text-right">{formatCurrencyBRL(row.closingBalance)}</TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell className="font-bold">{totalsRow.accountName}</TableCell>
              <TableCell className="text-right font-bold">
                {formatCurrencyBRL(totalsRow.openingBalance)}
              </TableCell>
              <TableCell className="text-right font-bold">
                {formatCurrencyBRL(totalsRow.periodIncome)}
              </TableCell>
              <TableCell className="text-right font-bold">
                {formatCurrencyBRL(totalsRow.periodExpense)}
              </TableCell>
              <TableCell className="text-right font-bold">
                {formatCurrencyBRL(totalsRow.closingBalance)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <div className="grid grid-cols-2 gap-8">
          <CategoryPrintSection title="Receitas" data={incomeByCategory} />
          <CategoryPrintSection title="Despesas" data={expenseByCategory} />
        </div>
      </div>
    </div>
  )
}

interface CategoryTableProps {
  title: string
  data: Record<string, number>
  valueClass: string
}

function CategoryTable({ title, data, valueClass }: CategoryTableProps) {
  return (
    <div className="rounded-md border bg-card">
      <div className="border-b bg-muted/50 p-4 font-medium">{title}</div>
      <Table>
        <TableBody>
          {Object.entries(data).length === 0 ? (
            <TableRow>
              <TableCell colSpan={2} className="text-center text-muted-foreground">
                Sem dados
              </TableCell>
            </TableRow>
          ) : (
            Object.entries(data).map(([category, value]) => (
              <TableRow key={category}>
                <TableCell>{category}</TableCell>
                <TableCell className={`text-right font-medium ${valueClass}`}>
                  {formatCurrencyBRL(value)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

interface CategoryPrintSectionProps {
  title: string
  data: Record<string, number>
}

function CategoryPrintSection({ title, data }: CategoryPrintSectionProps) {
  return (
    <div>
      <h4 className="mb-2 text-lg font-bold">{title}</h4>
      <Table>
        <TableBody>
          {Object.entries(data).map(([category, value]) => (
            <TableRow key={category} className="border-b border-gray-200">
              <TableCell className="py-2 pl-0 font-medium text-black">{category}</TableCell>
              <TableCell className="py-2 pr-0 text-right text-black">
                {formatCurrencyBRL(value)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

interface PrintMetricProps {
  label: string
  value: number
  className?: string
}

function PrintMetric({ label, value, className }: PrintMetricProps) {
  return (
    <div className="text-center">
      <p className="mb-1 text-sm font-bold uppercase text-gray-500">{label}</p>
      <p className={`text-2xl font-bold ${className ?? ''}`}>{formatCurrencyBRL(value)}</p>
    </div>
  )
}
