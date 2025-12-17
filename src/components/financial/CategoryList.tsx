import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Pencil, Trash2, AlertTriangle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import useFinancialStore from '@/stores/useFinancialStore'
import { Category } from '@/lib/data'
import { CategoryDialog } from './CategoryDialog'
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

const ITEMS_PER_PAGE = 5

export function CategoryList() {
  const {
    categories,
    transactions,
    addCategory,
    updateCategory,
    deleteCategory,
  } = useFinancialStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  )
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null,
  )
  const { toast } = useToast()

  // Filter and Search
  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Pagination
  const totalPages = Math.ceil(filteredCategories.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedCategories = filteredCategories.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  )

  const handleSave = (data: any) => {
    if (selectedCategory) {
      updateCategory({ ...selectedCategory, ...data })
      toast({ title: 'Sucesso', description: 'Categoria atualizada.' })
    } else {
      addCategory({ id: crypto.randomUUID(), ...data })
      toast({ title: 'Sucesso', description: 'Categoria criada.' })
    }
    setIsDialogOpen(false)
  }

  const handleDeleteClick = (category: Category) => {
    // Check if in use
    const isInUse = transactions.some(
      (t) =>
        t.category === category.name && // Comparing by name as per current data structure
        t.type === category.type,
    )

    if (isInUse) {
      toast({
        variant: 'destructive',
        title: 'Ação Bloqueada',
        description:
          'Não é possível excluir esta categoria pois existem transações associadas a ela.',
      })
      return
    }

    setCategoryToDelete(category)
  }

  const confirmDelete = () => {
    if (categoryToDelete) {
      deleteCategory(categoryToDelete.id)
      toast({ title: 'Sucesso', description: 'Categoria removida.' })
      setCategoryToDelete(null)
    }
  }

  const openNew = () => {
    setSelectedCategory(null)
    setIsDialogOpen(true)
  }

  const openEdit = (category: Category) => {
    setSelectedCategory(category)
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar categorias..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" /> Nova Categoria
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedCategories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8">
                  Nenhuma categoria encontrada.
                </TableCell>
              </TableRow>
            ) : (
              paginatedCategories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        category.type === 'Receita' ? 'default' : 'destructive'
                      }
                      className={
                        category.type === 'Receita' ? 'bg-green-600' : ''
                      }
                    >
                      {category.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(category)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteClick(category)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="cursor-pointer"
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  isActive={currentPage === page}
                  onClick={() => setCurrentPage(page)}
                  className="cursor-pointer"
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                className="cursor-pointer"
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <CategoryDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        categoryToEdit={selectedCategory}
        onSave={handleSave}
      />

      <AlertDialog
        open={!!categoryToDelete}
        onOpenChange={(open) => !open && setCategoryToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a categoria "
              {categoryToDelete?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
