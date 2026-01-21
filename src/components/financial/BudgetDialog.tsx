import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Budget, Category } from '@/lib/data'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
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
import { supabase } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

interface CategoryFromDB {
  id: string
  name: string
  type: 'Receita' | 'Despesa'
}

const budgetSchema = z.object({
  name: z.string().min(3, 'Nome é obrigatório'),
  type: z.enum(['Receita', 'Despesa']),
  category: z.string().optional(),
  amount: z.coerce.number().min(0.01, 'Valor deve ser maior que zero'),
  period: z.enum(['Mensal', 'Anual', 'Personalizado']),
})

type BudgetFormValues = z.infer<typeof budgetSchema>

interface BudgetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  budgetToEdit: Budget | null
  onSave: (data: BudgetFormValues) => void
}

export function BudgetDialog({
  open,
  onOpenChange,
  budgetToEdit,
  onSave,
}: BudgetDialogProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const supabaseAny = supabase as any

  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      name: '',
      type: 'Despesa',
      category: undefined,
      amount: 0,
      period: 'Mensal',
    },
  })

  // Load categories from Supabase
  useEffect(() => {
    if (open) {
      const loadCategories = async () => {
        setLoadingCategories(true)
        try {
          const { data, error } = await supabaseAny
            .from('financial_categories')
            .select('*')
            .order('name')

          if (error) throw error

          const mapped: Category[] = (data || []).map((c: CategoryFromDB) => ({
            id: c.id,
            name: c.name,
            type: c.type,
          }))

          setCategories(mapped)
        } catch (error) {
          console.error('Error loading categories:', error)
        } finally {
          setLoadingCategories(false)
        }
      }

      loadCategories()
    }
  }, [open, supabaseAny])

  useEffect(() => {
    if (budgetToEdit) {
      form.reset({
        name: budgetToEdit.name,
        type: budgetToEdit.type,
        category: budgetToEdit.category || undefined,
        amount: budgetToEdit.amount,
        period: budgetToEdit.period,
      })
    } else {
      form.reset({
        name: '',
        type: 'Despesa',
        category: undefined,
        amount: 0,
        period: 'Mensal',
      })
    }
  }, [budgetToEdit, form, open])

  const selectedType = form.watch('type')
  const availableCategories = categories.filter((c) => c.type === selectedType)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {budgetToEdit ? 'Editar Orçamento' : 'Novo Orçamento'}
          </DialogTitle>
          <DialogDescription>
            {budgetToEdit
              ? 'Atualize as informações do orçamento.'
              : 'Crie um novo orçamento para planejamento financeiro.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Despesas Eventos" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
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
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria (Opcional)</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value || undefined)}
                      value={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Todas" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {loadingCategories ? (
                          <div className="flex items-center justify-center p-4">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        ) : availableCategories.length === 0 ? (
                          <div className="p-4 text-sm text-muted-foreground">
                            Nenhuma categoria cadastrada para {selectedType}
                          </div>
                        ) : (
                          availableCategories.map((c) => (
                            <SelectItem key={c.id} value={c.name}>
                              {c.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Meta (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="period"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Período</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Período" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Mensal">Mensal</SelectItem>
                        <SelectItem value="Anual">Anual</SelectItem>
                        <SelectItem value="Personalizado">
                          Personalizado
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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
