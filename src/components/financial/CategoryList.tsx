import { useState, useEffect } from 'react'
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
import { Plus, Search, Pencil, Trash2, AlertTriangle, Loader2 } from 'lucide-react'
import { Category } from '@/lib/data'
import { CategoryDialog } from './CategoryDialog'
import { useDialog } from '@/hooks/use-dialog'
import { useAsyncOperation } from '@/hooks/use-async-operation'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
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

interface CategoryFromDB {
  id: string
  name: string
  type: 'Receita' | 'Despesa'
  created_at: string
  updated_at: string
}

export function CategoryList() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const dialog = useDialog()
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  )
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null,
  )
  const { toast } = useToast()
  const supabaseAny = supabase as any

  // Load categories from Supabase
  const loadCategories = useAsyncOperation(
    async () => {
      setLoading(true)
      const { data, error } = await supabaseAny
        .from('financial_categories')
        .select('*')
        .order('name', { ascending: true })

      if (error) {
        throw new Error('Falha ao carregar categorias.')
      }

      const mapped: Category[] = (data || []).map((c: CategoryFromDB) => ({
        id: c.id,
        name: c.name,
        type: c.type,
      }))

      setCategories(mapped)
      setLoading(false)
      return null
    },
    {
      showSuccessToast: false,
      errorMessage: 'Falha ao carregar categorias.',
    },
  )

  useEffect(() => {
    loadCategories.execute()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  const saveOperation = useAsyncOperation(
    async (data: any) => {
      if (selectedCategory) {
        // Update
        const { error } = await supabaseAny
          .from('financial_categories')
          .update({
            name: data.name,
            type: data.type,
          })
          .eq('id', selectedCategory.id)

        if (error) throw error

        await loadCategories.execute()
        return 'Categoria atualizada com sucesso.'
      } else {
        // Create
        const { error } = await supabaseAny
          .from('financial_categories')
          .insert({
            name: data.name,
            type: data.type,
          })

        if (error) throw error

        await loadCategories.execute()
        return 'Categoria criada com sucesso.'
      }
    },
    {
      successMessage: 'Operação realizada com sucesso!',
      errorMessage: 'Falha ao salvar a categoria.',
    },
  )

  const deleteOperation = useAsyncOperation(
    async (id: string) => {
      // Check if category is in use by transactions
      const { data: transactions, error: checkError } = await supabaseAny
        .from('financial_transactions')
        .select('id')
        .eq('category_id', id)
        .limit(1)

      if (checkError) throw checkError

      if (transactions && transactions.length > 0) {
        toast({
          title: 'Erro',
          description: 'Não é possível excluir uma categoria que está em uso por transações.',
          variant: 'destructive',
        })
        return
      }

      const { error } = await supabaseAny
        .from('financial_categories')
        .delete()
        .eq('id', id)

      if (error) throw error

      await loadCategories.execute()
      return 'Categoria removida.'
    },
    {
      successMessage: 'Categoria removida com sucesso!',
      errorMessage: 'Falha ao remover a categoria.',
    },
  )

  const handleSave = async (data: any) => {
    const result = await saveOperation.execute(data)
    if (result) {
      dialog.closeDialog()
    }
  }

  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category)
  }

  const confirmDelete = () => {
    if (categoryToDelete) {
      deleteOperation.execute(categoryToDelete.id)
      setCategoryToDelete(null)
    }
  }

  const openNew = () => {
    setSelectedCategory(null)
    dialog.openDialog()
  }

  const openEdit = (category: Category) => {
    setSelectedCategory(category)
    dialog.openDialog()
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
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando categorias...
                  </div>
                </TableCell>
              </TableRow>
            ) : paginatedCategories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8">
                  {searchTerm
                    ? 'Nenhuma categoria encontrada com o termo buscado.'
                    : 'Nenhuma categoria cadastrada.'}
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
        open={dialog.open}
        onOpenChange={dialog.onOpenChange}
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
