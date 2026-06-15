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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Plus,
  Calendar,
  Eye,
  Lock,
  CheckCircle2,
  Loader2,
  Pencil,
  Trash2,
  Unlock,
} from 'lucide-react'
import { useAgapeStore, type AgapeSession } from '@/stores/useAgapeStore'
import { AgapeSessionDialog } from './AgapeSessionDialog'
import { ConsumptionManager } from './ConsumptionManager'
import { useDialog } from '@/hooks/use-dialog'
import { ptBR } from 'date-fns/locale'
import { formatCalendarDate, formatDateBR } from '@/lib/format-utils'
import { useToast } from '@/hooks/use-toast'
import { getSaveErrorMessage } from '@/lib/auth-utils'

export function AgapeSessionsList() {
  const { sessions, loading, closeSession, finalizeSession, reopenSession, deleteSession } =
    useAgapeStore()
  const dialog = useDialog()
  const consumptionDialog = useDialog()
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [sessionToEdit, setSessionToEdit] = useState<AgapeSession | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AgapeSession | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  const handleCloseSession = async (id: string) => {
    const { error } = await closeSession(id)
    if (error) {
      toast({
        title: 'Erro',
        description: getSaveErrorMessage(error),
        variant: 'destructive',
      })
    } else {
      toast({ title: 'Sessão fechada' })
    }
  }

  const handleFinalizeSession = async (id: string) => {
    const { error } = await finalizeSession(id)
    if (error) {
      toast({
        title: 'Erro',
        description: getSaveErrorMessage(error),
        variant: 'destructive',
      })
    } else {
      toast({ title: 'Sessão finalizada' })
    }
  }

  const handleReopenSession = async (id: string) => {
    const { error } = await reopenSession(id)
    if (error) {
      toast({
        title: 'Erro',
        description: getSaveErrorMessage(error),
        variant: 'destructive',
      })
    } else {
      toast({ title: 'Sessão reaberta para ajustes' })
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      const { error } = await deleteSession(deleteTarget.id)
      if (error) {
        toast({
          title: 'Erro',
          description: getSaveErrorMessage(error),
          variant: 'destructive',
        })
        return
      }
      toast({
        title: 'Sessão excluída',
        description: 'Os consumos desta sessão também foram removidos.',
      })
      setDeleteTarget(null)
    } finally {
      setIsDeleting(false)
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

  const openCreateDialog = () => {
    setSessionToEdit(null)
    dialog.openDialog()
  }

  const openEditDialog = (session: AgapeSession) => {
    setSessionToEdit(session)
    dialog.openDialog()
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
        <Button onClick={openCreateDialog} type="button">
          <Plus className="mr-2 h-4 w-4" />
          Nova Sessão
        </Button>
      </div>

      {loading && sessions.length === 0 && !consumptionDialog.open ? (
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
                        {formatCalendarDate(session.date, "dd 'de' MMMM 'de' yyyy", {
                          locale: ptBR,
                        })}
                      </div>
                    </TableCell>
                    <TableCell>{session.description || '-'}</TableCell>
                    <TableCell>{getStatusBadge(session.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          type="button"
                          title="Ver consumos"
                          onClick={() => handleViewConsumptions(session.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          type="button"
                          title="Editar sessão"
                          onClick={() => openEditDialog(session)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {session.status === 'open' ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            type="button"
                            title="Fechar sessão"
                            onClick={() => handleCloseSession(session.id)}
                          >
                            <Lock className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            type="button"
                            title="Reabrir sessão"
                            onClick={() => handleReopenSession(session.id)}
                          >
                            <Unlock className="h-4 w-4" />
                          </Button>
                        )}
                        {session.status === 'closed' ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            type="button"
                            title="Finalizar sessão"
                            onClick={() => handleFinalizeSession(session.id)}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        ) : null}
                        <Button
                          variant="ghost"
                          size="icon"
                          type="button"
                          className="text-destructive hover:text-destructive"
                          title="Excluir sessão"
                          onClick={() => setDeleteTarget(session)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
        onOpenChange={(open) => {
          dialog.onOpenChange(open)
          if (!open) setSessionToEdit(null)
        }}
        sessionToEdit={sessionToEdit}
      />

      {selectedSession ? (
        <ConsumptionManager
          open={consumptionDialog.open}
          onOpenChange={handleCloseConsumptionDialog}
          sessionId={selectedSession}
        />
      ) : null}

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && !isDeleting && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir sessão de ágape?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget ? (
                <>
                  A sessão de{' '}
                  <strong>
                    {formatDateBR(deleteTarget.date)}
                  </strong>{' '}
                  e <strong>todos os consumos</strong> lançados nela serão removidos
                  permanentemente.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault()
                void handleDeleteConfirm()
              }}
            >
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
