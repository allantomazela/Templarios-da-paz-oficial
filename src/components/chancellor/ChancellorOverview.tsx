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
import useChancellorStore from '@/stores/useChancellorStore'
import { Users, TrendingUp, HandCoins } from 'lucide-react'

export function ChancellorOverview() {
  const { sessionRecords, attendanceRecords, brothers } = useChancellorStore()

  // Metrics
  const totalCharity = sessionRecords.reduce(
    (acc, curr) => acc + curr.charityCollection,
    0,
  )

  const finishedSessions = sessionRecords.filter(
    (s) => s.status === 'Finalizada',
  )
  const last5Sessions = finishedSessions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)

  // Average Attendance
  let totalAttendancePercentage = 0
  if (last5Sessions.length > 0) {
    last5Sessions.forEach((session) => {
      const sessionAttendance = attendanceRecords.filter(
        (ar) =>
          ar.sessionRecordId === session.id &&
          (ar.status === 'Presente' || ar.status === 'Justificado'),
      )
      // Assuming all brothers should attend
      const percentage = (sessionAttendance.length / brothers.length) * 100
      totalAttendancePercentage += percentage
    })
    totalAttendancePercentage = totalAttendancePercentage / last5Sessions.length
  }

  // Charts Data
  // Degree Distribution
  const degrees = brothers.reduce(
    (acc, curr) => {
      acc[curr.degree] = (acc[curr.degree] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const degreeData = Object.entries(degrees).map(([key, value], index) => ({
    name: key,
    value,
    fill: `hsl(var(--chart-${index + 1}))`,
  }))

  // Attendance History
  const attendanceHistory = last5Sessions
    .map((session) => {
      const present = attendanceRecords.filter(
        (ar) => ar.sessionRecordId === session.id && ar.status === 'Presente',
      ).length
      const justified = attendanceRecords.filter(
        (ar) =>
          ar.sessionRecordId === session.id && ar.status === 'Justificado',
      ).length
      return {
        date: new Date(session.date).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
        }),
        presente: present,
        justificado: justified,
      }
    })
    .reverse()

  const chartConfig = {
    presente: { label: 'Presente', color: 'hsl(var(--chart-1))' },
    justificado: { label: 'Justificado', color: 'hsl(var(--chart-2))' },
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Frequência Média
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalAttendancePercentage.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Últimas 5 sessões</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tronco Acumulado
            </CardTitle>
            <HandCoins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {totalCharity.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Total arrecadado</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Mestres em Loja
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{degrees['Mestre'] || 0}</div>
            <p className="text-xs text-muted-foreground">
              De {brothers.length} irmãos ativos
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Histórico de Presença</CardTitle>
            <CardDescription>
              Comparativo de presença nas últimas sessões.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart accessibilityLayer data={attendanceHistory}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                  dataKey="presente"
                  stackId="a"
                  fill="var(--color-presente)"
                  radius={[0, 0, 4, 4]}
                />
                <Bar
                  dataKey="justificado"
                  stackId="a"
                  fill="var(--color-justificado)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Distribuição de Graus</CardTitle>
            <CardDescription>Quadro atual de obreiros.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[300px] w-full mx-auto">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={degreeData}
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
