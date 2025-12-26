import { useEffect, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import useMinutesStore, { Minute } from '@/stores/useMinutesStore'
import { Plus, Pencil, Trash2, FileText, Eye } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'
import { MinutesDialog } from './MinutesDialog'
import useAuthStore from '@/stores/useAuthStore'
import { useDialog } from '@/hooks/use-dialog'
import { useAsyncOperation } from '@/hooks/use-async-operation'

export function MinutesList() {
  const {
    minutes,
    fetchMinutes,
    createMinute,
    updateMinute,
    deleteMinute,
    loading,
  } = useMinutesStore()
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const dialog = useDialog()
  const [selectedMinute, setSelectedMinute] = useState<Minute | null>(null)

  useEffect(() => {
    fetchMinutes()
  }, [fetchMinutes])

  const canEdit = user?.role === 'admin' || user?.role === 'editor'

  const createOperation = useAsyncOperation(
    async (data: any) => {
      await createMinute(data)
      return 'Ata criada com sucesso.'
    },
    {
      successMessage: 'Ata criada com sucesso!',
      errorMessage: 'Falha ao criar ata.',
    },
  )

  const updateOperation = useAsyncOperation(
    async (data: any) => {
      if (!selectedMinute) return null
      await updateMinute(selectedMinute.id, data)
      return 'Ata atualizada com sucesso.'
    },
    {
      successMessage: 'Ata atualizada com sucesso!',
      errorMessage: 'Falha ao atualizar ata.',
    },
  )

  const deleteOperation = useAsyncOperation(
    async (id: string) => {
      await deleteMinute(id)
      return 'Ata removida com sucesso.'
    },
    {
      successMessage: 'Ata removida com sucesso!',
      errorMessage: 'Falha ao remover ata.',
    },
  )

  const handleCreate = async (data: any) => {
    const result = await createOperation.execute(data)
    if (result) {
      dialog.closeDialog()
    }
  }

  const handleUpdate = async (data: any) => {
    const result = await updateOperation.execute(data)
    if (result) {
      dialog.closeDialog()
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta ata?')) {
      await deleteOperation.execute(id)
    }
  }

  const openNew = () => {
    setSelectedMinute(null)
    dialog.openDialog()
  }

  const openEdit = (minute: Minute) => {
    setSelectedMinute(minute)
    dialog.openDialog()
  }

  return (
    <div className="space-y-4">
      {canEdit && (
        <div className="flex justify-end">
          <Button onClick={openNew}>
            <Plus className="mr-2 h-4 w-4" /> Nova Ata
          </Button>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Data da Sessão</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {minutes.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Nenhuma ata registrada.
                  </TableCell>
                </TableRow>
              ) : (
                minutes.map((minute) => (
                  <TableRow key={minute.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        {minute.title}
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(minute.date), "dd 'de' MMMM, yyyy", {
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          navigate(
                            `/dashboard/secretariat/minutes/${minute.id}`,
                          )
                        }
                      >
                        <Eye className="mr-2 h-4 w-4" /> Visualizar
                      </Button>
                      {canEdit && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(minute)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(minute.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <MinutesDialog
        open={dialog.open}
        onOpenChange={dialog.onOpenChange}
        minuteToEdit={selectedMinute}
        onSave={selectedMinute ? handleUpdate : handleCreate}
      />
    </div>
  )
}
