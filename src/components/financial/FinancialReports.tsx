import { useState, useMemo, useEffect, useRef } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { Pie, PieChart } from 'recharts'
import { Button } from '@/components/ui/button'
import {
  Download,
  BarChart3,
  Calendar,
  Loader2,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useReactToPrint } from 'react-to-print'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrencyBRL, formatDateBR, parseCalendarDate } from '@/lib/format-utils'
import type { BankAccount, Transaction } from '@/lib/data'
import { fetchFinancialAccountsAndTransactions } from '@/lib/financial-balances'
import {
  computeAccountPeriodBreakdown,
  type AccountPeriodBreakdownResult,
} from '@/lib/cash-flow'
import useFinancialStore from '@/stores/useFinancialStore'
import { filterTransactionsInPeriod } from '@/lib/cash-flow'
import {
  DEFAULT_FINANCIAL_REPORT_PERIOD_CONFIG,
  getFinancialReportPeriodLabelFromConfig,
  resolveFinancialReportDateRange,
  validateFinancialReportPeriodConfig,
  type FinancialReportPeriodConfig,
} from '@/lib/financial-report-period'
import { ReportHeader } from '@/components/reports/ReportHeader'
import { AccountingBalanceteReport } from '@/components/financial/AccountingBalanceteReport'
import { FinancialCustomReport } from '@/components/financial/FinancialCustomReport'
import { FinancialReportPeriodSelector } from '@/components/financial/FinancialReportPeriodSelector'
import { MembershipReports } from '@/components/financial/MembershipReports'

export function FinancialReports() {
  const { toast } = useToast()
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [periodConfig, setPeriodConfig] = useState<FinancialReportPeriodConfig>(
    DEFAULT_FINANCIAL_REPORT_PERIOD_CONFIG,
  )
  const [activeTab, setActiveTab] = useState('balancete')
  const printRef = useRef<HTMLDivElement>(null)
  const dataRevision = useFinancialStore((state) => state.dataRevision)

  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      setLoading(true)
      try {
        const data = await fetchFinancialAccountsAndTransactions()
        if (!isMounted) return
        setAccounts(data.accounts)
        setTransactions(data.transactions)
      } catch (error) {
        console.error('Error loading financial reports:', error)
        toast({
          title: 'Erro',
          description: 'Falha ao carregar dados dos relatórios.',
          variant: 'destructive',
        })
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    void loadData()

    return () => {
      isMounted = false
    }
  }, [dataRevision, toast])

  const periodError = validateFinancialReportPeriodConfig(periodConfig)
  const dateRange = useMemo(
    () => resolveFinancialReportDateRange(periodConfig),
    [periodConfig],
  )
  const periodLabel = useMemo(
    () => getFinancialReportPeriodLabelFromConfig(periodConfig),
    [periodConfig],
  )

  const filteredTransactions = useMemo(() => {
    if (!dateRange) return transactions
    return filterTransactionsInPeriod(transactions, dateRange, 'all')
  }, [transactions, dateRange])

  const incomeByCategory = useMemo(() => {
    const income = filteredTransactions.filter((transaction) => transaction.type === 'Receita')
    if (income.length === 0) return []

    return income
      .reduce(
        (accumulator, transaction) => {
          const found = accumulator.find((item) => item.category === transaction.category)
          if (found) found.amount += transaction.amount
          else accumulator.push({ category: transaction.category, amount: transaction.amount })
          return accumulator
        },
        [] as { category: string; amount: number; fill?: string }[],
      )
      .map((item, index) => ({
        ...item,
        fill: `hsl(var(--chart-${(index % 5) + 1}))`,
      }))
  }, [filteredTransactions])

  const expenseByCategory = useMemo(() => {
    const expenses = filteredTransactions.filter((transaction) => transaction.type === 'Despesa')
    if (expenses.length === 0) return []

    return expenses
      .reduce(
        (accumulator, transaction) => {
          const found = accumulator.find((item) => item.category === transaction.category)
          if (found) found.amount += transaction.amount
          else accumulator.push({ category: transaction.category, amount: transaction.amount })
          return accumulator
        },
        [] as { category: string; amount: number; fill?: string }[],
      )
      .map((item, index) => ({
        ...item,
        fill: `hsl(var(--chart-${(index % 5) + 1}))`,
      }))
  }, [filteredTransactions])

  const totalIncome = incomeByCategory.reduce((sum, item) => sum + item.amount, 0)
  const totalExpense = expenseByCategory.reduce((sum, item) => sum + item.amount, 0)
  const balance = totalIncome - totalExpense
  const hasIncome = incomeByCategory.length > 0
  const hasExpenses = expenseByCategory.length > 0
  const hasAnyData = hasIncome || hasExpenses

  const accountBreakdown = useMemo<AccountPeriodBreakdownResult>(() => {
    return computeAccountPeriodBreakdown(accounts, filteredTransactions)
  }, [accounts, filteredTransactions])

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Relatorio_Financeiro_${periodConfig.period}`,
    pageStyle: `
      @page { size: A4; margin: 15mm 20mm; }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    `,
    onAfterPrint: () => {
      toast({
        title: 'Relatório enviado à impressão',
        description: 'Use "Salvar como PDF" na janela de impressão para gerar o arquivo.',
      })
    },
    onPrintError: () => {
      toast({
        title: 'Erro ao imprimir',
        description: 'Não foi possível exportar o relatório. Tente novamente.',
        variant: 'destructive',
      })
    },
  })

  const pieConfig = {
    amount: { label: 'Valor' },
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Carregando relatórios financeiros...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Relatórios Financeiros</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Balancete, resumo por categoria, relatório personalizado, mensalidades em atraso e
          extrato por irmão.
        </p>
      </div>

      {activeTab !== 'personalizado' && activeTab !== 'mensalidades' ? (
        <div className="no-print rounded-lg border bg-card p-4">
          <FinancialReportPeriodSelector
            value={periodConfig}
            onChange={setPeriodConfig}
          />
        </div>
      ) : null}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="balancete">Balancete Contábil</TabsTrigger>
          <TabsTrigger value="resumo">Resumo por Categoria</TabsTrigger>
          <TabsTrigger value="personalizado">Personalizado</TabsTrigger>
          <TabsTrigger value="mensalidades">Mensalidades</TabsTrigger>
        </TabsList>

        <TabsContent value="balancete">
          <AccountingBalanceteReport
            accounts={accounts}
            transactions={transactions}
            periodConfig={periodConfig}
            periodError={periodError}
          />
        </TabsContent>

        <TabsContent value="personalizado">
          <FinancialCustomReport
            periodConfig={periodConfig}
            onPeriodConfigChange={setPeriodConfig}
          />
        </TabsContent>

        <TabsContent value="mensalidades">
          <MembershipReports />
        </TabsContent>

        <TabsContent value="resumo" className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
            <p className="text-sm text-muted-foreground">
              Distribuição de receitas e despesas — {periodLabel}
            </p>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => handlePrint()}
                variant="outline"
                disabled={!hasAnyData || Boolean(periodError)}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Imprimir / Salvar PDF
              </Button>
            </div>
          </div>

          {periodError ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-destructive">
                {periodError}
              </CardContent>
            </Card>
          ) : !hasAnyData ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="rounded-full bg-muted p-3 mb-4">
                  <BarChart3 className="h-8 w-8 text-muted-foreground" />
                </div>
                <h4 className="text-lg font-semibold mb-2">Nenhum dado disponível</h4>
                <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
                  {filteredTransactions.length === 0 && transactions.length > 0
                    ? `Não há transações no período selecionado (${periodLabel}).`
                    : 'Cadastre receitas ou despesas para visualizar os relatórios.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-2 no-print">
                <CategoryChartCard
                  title="Receitas por Categoria"
                  periodLabel={periodLabel}
                  hasData={hasIncome}
                  data={incomeByCategory}
                  pieConfig={pieConfig}
                  emptyMessage="Nenhuma receita no período selecionado"
                />
                <CategoryChartCard
                  title="Despesas por Categoria"
                  periodLabel={periodLabel}
                  hasData={hasExpenses}
                  data={expenseByCategory}
                  pieConfig={pieConfig}
                  emptyMessage="Nenhuma despesa no período selecionado"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3 no-print">
                <SummaryCard title="Total de Receitas" value={totalIncome} className="text-green-600" />
                <SummaryCard title="Total de Despesas" value={totalExpense} className="text-red-600" />
                <SummaryCard
                  title="Saldo do Período"
                  value={balance}
                  className={balance >= 0 ? 'text-green-600' : 'text-red-600'}
                />
              </div>

              <AccountBreakdownCard breakdown={accountBreakdown} periodLabel={periodLabel} />
            </>
          )}

          <div
            id="financial-summary-report-container"
            className="hidden print:block"
            ref={printRef}
          >
            <FinancialSummaryPrintDocument
              periodLabel={periodLabel}
              incomeByCategory={incomeByCategory}
              expenseByCategory={expenseByCategory}
              accountBreakdown={accountBreakdown}
              transactions={filteredTransactions}
              totalIncome={totalIncome}
              totalExpense={totalExpense}
              balance={balance}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface CategoryChartCardProps {
  title: string
  periodLabel: string
  hasData: boolean
  data: { category: string; amount: number; fill?: string }[]
  pieConfig: Record<string, { label: string }>
  emptyMessage: string
}

function CategoryChartCard({
  title,
  periodLabel,
  hasData,
  data,
  pieConfig,
  emptyMessage,
}: CategoryChartCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{periodLabel}</CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ChartContainer config={pieConfig} className="mx-auto aspect-square max-h-[300px]">
            <PieChart>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    hideLabel
                    formatter={(value) => formatCurrencyBRL(Number(value))}
                  />
                }
              />
              <Pie data={data} dataKey="amount" nameKey="category" innerRadius={60} />
              <ChartLegend content={<ChartLegendContent />} />
            </PieChart>
          </ChartContainer>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="h-6 w-6 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface SummaryCardProps {
  title: string
  value: number
  className?: string
}

function SummaryCard({ title, value, className }: SummaryCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${className ?? ''}`}>
          {formatCurrencyBRL(value)}
        </div>
      </CardContent>
    </Card>
  )
}

interface AccountBreakdownCardProps {
  breakdown: AccountPeriodBreakdownResult
  periodLabel: string
}

function AccountBreakdownCard({ breakdown, periodLabel }: AccountBreakdownCardProps) {
  const hasMovement = breakdown.rows.some(
    (row) => row.periodIncome > 0 || row.periodExpense > 0,
  )

  if (!hasMovement) return null

  return (
    <Card className="no-print">
      <CardHeader>
        <CardTitle>Movimentação por conta</CardTitle>
        <CardDescription>
          Receitas, despesas e líquido do período — {periodLabel}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AccountBreakdownTable breakdown={breakdown} />
      </CardContent>
    </Card>
  )
}

interface AccountBreakdownTableProps {
  breakdown: AccountPeriodBreakdownResult
  compact?: boolean
}

function AccountBreakdownTable({ breakdown, compact = false }: AccountBreakdownTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Conta</TableHead>
            <TableHead className="text-right">Receitas</TableHead>
            <TableHead className="text-right">Despesas</TableHead>
            <TableHead className="text-right">Líquido</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {breakdown.rows.map((row) => (
            <TableRow key={row.accountId}>
              <TableCell className={compact ? 'text-sm' : undefined}>{row.accountName}</TableCell>
              <TableCell className="text-right text-green-600">
                {formatCurrencyBRL(row.periodIncome)}
              </TableCell>
              <TableCell className="text-right text-red-600">
                {formatCurrencyBRL(row.periodExpense)}
              </TableCell>
              <TableCell
                className={`text-right font-medium ${
                  row.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {formatCurrencyBRL(row.netCashFlow)}
              </TableCell>
            </TableRow>
          ))}
          <TableRow className="bg-muted/50 font-semibold">
            <TableCell>{breakdown.totals.accountName}</TableCell>
            <TableCell className="text-right text-green-600">
              {formatCurrencyBRL(breakdown.totals.periodIncome)}
            </TableCell>
            <TableCell className="text-right text-red-600">
              {formatCurrencyBRL(breakdown.totals.periodExpense)}
            </TableCell>
            <TableCell
              className={`text-right ${
                breakdown.totals.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {formatCurrencyBRL(breakdown.totals.netCashFlow)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}

interface FinancialSummaryPrintDocumentProps {
  periodLabel: string
  incomeByCategory: { category: string; amount: number }[]
  expenseByCategory: { category: string; amount: number }[]
  accountBreakdown: AccountPeriodBreakdownResult
  transactions: Transaction[]
  totalIncome: number
  totalExpense: number
  balance: number
}

function FinancialSummaryPrintDocument({
  periodLabel,
  incomeByCategory,
  expenseByCategory,
  accountBreakdown,
  transactions,
  totalIncome,
  totalExpense,
  balance,
}: FinancialSummaryPrintDocumentProps) {
  const hasAccountMovement = accountBreakdown.rows.some(
    (row) => row.periodIncome > 0 || row.periodExpense > 0,
  )

  return (
    <div className="financial-summary-print-document bg-white p-8 text-black">
      <ReportHeader
        title="Relatório Financeiro — Resumo por Categoria"
        subtitle={periodLabel}
      />

      <div className="mb-6 grid grid-cols-3 gap-4 border-b pb-4">
        <PrintMetric label="Receitas" value={totalIncome} />
        <PrintMetric label="Despesas" value={totalExpense} />
        <PrintMetric label="Saldo" value={balance} />
      </div>

      {hasAccountMovement ? (
        <div className="mb-8">
          <h3 className="mb-2 text-sm font-bold">Movimentação por conta</h3>
          <AccountBreakdownTable breakdown={accountBreakdown} compact />
        </div>
      ) : null}

      <div className="mb-8 grid grid-cols-2 gap-6">
        <PrintCategoryTable title="Receitas por categoria" items={incomeByCategory} />
        <PrintCategoryTable title="Despesas por categoria" items={expenseByCategory} />
      </div>

      <h3 className="mb-2 text-sm font-bold">Lançamentos do período</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Observações</TableHead>
            <TableHead className="text-right">Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell className="whitespace-nowrap">{formatDateBR(transaction.date)}</TableCell>
              <TableCell
                className="max-w-[14rem] whitespace-nowrap font-semibold"
                title={transaction.description}
              >
                {transaction.description}
              </TableCell>
              <TableCell className="whitespace-nowrap">{transaction.category}</TableCell>
              <TableCell className="whitespace-nowrap">{transaction.type}</TableCell>
              <TableCell className="max-w-[6rem] whitespace-pre-wrap text-xs">
                {transaction.attachmentNotes?.trim() || '—'}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {formatCurrencyBRL(transaction.amount)}
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
}

function PrintMetric({ label, value }: PrintMetricProps) {
  return (
    <div>
      <p className="text-xs text-gray-600">{label}</p>
      <p className="text-lg font-bold">{formatCurrencyBRL(value)}</p>
    </div>
  )
}

interface PrintCategoryTableProps {
  title: string
  items: { category: string; amount: number }[]
}

function PrintCategoryTable({ title, items }: PrintCategoryTableProps) {
  return (
    <div>
      <h4 className="mb-2 text-sm font-bold">{title}</h4>
      <Table>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.category}>
              <TableCell>{item.category}</TableCell>
              <TableCell className="text-right">{formatCurrencyBRL(item.amount)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
