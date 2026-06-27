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
import type { AuditLog } from '@/stores/useAuditStore'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Loader2, History, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export function AuditLogViewer() {
  const { logs, fetchLogs, loading, error } = useAuditStore()

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

  const formatDetails = (log: AuditLog) => {
    const details = log.details as
      | { old?: Record<string, unknown>; new?: Record<string, unknown> }
      | null
      | undefined

    if (log.entity_type === 'profiles' && log.action === 'UPDATE' && details) {
      const oldStatus = details.old?.status
      const newStatus = details.new?.status
      const oldRole = details.old?.role
      const newRole = details.new?.role
      const oldDegree = details.old?.masonic_degree
      const newDegree = details.new?.masonic_degree
      const oldName = details.old?.full_name
      const newName = details.new?.full_name
      const oldEmail = details.old?.email
      const newEmail = details.new?.email

      const parts: string[] = []
      if (oldStatus !== newStatus) {
        parts.push(`Status: "${String(oldStatus)}" → "${String(newStatus)}"`)
      }
      if (oldRole !== newRole) {
        parts.push(`Função: "${String(oldRole)}" → "${String(newRole)}"`)
      }
      if (oldDegree !== newDegree) {
        parts.push(`Grau: "${String(oldDegree ?? '—')}" → "${String(newDegree ?? '—')}"`)
      }
      if (oldName !== newName) {
        parts.push(`Nome: "${String(oldName)}" → "${String(newName)}"`)
      }
      if (oldEmail !== newEmail) {
        parts.push(`E-mail: "${String(oldEmail ?? '—')}" → "${String(newEmail ?? '—')}"`)
      }
      if (parts.length > 0) return parts.join(' · ')
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
        {error ? (
          <div className="p-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro ao carregar histórico</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        ) : loading && logs.length === 0 ? (
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
