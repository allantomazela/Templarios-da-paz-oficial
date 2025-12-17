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
import {
  Users,
  TrendingUp,
  HandCoins,
  AlertTriangle,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ChancellorOverview() {
  const {
    sessionRecords,
    attendanceRecords,
    brothers,
    reviewedAlerts,
    markAlertAsReviewed,
  } = useChancellorStore()

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
      const percentage = (sessionAttendance.length / brothers.length) * 100
      totalAttendancePercentage += percentage
    })
    totalAttendancePercentage = totalAttendancePercentage / last5Sessions.length
  }

  // --- Presence Notifications Logic ---
  // Identify brothers with unjustified absences in the last 3 sessions
  const last3Sessions = last5Sessions.slice(0, 3)
  const alertBrothers = brothers
    .filter((brother) => {
      if (reviewedAlerts.includes(brother.id)) return false
      if (last3Sessions.length === 0) return false

      let unjustifiedCount = 0
      for (const session of last3Sessions) {
        const record = attendanceRecords.find(
          (ar) =>
            ar.sessionRecordId === session.id && ar.brotherId === brother.id,
        )
        if (!record || record.status === 'Ausente') {
          unjustifiedCount++
        }
      }
      // Alert if absent in all checked sessions (or > 50% if logic requires)
      // Let's say: absent in all of the last 3 (or available) sessions
      return unjustifiedCount === last3Sessions.length
    })
    .map((b) => ({
      ...b,
      absenceCount: last3Sessions.length,
    }))
  // ------------------------------------

  // Charts Data
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
      {/* Presence Notifications Widget */}
      {alertBrothers.length > 0 && (
        <Card className="border-l-4 border-l-amber-500 bg-amber-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-amber-700">
              <AlertTriangle className="h-5 w-5" /> Alerta de Frequência
            </CardTitle>
            <CardDescription>
              Irmãos com ausências injustificadas consecutivas nas últimas{' '}
              {last3Sessions.length} sessões.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alertBrothers.map((brother) => (
                <div
                  key={brother.id}
                  className="flex items-center justify-between p-2 bg-background rounded border"
                >
                  <span className="font-medium text-sm">{brother.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {brother.absenceCount} ausências
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => markAlertAsReviewed(brother.id)}
                    >
                      <Check className="mr-1 h-3 w-3" /> Revisar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
