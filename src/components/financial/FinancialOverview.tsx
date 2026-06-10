import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { Bar, BarChart, CartesianGrid, XAxis, Pie, PieChart } from 'recharts'
import { ArrowUp, ArrowDown, Wallet, AlertTriangle, Filter, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrencyBRL } from '@/lib/format-utils'
import { useToast } from '@/hooks/use-toast'
import useFinancialStore from '@/stores/useFinancialStore'
import {
  computeAccountBalance,
  computeGlobalBalance,
  fetchFinancialAccountsAndTransactions,
} from '@/lib/financial-balances'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  format,
  parseISO,
  isWithinInterval,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  endOfYear,
} from 'date-fns'
import { Transaction, BankAccount } from '@/lib/data'

const chartConfig = {
  receita: { label: 'Receitas', color: 'hsl(var(--chart-1))' },
  despesa: { label: 'Despesas', color: 'hsl(var(--destructive))' },
}

export function FinancialOverview() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('current_year')
  const dataRevision = useFinancialStore((s) => s.dataRevision)
  const { toast } = useToast()

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const { accounts: accountsData, transactions: transactionsData } =
          await fetchFinancialAccountsAndTransactions()

        setTransactions(transactionsData)
        setAccounts(accountsData)
      } catch (error) {
        console.error('Error loading financial data:', error)
        toast({
          title: 'Erro',
          description: 'Falha ao carregar dados financeiros.',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [dataRevision, toast])

  // Date Filtering
  const getDateRange = () => {
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
        return { start: startOfYear(now), end: endOfYear(now) }
    }
  }

  const { start, end } = getDateRange()

  const filteredTransactions = transactions
    .filter((t) => isWithinInterval(parseISO(t.date), { start, end }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const totalIncome = filteredTransactions
    .filter((t) => t.type === 'Receita')
    .reduce((acc, curr) => acc + curr.amount, 0)
  const totalExpense = filteredTransactions
    .filter((t) => t.type === 'Despesa')
    .reduce((acc, curr) => acc + curr.amount, 0)

  const globalBalance = computeGlobalBalance(accounts, transactions)

  const periodResult = totalIncome - totalExpense

  // Process Chart Data (Monthly Aggregation for the selected period if it is Year, otherwise Daily)
  const isYearView = period === 'current_year'

  const aggregatedData = filteredTransactions.reduce(
    (acc, curr) => {
      const date = parseISO(curr.date)
      const key = isYearView ? format(date, 'MMM') : format(date, 'dd/MM')

      if (!acc[key]) acc[key] = { name: key, receita: 0, despesa: 0 }

      if (curr.type === 'Receita') acc[key].receita += curr.amount
      else acc[key].despesa += curr.amount

      return acc
    },
    {} as Record<string, { name: string; receita: number; despesa: number }>,
  )

  const chartData = Object.values(aggregatedData)

  // Category Distribution Data
  const expenseCategoryData = filteredTransactions
    .filter((t) => t.type === 'Despesa')
    .reduce(
      (acc, curr) => {
        const found = acc.find((i) => i.name === curr.category)
        if (found) {
          found.value += curr.amount
        } else {
          acc.push({ name: curr.category, value: curr.amount, fill: '' })
        }
        return acc
      },
      [] as { name: string; value: number; fill: string }[],
    )
    .map((item, index) => ({
      ...item,
      fill: `hsl(var(--chart-${(index % 5) + 1}))`,
    }))

  const lowBalanceAccounts = accounts.filter((acc) => {
    const bal = computeAccountBalance(acc.initialBalance, acc.id, transactions)
    return bal < 100 // Example threshold
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Carregando dados financeiros...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold tracking-tight">
          Dashboard Interativo
        </h2>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current_month">Mês Atual</SelectItem>
              <SelectItem value="last_month">Mês Passado</SelectItem>
              <SelectItem value="current_year">Ano Atual</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Alerts Section */}
      {lowBalanceAccounts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-amber-800">
              Atenção Necessária
            </h4>
            <ul className="text-sm text-amber-700 list-disc list-inside">
              {lowBalanceAccounts.map((acc) => (
                <li key={acc.id}>
                  A conta <strong>{acc.name}</strong> está com saldo baixo
                  (abaixo de R$ 100,00).
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Global</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                'text-2xl font-bold',
                globalBalance >= 0 ? 'text-primary' : 'text-destructive',
              )}
            >
              {formatCurrencyBRL(globalBalance)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total em todas as contas
            </p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Receitas (Período)
            </CardTitle>
            <ArrowUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {formatCurrencyBRL(totalIncome)}
            </div>
            <p className="text-xs text-muted-foreground">Entradas filtradas</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Despesas (Período)
            </CardTitle>
            <ArrowDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {formatCurrencyBRL(totalExpense)}
            </div>
            <p className="text-xs text-muted-foreground">Saídas filtradas</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Resultado (Período)
            </CardTitle>
            <div
              className={cn(
                'h-4 w-4 rounded-full',
                periodResult >= 0 ? 'bg-green-500' : 'bg-red-500',
              )}
            />
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                'text-2xl font-bold',
                periodResult >= 0 ? 'text-green-600' : 'text-red-600',
              )}
            >
              {formatCurrencyBRL(periodResult)}
            </div>
            <p className="text-xs text-muted-foreground">
              Balanço do período selecionado
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Fluxo Financeiro</CardTitle>
            <CardDescription>
              Comparativo de receitas e despesas ao longo do tempo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart accessibilityLayer data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => formatCurrencyBRL(Number(value))}
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="receita" fill="var(--color-receita)" radius={4} />
                <Bar dataKey="despesa" fill="var(--color-despesa)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Despesas por Categoria</CardTitle>
            <CardDescription>
              Distribuição dos gastos no período.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[300px] w-full mx-auto">
              <PieChart>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      hideLabel
                      formatter={(value) => formatCurrencyBRL(Number(value))}
                    />
                  }
                />
                <Pie
                  data={expenseCategoryData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                />
                <ChartLegend
                  content={<ChartLegendContent />}
                  className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
                />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
