import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { FinancialGoal, Category } from '@/lib/data'
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

const goalSchema = z.object({
  name: z.string().min(3, 'Nome é obrigatório'),
  targetAmount: z.coerce.number().min(0.01, 'Valor deve ser maior que zero'),
  linkedCategory: z.string().optional(),
  deadline: z.string().min(1, 'Prazo é obrigatório'),
})

type GoalFormValues = z.infer<typeof goalSchema>

interface GoalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  goalToEdit: FinancialGoal | null
  onSave: (data: GoalFormValues) => void
}

export function GoalDialog({
  open,
  onOpenChange,
  goalToEdit,
  onSave,
}: GoalDialogProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const supabaseAny = supabase as any

  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: '',
      targetAmount: 0,
      linkedCategory: undefined,
      deadline: '',
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
            .eq('type', 'Receita')
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
    if (goalToEdit) {
      form.reset({
        name: goalToEdit.name,
        targetAmount: goalToEdit.targetAmount,
        linkedCategory: goalToEdit.linkedCategory || undefined,
        deadline: goalToEdit.deadline,
      })
    } else {
      form.reset({
        name: '',
        targetAmount: 0,
        linkedCategory: undefined,
        deadline: '',
      })
    }
  }, [goalToEdit, form, open])

  // Categories are already filtered to Receita in the query
  const revenueCategories = categories

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {goalToEdit ? 'Editar Meta Financeira' : 'Nova Meta Financeira'}
          </DialogTitle>
          <DialogDescription>
            {goalToEdit
              ? 'Atualize as informações da meta financeira.'
              : 'Crie uma nova meta financeira para acompanhar seus objetivos.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Meta</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Fundo de Reserva" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="targetAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Alvo (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="deadline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prazo</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="linkedCategory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria Vinculada (Fonte de Recursos)</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value || undefined)}
                    value={field.value || undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Nenhuma (Manual)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {loadingCategories ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      ) : revenueCategories.length === 0 ? (
                        <div className="p-4 text-sm text-muted-foreground">
                          Nenhuma categoria de receita cadastrada
                        </div>
                      ) : (
                        revenueCategories.map((c) => (
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
