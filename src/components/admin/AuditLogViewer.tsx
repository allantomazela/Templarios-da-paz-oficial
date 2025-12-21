import { useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import useAuditStore from '@/stores/useAuditStore'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Loader2, History } from 'lucide-react'

export function AuditLogViewer() {
  const { logs, fetchLogs, loading } = useAuditStore()

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CREATE':
        return (
          <Badge variant="default" className="bg-green-600">
            Criar
          </Badge>
        )
      case 'UPDATE':
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
            Editar
          </Badge>
        )
      case 'DELETE':
        return <Badge variant="destructive">Excluir</Badge>
      default:
        return <Badge variant="outline">{action}</Badge>
    }
  }

  const formatDetails = (log: any) => {
    if (log.entity_type === 'profiles' && log.action === 'UPDATE') {
      const oldStatus = log.details.old?.status
      const newStatus = log.details.new?.status
      const oldRole = log.details.old?.role
      const newRole = log.details.new?.role

      if (oldStatus !== newStatus) {
        return `Alterou status de "${oldStatus}" para "${newStatus}"`
      }
      if (oldRole !== newRole) {
        return `Alterou função de "${oldRole}" para "${newRole}"`
      }
    }
    if (log.entity_type === 'site_settings') {
      return 'Atualizou configurações do site'
    }
    return `ID Entidade: ${log.entity_id}`
  }

  return (
    <div className="rounded-md border bg-card">
      <div className="p-4 border-b flex items-center gap-2">
        <History className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-semibold">Registro de Atividades</h3>
      </div>
      <ScrollArea className="h-[500px]">
        {loading && logs.length === 0 ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Entidade</TableHead>
                <TableHead>Detalhes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Nenhum registro de auditoria encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm', {
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {log.profiles?.full_name || 'Sistema'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {log.profiles?.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getActionBadge(log.action)}</TableCell>
                    <TableCell className="capitalize text-sm">
                      {log.entity_type.replace('_', ' ')}
                    </TableCell>
                    <TableCell
                      className="text-sm text-muted-foreground truncate max-w-[300px]"
                      title={JSON.stringify(log.details, null, 2)}
                    >
                      {formatDetails(log)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </ScrollArea>
    </div>
  )
}
