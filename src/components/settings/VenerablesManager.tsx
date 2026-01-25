import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import useSiteSettingsStore, { Venerable } from '@/stores/useSiteSettingsStore'
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown } from 'lucide-react'
import { VenerableDialog } from './VenerableDialog'
import { useDialog } from '@/hooks/use-dialog'
import { useAsyncOperation } from '@/hooks/use-async-operation'
import { useToast } from '@/hooks/use-toast'

export function VenerablesManager() {
  const { venerables, addVenerable, updateVenerable, deleteVenerable, reorderVenerables } =
    useSiteSettingsStore()

  const dialog = useDialog()
  const [selectedVenerable, setSelectedVenerable] = useState<Venerable | null>(
    null,
  )

  const saveOperation = useAsyncOperation(
    async (data: any) => {
      if (selectedVenerable) {
        await updateVenerable({ ...selectedVenerable, ...data })
        return 'Registro atualizado com sucesso.'
      } else {
        await addVenerable(data)
        return 'Venerável adicionado à galeria com sucesso.'
      }
    },
    {
      successMessage: 'Operação realizada com sucesso!',
      errorMessage: 'Falha ao salvar o registro.',
    },
  )

  const deleteOperation = useAsyncOperation(
    async (id: string) => {
      await deleteVenerable(id)
      return 'Venerável removido da galeria.'
    },
    {
      successMessage: 'Registro removido com sucesso!',
      errorMessage: 'Falha ao remover o registro.',
    },
  )

  const handleSave = async (data: any) => {
    const result = await saveOperation.execute(data)
    if (result) {
      setSelectedVenerable(null)
      dialog.closeDialog()
    }
  }

  const handleDelete = async (id: string) => {
    await deleteOperation.execute(id)
  }

  const openNew = () => {
    setSelectedVenerable(null)
    dialog.openDialog()
  }

  const openEdit = (venerable: Venerable) => {
    setSelectedVenerable(venerable)
    dialog.openDialog()
  }

  const handleMoveUp = async (index: number) => {
    if (index === 0) return
    
    const newOrder = [...venerables]
    const temp = newOrder[index]
    newOrder[index] = newOrder[index - 1]
    newOrder[index - 1] = temp
    
    const ids = newOrder.map(v => v.id)
    try {
      await reorderVenerables(ids)
      toast({
        title: 'Ordem atualizada',
        description: 'A ordem dos veneráveis foi atualizada com sucesso.',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível atualizar a ordem.',
      })
    }
  }

  const handleMoveDown = async (index: number) => {
    if (index === venerables.length - 1) return
    
    const newOrder = [...venerables]
    const temp = newOrder[index]
    newOrder[index] = newOrder[index + 1]
    newOrder[index + 1] = temp
    
    const ids = newOrder.map(v => v.id)
    try {
      await reorderVenerables(ids)
      toast({
        title: 'Ordem atualizada',
        description: 'A ordem dos veneráveis foi atualizada com sucesso.',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível atualizar a ordem.',
      })
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Galeria de Veneráveis</CardTitle>
          <CardDescription>
            Gerencie a lista de ex-veneráveis exibida no site.
          </CardDescription>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" /> Adicionar
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Foto</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Período</TableHead>
              <TableHead className="w-[120px]">Ordem</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {venerables.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-muted-foreground"
                >
                  Nenhum registro na galeria.
                </TableCell>
              </TableRow>
            ) : (
              venerables.map((v, index) => (
                <TableRow key={v.id}>
                  <TableCell>
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={
                          v.imageUrl ||
                          `https://img.usecurling.com/ppl/thumbnail?gender=male&seed=${v.id}`
                        }
                        alt={v.name}
                      />
                      <AvatarFallback>{v.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">{v.name}</TableCell>
                  <TableCell>{v.period}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleMoveDown(index)}
                        disabled={index === venerables.length - 1}
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(v)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(v.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>

      <VenerableDialog
        open={dialog.open}
        onOpenChange={(open) => {
          dialog.onOpenChange(open)
          if (!open) {
            setSelectedVenerable(null)
          }
        }}
        venerableToEdit={selectedVenerable}
        onSave={handleSave}
      />
    </Card>
  )
}
