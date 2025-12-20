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
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'
import { MinutesDialog } from './MinutesDialog'
import useAuthStore from '@/stores/useAuthStore'

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
  const { toast } = useToast()
  const navigate = useNavigate()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedMinute, setSelectedMinute] = useState<Minute | null>(null)

  useEffect(() => {
    fetchMinutes()
  }, [fetchMinutes])

  const canEdit = user?.role === 'admin' || user?.role === 'editor'

  const handleCreate = async (data: any) => {
    try {
      await createMinute(data)
      toast({ title: 'Sucesso', description: 'Ata criada com sucesso.' })
      setIsDialogOpen(false)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Falha ao criar ata.',
      })
    }
  }

  const handleUpdate = async (data: any) => {
    if (!selectedMinute) return
    try {
      await updateMinute(selectedMinute.id, data)
      toast({ title: 'Sucesso', description: 'Ata atualizada com sucesso.' })
      setIsDialogOpen(false)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Falha ao atualizar ata.',
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta ata?')) {
      try {
        await deleteMinute(id)
        toast({ title: 'Removida', description: 'Ata removida com sucesso.' })
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Falha ao remover ata.',
        })
      }
    }
  }

  const openNew = () => {
    setSelectedMinute(null)
    setIsDialogOpen(true)
  }

  const openEdit = (minute: Minute) => {
    setSelectedMinute(minute)
    setIsDialogOpen(true)
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
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        minuteToEdit={selectedMinute}
        onSave={selectedMinute ? handleUpdate : handleCreate}
      />
    </div>
  )
}
