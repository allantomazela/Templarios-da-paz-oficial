import { useEffect, useState } from 'react'
import { CheckCircle, History, Loader2 } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase/client'
import { formatDateBR } from '@/lib/format-utils'

interface ReminderLogRow {
  id: string
  brotherName: string
  sentDate: string
  method: 'Email' | 'WhatsApp'
}

interface ReminderLogFromDB {
  id: string
  sent_date: string
  method: 'Email' | 'WhatsApp'
  profiles?: { full_name: string | null } | null
}

async function fetchReminderLogs(): Promise<ReminderLogRow[]> {
  const supabaseAny = supabase as any
  const { data, error } = await supabaseAny
    .from('reminder_logs')
    .select(
      `
      id,
      sent_date,
      method,
      profiles!reminder_logs_brother_id_fkey ( full_name )
    `,
    )
    .order('sent_date', { ascending: false })

  if (error) throw error

  return ((data || []) as ReminderLogFromDB[]).map((log) => ({
    id: log.id,
    brotherName: log.profiles?.full_name || 'Desconhecido',
    sentDate: log.sent_date,
    method: log.method,
  }))
}

interface MembershipReminderLogsCardProps {
  refreshKey?: number
}

export function MembershipReminderLogsCard({
  refreshKey = 0,
}: MembershipReminderLogsCardProps) {
  const [logs, setLogs] = useState<ReminderLogRow[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setFailed(false)

    fetchReminderLogs()
      .then((rows) => {
        if (!cancelled) setLogs(rows)
      })
      .catch((error) => {
        console.error('Erro ao carregar histórico de lembretes:', error)
        if (!cancelled) setFailed(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [refreshKey])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" /> Histórico de Envios
        </CardTitle>
        <CardDescription>
          Registro de todos os lembretes enviados pelo sistema.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data de Envio</TableHead>
                <TableHead>Irmão</TableHead>
                <TableHead>Método</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <LogRows loading={loading} failed={failed} logs={logs} />
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

function LogRows({
  loading,
  failed,
  logs,
}: {
  loading: boolean
  failed: boolean
  logs: ReminderLogRow[]
}) {
  const message = loading
    ? null
    : failed
      ? 'Não foi possível carregar o histórico.'
      : logs.length === 0
        ? 'Nenhum lembrete enviado ainda.'
        : null

  if (loading || message) {
    return (
      <TableRow>
        <TableCell colSpan={4} className="py-8 text-center">
          {loading ? (
            <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            message
          )}
        </TableCell>
      </TableRow>
    )
  }

  return (
    <>
      {logs.map((log) => (
        <TableRow key={log.id}>
          <TableCell>{formatDateBR(log.sentDate)}</TableCell>
          <TableCell>{log.brotherName}</TableCell>
          <TableCell>{log.method}</TableCell>
          <TableCell className="text-right">
            <Badge
              variant="outline"
              className="border-green-200 bg-green-50 text-green-700"
            >
              <CheckCircle className="mr-1 h-3 w-3" /> Enviado
            </Badge>
          </TableCell>
        </TableRow>
      ))}
    </>
  )
}
