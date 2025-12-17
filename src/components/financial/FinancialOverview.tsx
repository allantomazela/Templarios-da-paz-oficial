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
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'
import { mockTransactions, mockContributions } from '@/lib/data'
import { ArrowUp, ArrowDown, Wallet, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

const chartConfig = {
  receita: { label: 'Receitas', color: 'hsl(var(--chart-1))' },
  despesa: { label: 'Despesas', color: 'hsl(var(--destructive))' },
}

// Mock chart data generation (In real app, aggregate by month)
const chartData = [
  { month: 'Jan', receita: 18600, despesa: 8000 },
  { month: 'Fev', receita: 15000, despesa: 12000 },
  { month: 'Mar', receita: 22000, despesa: 9000 },
  { month: 'Abr', receita: 17000, despesa: 15000 },
  { month: 'Mai', receita: 20000, despesa: 11000 },
  { month: 'Jun', receita: 24000, despesa: 8000 },
]

export function FinancialOverview() {
  const totalIncome = mockTransactions
    .filter((t) => t.type === 'Receita')
    .reduce((acc, curr) => acc + curr.amount, 0)
  const totalExpense = mockTransactions
    .filter((t) => t.type === 'Despesa')
    .reduce((acc, curr) => acc + curr.amount, 0)
  const balance = totalIncome - totalExpense
  const pendingContributions = mockContributions.filter(
    (c) => c.status !== 'Pago',
  ).length

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                'text-2xl font-bold',
                balance >= 0 ? 'text-primary' : 'text-destructive',
              )}
            >
              R$ {balance.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Balanço geral do período
            </p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receitas</CardTitle>
            <ArrowUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              R$ {totalIncome.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total de entradas registradas
            </p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas</CardTitle>
            <ArrowDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              R$ {totalExpense.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total de saídas registradas
            </p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pendências (Irmãos)
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">
              {pendingContributions}
            </div>
            <p className="text-xs text-muted-foreground">
              Contribuições não pagas
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fluxo de Caixa (Semestral)</CardTitle>
          <CardDescription>
            Comparativo de receitas e despesas dos últimos 6 meses.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart accessibilityLayer data={chartData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="receita" fill="var(--color-receita)" radius={4} />
              <Bar dataKey="despesa" fill="var(--color-despesa)" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
