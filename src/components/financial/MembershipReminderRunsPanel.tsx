import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Activity, Loader2 } from 'lucide-react'
import { formatDateBR } from '@/lib/format-utils'
import {
  fetchMembershipReminderRuns,
  type MembershipReminderRun,
} from '@/lib/membership-reminder-settings'

function sourceLabel(source: MembershipReminderRun['source']) {
  return source === 'cron' ? 'Automático (9h)' : 'Manual'
}

interface MembershipReminderRunsPanelProps {
  refreshKey?: number
}

export function MembershipReminderRunsPanel({
  refreshKey = 0,
}: MembershipReminderRunsPanelProps) {
  const [loading, setLoading] = useState(true)
  const [runs, setRuns] = useState<MembershipReminderRun[]>([])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        const data = await fetchMembershipReminderRuns()
        if (!cancelled) setRuns(data)
      } catch (error) {
        console.error('Erro ao carregar execuções de lembretes:', error)
        if (!cancelled) setRuns([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [refreshKey])

  const lastRun = runs[0]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-5 w-5" />
          Execuções automáticas e manuais
        </CardTitle>
        <CardDescription>
          Histórico das verificações de lembretes (job diário às 9h de Brasília).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Carregando execuções...
          </div>
        ) : !lastRun ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma execução registrada ainda.
          </p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 rounded-md border p-4 bg-muted/20">
              <div>
                <p className="text-xs text-muted-foreground">Última execução</p>
                <p className="font-medium">
                  {formatDateBR(lastRun.startedAt.slice(0, 10))}
                </p>
                <Badge variant="outline" className="mt-1">
                  {sourceLabel(lastRun.source)}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">E-mails enviados</p>
                <p className="text-2xl font-bold text-green-600">
                  {lastRun.sentCount}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ignorados</p>
                <p className="text-2xl font-bold text-amber-600">
                  {lastRun.skippedCount}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Falhas</p>
                <p className="text-2xl font-bold text-destructive">
                  {lastRun.failedCount}
                </p>
              </div>
            </div>
            {lastRun.message ? (
              <p className="text-sm text-muted-foreground">{lastRun.message}</p>
            ) : null}
            {lastRun.error ? (
              <p className="text-sm text-destructive">{lastRun.error}</p>
            ) : null}

            {runs.length > 1 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Origem</TableHead>
                      <TableHead>Enviados</TableHead>
                      <TableHead>Falhas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {runs.slice(0, 10).map((run) => (
                      <TableRow key={run.id}>
                        <TableCell>
                          {formatDateBR(run.startedAt.slice(0, 10))}
                        </TableCell>
                        <TableCell>{sourceLabel(run.source)}</TableCell>
                        <TableCell>{run.sentCount}</TableCell>
                        <TableCell>{run.failedCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  )
}
