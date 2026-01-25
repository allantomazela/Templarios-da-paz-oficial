import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Calendar, Eye, Lock, CheckCircle2, Loader2 } from 'lucide-react'
import { useAgapeStore } from '@/stores/useAgapeStore'
import { AgapeSessionDialog } from './AgapeSessionDialog'
import { ConsumptionManager } from './ConsumptionManager'
import { useDialog } from '@/hooks/use-dialog'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useToast } from '@/hooks/use-toast'

export function AgapeSessionsList() {
  const { sessions, loading, closeSession, finalizeSession } = useAgapeStore()
  const dialog = useDialog()
  const consumptionDialog = useDialog()
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const { toast } = useToast()

  const handleCloseSession = async (id: string) => {
    const { error } = await closeSession(id)
    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível fechar a sessão.',
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Sucesso',
        description: 'Sessão fechada com sucesso.',
      })
    }
  }

  const handleFinalizeSession = async (id: string) => {
    const { error } = await finalizeSession(id)
    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível finalizar a sessão.',
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Sucesso',
        description: 'Sessão finalizada com sucesso.',
      })
    }
  }

  const handleViewConsumptions = (sessionId: string) => {
    setSelectedSession(sessionId)
    consumptionDialog.openDialog()
  }

  const handleCloseConsumptionDialog = (open: boolean) => {
    consumptionDialog.onOpenChange(open)
    if (!open) {
      setSelectedSession(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-green-100 text-green-800">Aberta</Badge>
      case 'closed':
        return <Badge className="bg-yellow-100 text-yellow-800">Fechada</Badge>
      case 'finalized':
        return <Badge className="bg-gray-100 text-gray-800">Finalizada</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Sessões de Ágape</h3>
        <Button onClick={dialog.openDialog} type="button">
          <Plus className="mr-2 h-4 w-4" />
          Nova Sessão
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Nenhuma sessão encontrada. Crie uma nova sessão para começar.
                  </TableCell>
                </TableRow>
              ) : (
                sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {format(new Date(session.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </div>
                    </TableCell>
                    <TableCell>{session.description || '-'}</TableCell>
                    <TableCell>{getStatusBadge(session.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          type="button"
                          onClick={() => handleViewConsumptions(session.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {session.status === 'open' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            type="button"
                            onClick={() => handleCloseSession(session.id)}
                          >
                            <Lock className="h-4 w-4" />
                          </Button>
                        ) : null}
                        {session.status === 'closed' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            type="button"
                            onClick={() => handleFinalizeSession(session.id)}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <AgapeSessionDialog
        open={dialog.open}
        onOpenChange={dialog.onOpenChange}
      />

      {selectedSession ? (
        <ConsumptionManager
          open={consumptionDialog.open}
          onOpenChange={handleCloseConsumptionDialog}
          sessionId={selectedSession}
        />
      ) : null}
    </div>
  )
}
