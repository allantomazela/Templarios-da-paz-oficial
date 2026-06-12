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
import { getSaveErrorMessage } from '@/lib/auth-utils'
import { useAgapeStore } from '@/stores/useAgapeStore'
import { MenuItemDialog } from './MenuItemDialog'
import { useDialog } from '@/hooks/use-dialog'
import { formatCurrencyBRL } from '@/lib/format-utils'
import { useToast } from '@/hooks/use-toast'
import { AgapeMenuItem } from '@/stores/useAgapeStore'

export function MenuItemsList() {
  const { menuItems, menuItemsLoading, deleteMenuItem } = useAgapeStore()
  const dialog = useDialog()
  const [selectedItem, setSelectedItem] = useState<AgapeMenuItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AgapeMenuItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  const handleEdit = (item: AgapeMenuItem) => {
    setSelectedItem(item)
    dialog.openDialog()
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      const { error } = await deleteMenuItem(deleteTarget.id)
      if (error) {
        toast({
          title: 'Erro',
          description: getSaveErrorMessage(error),
          variant: 'destructive',
        })
        return
      }
      toast({ title: 'Item excluído' })
      setDeleteTarget(null)
    } finally {
      setIsDeleting(false)
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

      {menuItemsLoading && menuItems.length === 0 ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[72px]">Imagem</TableHead>
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
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Nenhum item encontrado. Crie um novo item para começar.
                  </TableCell>
                </TableRow>
              ) : (
                menuItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="h-12 w-12 rounded-md object-cover border"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-md border bg-muted/40 text-[10px] text-muted-foreground">
                          Sem foto
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.description || '-'}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>
                      {formatCurrencyBRL(item.price)}
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
                          onClick={() => setDeleteTarget(item)}
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
        key={selectedItem?.id ?? 'new'}
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

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && !isDeleting && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir item do cardápio?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget ? (
                <>
                  O item <strong>{deleteTarget.name}</strong> será removido. Consumos
                  antigos que referenciam este item podem impedir a exclusão — nesse caso,
                  exclua os consumos primeiro.
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
