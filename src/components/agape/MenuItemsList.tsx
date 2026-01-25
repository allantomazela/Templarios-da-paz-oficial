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
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { useAgapeStore } from '@/stores/useAgapeStore'
import { MenuItemDialog } from './MenuItemDialog'
import { useDialog } from '@/hooks/use-dialog'
import { useToast } from '@/hooks/use-toast'
import { AgapeMenuItem } from '@/stores/useAgapeStore'

export function MenuItemsList() {
  const { menuItems, loading, deleteMenuItem } = useAgapeStore()
  const dialog = useDialog()
  const [selectedItem, setSelectedItem] = useState<AgapeMenuItem | null>(null)
  const { toast } = useToast()

  const handleEdit = (item: AgapeMenuItem) => {
    setSelectedItem(item)
    dialog.openDialog()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este item do cardápio?')) {
      return
    }

    const { error } = await deleteMenuItem(id)
    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o item.',
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Sucesso',
        description: 'Item excluído com sucesso.',
      })
    }
  }

  const handleNew = () => {
    setSelectedItem(null)
    dialog.openDialog()
  }

  const handleClose = () => {
    setSelectedItem(null)
    dialog.closeDialog()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Itens do Cardápio</h3>
        <Button onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Item
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
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {menuItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Nenhum item encontrado. Crie um novo item para começar.
                  </TableCell>
                </TableRow>
              ) : (
                menuItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.description || '-'}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(item.price)}
                    </TableCell>
                    <TableCell>
                      {item.is_active ? (
                        <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                      ) : (
                        <Badge variant="secondary">Inativo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          type="button"
                          onClick={() => handleEdit(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          type="button"
                          onClick={() => handleDelete(item.id)}
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

      <MenuItemDialog
        open={dialog.open}
        onOpenChange={(open) => {
          if (!open) {
            handleClose()
          } else {
            dialog.onOpenChange(open)
          }
        }}
        item={selectedItem}
      />
    </div>
  )
}
