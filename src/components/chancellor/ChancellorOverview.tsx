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
import { Bar, BarChart, CartesianGrid, XAxis, Pie, PieChart, Cell } from 'recharts'
import useChancellorStore from '@/stores/useChancellorStore'
import { useSiteSettingsStore } from '@/stores/useSiteSettingsStore'
import {
  Users,
  TrendingUp,
  HandCoins,
  AlertTriangle,
  Check,
  QrCode,
  Printer,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRef } from 'react'

export function ChancellorOverview() {
  const qrCardRef = useRef<HTMLDivElement | null>(null)
  const {
    sessionRecords,
    attendanceRecords,
    brothers,
    reviewedAlerts,
    markAlertAsReviewed,
  } = useChancellorStore()
  const { templeCheckinUrl } = useSiteSettingsStore()

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

  // Chart config para gráfico de pizza
  const pieChartConfig = {
    Aprendiz: { label: 'Aprendiz', color: 'hsl(var(--chart-1))' },
    Companheiro: { label: 'Companheiro', color: 'hsl(var(--chart-2))' },
    Mestre: { label: 'Mestre', color: 'hsl(var(--chart-3))' },
  }

  const effectiveTempleUrl =
    (templeCheckinUrl && templeCheckinUrl.trim()) ||
    (typeof window !== 'undefined'
      ? `${window.location.origin}/checkin-templo`
      : '/checkin-templo')

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(
    effectiveTempleUrl,
  )}`
  const handlePrintQR = () => {
    if (typeof window === 'undefined') return
    const printWindow = window.open('', '_blank', 'width=420,height=600')
    if (!printWindow) return

    const html = `<!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charSet="UTF-8" />
          <title>QR Check-in Templo</title>
          <style>
            * { box-sizing: border-box; }
            body {
              margin: 0;
              padding: 16px;
              font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
            }
            .card {
              border: 1px solid #000;
              padding: 16px;
              text-align: center;
            }
            img {
              width: 256px;
              height: 256px;
            }
            .url {
              margin-top: 8px;
              font-size: 11px;
              word-break: break-all;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>QR fixo do Templo</h2>
            <img id="qr-img" src="${qrImageUrl}" alt="QR fixo do Templo" />
            <div class="url">${effectiveTempleUrl}</div>
          </div>
          <script>
            (function() {
              function doPrint() {
                try {
                  window.focus();
                  window.print();
                } catch (e) {
                  console.error(e);
                }
              }
              const img = document.getElementById('qr-img');
              if (img && img.complete) {
                setTimeout(doPrint, 100);
              } else if (img) {
                img.onload = function() { setTimeout(doPrint, 100); };
              } else {
                setTimeout(doPrint, 300);
              }
            })();
          </script>
        </body>
      </html>`

    printWindow.document.open()
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
    printWindow.close()
  }

  return (
    <div className="space-y-6">
      {/* Presence Notifications Widget */}
      {alertBrothers.length > 0 && (
        <Card className="border-l-4 border-l-amber-500 bg-amber-500/10 dark:bg-amber-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold">
              <AlertTriangle className="h-5 w-5" /> Alerta de Frequência
            </CardTitle>
            <CardDescription className="text-base text-amber-900/90 dark:text-amber-200/90 font-medium mt-1">
              Irmãos com ausências injustificadas consecutivas nas últimas{' '}
              {last3Sessions.length} sessões.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alertBrothers.map((brother) => (
                <div
                  key={brother.id}
                  className="flex items-center justify-between p-4 bg-background dark:bg-background/95 rounded-lg border-2 border-amber-300 dark:border-amber-700/60 shadow-md"
                >
                  <span className="font-bold text-base text-foreground">
                    {brother.name}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-amber-800 dark:text-amber-300 bg-amber-200 dark:bg-amber-800/50 px-3 py-1.5 rounded-md border border-amber-400 dark:border-amber-600">
                      {brother.absenceCount} ausência{brother.absenceCount !== 1 ? 's' : ''}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-3 text-sm font-semibold border-2 border-amber-500 dark:border-amber-600 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-800/50 hover:text-amber-900 dark:hover:text-amber-100 hover:border-amber-600 dark:hover:border-amber-500 transition-colors"
                      onClick={() => markAlertAsReviewed(brother.id)}
                    >
                      <Check className="mr-1.5 h-4 w-4" /> Revisar
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
        <Card
          className="hover:shadow-md transition-shadow md:col-span-1"
          ref={qrCardRef}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <QrCode className="h-4 w-4 text-muted-foreground" />
              QR fixo do Templo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Use este QR para imprimir e fixar no Templo. Ele sempre aponta para o fluxo de
              check-in do Templo, respeitando geolocalização e a sessão aberta.
            </p>
            <div className="flex justify-center">
              <img
                src={qrImageUrl}
                alt="QR fixo do Templo"
                className="h-40 w-40 border border-border rounded-md bg-white p-2"
              />
            </div>
            <div className="text-[11px] break-words text-muted-foreground border rounded-md p-2 bg-muted/50">
              <span className="font-semibold">Endereço:</span>{' '}
              <span>{effectiveTempleUrl}</span>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => {
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(effectiveTempleUrl).catch(() => {})
                  }
                }}
              >
                Copiar link
              </Button>
              <Button
                type="button"
                size="sm"
                className="flex-1"
                onClick={() => handlePrintQR()}
              >
                <Printer className="h-4 w-4 mr-1.5" />
                Imprimir
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Para alterar o endereço (ex.: outra Loja ou domínio), use{' '}
              <span className="font-semibold">Configurações &gt; Check-in por QR Code</span>.
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
              <BarChart 
                accessibilityLayer 
                data={attendanceHistory}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  vertical={false}
                  className="stroke-muted"
                />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  className="text-xs fill-muted-foreground"
                  tick={{ fill: 'currentColor' }}
                />
                <ChartTooltip 
                  content={<ChartTooltipContent 
                    indicator="line"
                    className="bg-popover border border-border shadow-lg"
                  />} 
                />
                <ChartLegend 
                  content={<ChartLegendContent 
                    className="mt-4"
                  />} 
                />
                <Bar
                  dataKey="presente"
                  fill="hsl(var(--chart-1))"
                  radius={[4, 4, 0, 0]}
                  name="Presente"
                />
                <Bar
                  dataKey="justificado"
                  fill="hsl(var(--chart-2))"
                  radius={[4, 4, 0, 0]}
                  name="Justificado"
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
            <ChartContainer config={pieChartConfig} className="h-[300px] w-full mx-auto">
              <PieChart>
                <ChartTooltip 
                  content={<ChartTooltipContent 
                    hideLabel={false}
                    className="bg-popover border border-border shadow-lg"
                  />} 
                />
                <Pie
                  data={degreeData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {degreeData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.fill || `hsl(var(--chart-${(index % 3) + 1}))`}
                    />
                  ))}
                </Pie>
                <ChartLegend
                  content={<ChartLegendContent 
                    className="mt-4 flex-wrap gap-2 [&>*]:basis-1/3 [&>*]:justify-center"
                  />}
                />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
