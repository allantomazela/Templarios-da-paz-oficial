import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  Pie,
  PieChart,
  Label,
} from 'recharts'
import { mockTransactions } from '@/lib/data'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Download, Plus } from 'lucide-react'

const chartData = [
  { month: 'Jan', receita: 18600, despesa: 8000 },
  { month: 'Fev', receita: 15000, despesa: 12000 },
  { month: 'Mar', receita: 22000, despesa: 9000 },
  { month: 'Abr', receita: 17000, despesa: 15000 },
  { month: 'Mai', receita: 20000, despesa: 11000 },
  { month: 'Jun', receita: 24000, despesa: 8000 },
]

const chartConfig = {
  receita: { label: 'Receitas', color: 'hsl(var(--chart-1))' },
  despesa: { label: 'Despesas', color: 'hsl(var(--destructive))' },
}

const pieData = [
  { category: 'Ritualística', amount: 2000, fill: 'hsl(var(--chart-1))' },
  { category: 'Manutenção', amount: 4500, fill: 'hsl(var(--chart-2))' },
  { category: 'Eventos', amount: 3000, fill: 'hsl(var(--chart-3))' },
  { category: 'Utilidades', amount: 1500, fill: 'hsl(var(--chart-4))' },
]

const pieConfig = {
  amount: { label: 'Valor' },
  Ritualística: { label: 'Ritualística', color: 'hsl(var(--chart-1))' },
  Manutenção: { label: 'Manutenção', color: 'hsl(var(--chart-2))' },
  Eventos: { label: 'Eventos', color: 'hsl(var(--chart-3))' },
  Utilidades: { label: 'Utilidades', color: 'hsl(var(--chart-4))' },
}

export default function Financial() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Financeiro</h2>
          <p className="text-muted-foreground">
            Controle de receitas, despesas e fluxo de caixa.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" /> Relatórios
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Lançamento
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 45.231,89</div>
            <p className="text-xs text-muted-foreground">
              +20.1% em relação ao mês passado
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Receitas (Maio)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              +R$ 20.000,00
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Despesas (Maio)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">-R$ 11.000,00</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inadimplência</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.5%</div>
            <p className="text-xs text-muted-foreground">3 Irmãos pendentes</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="transactions">Lançamentos</TabsTrigger>
          <TabsTrigger value="contributions">Contribuições</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Receitas vs Despesas</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <ChartContainer
                  config={chartConfig}
                  className="h-[300px] w-full"
                >
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
                    <Bar
                      dataKey="receita"
                      fill="var(--color-receita)"
                      radius={4}
                    />
                    <Bar
                      dataKey="despesa"
                      fill="var(--color-despesa)"
                      radius={4}
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Categorias de Despesas</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={pieConfig}
                  className="mx-auto aspect-square max-h-[300px]"
                >
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <Pie
                      data={pieData}
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
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Transações</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockTransactions.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>{t.date}</TableCell>
                      <TableCell>{t.description}</TableCell>
                      <TableCell>{t.category}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            t.type === 'Receita' ? 'default' : 'destructive'
                          }
                        >
                          {t.type}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={`text-right font-mono ${t.type === 'Receita' ? 'text-green-500' : 'text-red-500'}`}
                      >
                        R$ {t.amount.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
