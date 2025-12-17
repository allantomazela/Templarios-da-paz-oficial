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
import { Download } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import useFinancialStore from '@/stores/useFinancialStore'

export function FinancialReports() {
  const { toast } = useToast()
  const { transactions } = useFinancialStore()

  const handleExport = () => {
    toast({
      title: 'Relatório Gerado',
      description: 'O download iniciará em instantes.',
    })
  }

  // Aggregate Data for Charts
  const incomeByCategory = transactions
    .filter((t) => t.type === 'Receita')
    .reduce(
      (acc, curr) => {
        const found = acc.find((i) => i.category === curr.category)
        if (found) found.amount += curr.amount
        else acc.push({ category: curr.category, amount: curr.amount })
        return acc
      },
      [] as { category: string; amount: number; fill?: string }[],
    )
    .map((i, index) => ({
      ...i,
      fill: `hsl(var(--chart-${(index % 5) + 1}))`,
    }))

  const expenseByCategory = transactions
    .filter((t) => t.type === 'Despesa')
    .reduce(
      (acc, curr) => {
        const found = acc.find((i) => i.category === curr.category)
        if (found) found.amount += curr.amount
        else acc.push({ category: curr.category, amount: curr.amount })
        return acc
      },
      [] as { category: string; amount: number; fill?: string }[],
    )
    .map((i, index) => ({
      ...i,
      fill: `hsl(var(--chart-${(index % 5) + 1}))`,
    }))

  const pieConfig = {
    amount: { label: 'Valor' },
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Relatórios Financeiros</h3>
        <Button onClick={handleExport} variant="outline">
          <Download className="mr-2 h-4 w-4" /> Exportar Relatório (PDF)
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Receitas por Categoria</CardTitle>
            <CardDescription>
              Distribuição das entradas no período atual.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={pieConfig}
              className="mx-auto aspect-square max-h-[300px]"
            >
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={incomeByCategory}
                  dataKey="amount"
                  nameKey="category"
                  innerRadius={60}
                />
                <ChartLegend content={<ChartLegendContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Despesas por Categoria</CardTitle>
            <CardDescription>
              Distribuição das saídas no período atual.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={pieConfig}
              className="mx-auto aspect-square max-h-[300px]"
            >
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={expenseByCategory}
                  dataKey="amount"
                  nameKey="category"
                  innerRadius={60}
                />
                <ChartLegend content={<ChartLegendContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
