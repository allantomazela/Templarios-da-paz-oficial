/**
 * EXEMPLO DE MIGRAÇÃO - VenerablesManager
 * 
 * Este é um exemplo de como o componente ficaria após migração.
 * NÃO substitua o arquivo original ainda - use como referência!
 * 
 * Para aplicar: Renomeie este arquivo para VenerablesManager.tsx
 * (ou faça backup do original primeiro)
 */

import { useState } from 'react'
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
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { VenerableDialog } from './VenerableDialog'
// ✅ NOVO: Importar os hooks customizados
import { useDialog } from '@/hooks/use-dialog'
import { useAsyncOperation } from '@/hooks/use-async-operation'

export function VenerablesManager() {
  const { venerables, addVenerable, updateVenerable, deleteVenerable } =
    useSiteSettingsStore()

  // ✅ ANTES: const [isDialogOpen, setIsDialogOpen] = useState(false)
  // ✅ DEPOIS: Hook customizado gerencia o estado do dialog
  const dialog = useDialog()
  const [selectedVenerable, setSelectedVenerable] = useState<Venerable | null>(
    null,
  )

  // ✅ ANTES: Função com try/catch manual e toast manual
  // ✅ DEPOIS: Hook gerencia loading, error e toast automaticamente
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
      successMessage: 'Operação realizada com sucesso!', // Será sobrescrito pelo return
      errorMessage: 'Falha ao salvar o registro.',
    },
  )

  // ✅ NOVO: Hook para operação de deletar
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

  // ✅ Simplificado: Apenas chama o hook e fecha o dialog se sucesso
  const handleSave = async (data: any) => {
    const result = await saveOperation.execute(data)
    if (result) {
      dialog.closeDialog()
    }
  }

  // ✅ Simplificado: Apenas chama o hook
  const handleDelete = async (id: string) => {
    await deleteOperation.execute(id)
  }

  // ✅ ANTES: setIsDialogOpen(true)
  // ✅ DEPOIS: dialog.openDialog()
  const openNew = () => {
    setSelectedVenerable(null)
    dialog.openDialog()
  }

  const openEdit = (venerable: Venerable) => {
    setSelectedVenerable(venerable)
    dialog.openDialog()
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
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {venerables.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-8 text-muted-foreground"
                >
                  Nenhum registro na galeria.
                </TableCell>
              </TableRow>
            ) : (
              venerables.map((v) => (
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
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(v)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(v.id)}
                      disabled={deleteOperation.loading}
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

      {/* ✅ ANTES: open={isDialogOpen} onOpenChange={setIsDialogOpen} */}
      {/* ✅ DEPOIS: open={dialog.open} onOpenChange={dialog.onOpenChange} */}
      <VenerableDialog
        open={dialog.open}
        onOpenChange={dialog.onOpenChange}
        venerableToEdit={selectedVenerable}
        onSave={handleSave}
      />
    </Card>
  )
}

