import { useState, useMemo } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import useChancellorStore from '@/stores/useChancellorStore'
import { Users, UserCheck, Calendar } from 'lucide-react'
import { format, subDays, startOfMonth, parseISO, isAfter } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const chartConfig = {
  attendance: {
    label: 'Taxa de Presença (%)',
    color: 'hsl(var(--primary))',
  },
  average: {
    label: 'Média de Irmãos',
    color: 'hsl(var(--chart-2))',
  },
}

export function AnalyticsDashboard() {
  const { sessionRecords, attendanceRecords, brothers } = useChancellorStore()
  const [timeRange, setTimeRange] = useState('90d')

  // Calculate Metrics
  const activeBrothersCount = brothers.filter(
    (b) => b.status === 'Ativo',
  ).length

  const filteredSessions = useMemo(() => {
    const now = new Date()
    let startDate = subDays(now, 90) // Default 90 days

    if (timeRange === '30d') startDate = subDays(now, 30)
    if (timeRange === '1y') startDate = subDays(now, 365)

    return sessionRecords
      .filter((s) => s.status === 'Finalizada')
      .filter((s) => isAfter(parseISO(s.date), startDate))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [sessionRecords, timeRange])

  const chartData = useMemo(() => {
    return filteredSessions.map((session) => {
      const presentCount = attendanceRecords.filter(
        (ar) =>
          ar.sessionRecordId === session.id &&
          (ar.status === 'Presente' || ar.status === 'Justificado'),
      ).length

      const percentage =
        activeBrothersCount > 0
          ? Math.round((presentCount / activeBrothersCount) * 100)
          : 0

      return {
        date: format(parseISO(session.date), 'dd/MM', { locale: ptBR }),
        attendance: percentage,
        count: presentCount,
      }
    })
  }, [filteredSessions, attendanceRecords, activeBrothersCount])

  // KPI Calculations
  const averageAttendance =
    chartData.length > 0
      ? Math.round(
          chartData.reduce((acc, curr) => acc + curr.attendance, 0) /
            chartData.length,
        )
      : 0

  const totalAttendances = chartData.reduce((acc, curr) => acc + curr.count, 0)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Análise de Participação</h3>
          <p className="text-sm text-muted-foreground">
            Métricas e tendências de frequência da loja.
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
            <SelectItem value="90d">Últimos 3 meses</SelectItem>
            <SelectItem value="1y">Último ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Taxa Média de Frequência
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageAttendance}%</div>
            <p className="text-xs text-muted-foreground">
              No período selecionado
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Presenças
            </CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAttendances}</div>
            <p className="text-xs text-muted-foreground">
              Presenças acumuladas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Sessões Realizadas
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredSessions.length}</div>
            <p className="text-xs text-muted-foreground">
              No período selecionado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Card>
        <CardHeader>
          <CardTitle>Tendência de Frequência</CardTitle>
          <CardDescription>
            Evolução da taxa de presença (%) por sessão.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[350px] w-full">
              <AreaChart
                accessibilityLayer
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="fillAttendance"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="var(--color-attendance)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-attendance)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}%`}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Area
                  dataKey="attendance"
                  type="natural"
                  fill="url(#fillAttendance)"
                  fillOpacity={0.4}
                  stroke="var(--color-attendance)"
                  stackId="a"
                />
                <ChartLegend content={<ChartLegendContent />} />
              </AreaChart>
            </ChartContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground border border-dashed rounded-md">
              Dados insuficientes para o período selecionado.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
