import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Category } from '@/lib/data'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import useFinancialStore from '@/stores/useFinancialStore'

const categorySchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  type: z.enum(['Receita', 'Despesa']),
})

type CategoryFormValues = z.infer<typeof categorySchema>

interface CategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categoryToEdit: Category | null
  onSave: (data: CategoryFormValues) => void
}

export function CategoryDialog({
  open,
  onOpenChange,
  categoryToEdit,
  onSave,
}: CategoryDialogProps) {
  const { categories } = useFinancialStore()
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      type: 'Receita',
    },
  })

  useEffect(() => {
    if (categoryToEdit) {
      form.reset({
        name: categoryToEdit.name,
        type: categoryToEdit.type,
      })
    } else {
      form.reset({
        name: '',
        type: 'Receita',
      })
    }
  }, [categoryToEdit, form, open])

  const handleSubmit = (data: CategoryFormValues) => {
    // Duplicate check
    const isDuplicate = categories.some(
      (c) =>
        c.name.toLowerCase() === data.name.toLowerCase() &&
        c.type === data.type &&
        c.id !== categoryToEdit?.id,
    )

    if (isDuplicate) {
      form.setError('name', {
        type: 'manual',
        message: 'Já existe uma categoria com este nome para este tipo.',
      })
      return
    }

    onSave(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {categoryToEdit ? 'Editar Categoria' : 'Nova Categoria'}
          </DialogTitle>
          <DialogDescription>
            {categoryToEdit
              ? 'Atualize as informações da categoria.'
              : 'Crie uma nova categoria para organizar receitas e despesas.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Categoria</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Mensalidades" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={!!categoryToEdit} // Disable type change on edit to avoid conflicts? Usually better to allow if validated, but kept simple here.
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Receita">Receita</SelectItem>
                      <SelectItem value="Despesa">Despesa</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
