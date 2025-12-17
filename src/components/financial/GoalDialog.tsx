import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { FinancialGoal } from '@/lib/data'
import {
  Dialog,
  DialogContent,
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
import useFinancialStore from '@/stores/useFinancialStore'

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
  const { categories } = useFinancialStore()
  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: '',
      targetAmount: 0,
      linkedCategory: '',
      deadline: '',
    },
  })

  useEffect(() => {
    if (goalToEdit) {
      form.reset({
        name: goalToEdit.name,
        targetAmount: goalToEdit.targetAmount,
        linkedCategory: goalToEdit.linkedCategory || '',
        deadline: goalToEdit.deadline,
      })
    } else {
      form.reset({
        name: '',
        targetAmount: 0,
        linkedCategory: '',
        deadline: '',
      })
    }
  }, [goalToEdit, form, open])

  // Only show Revenue categories for Goals (e.g. Savings/Income sources)
  const revenueCategories = categories.filter((c) => c.type === 'Receita')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {goalToEdit ? 'Editar Meta Financeira' : 'Nova Meta Financeira'}
          </DialogTitle>
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
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione (Opcional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Nenhuma (Manual)</SelectItem>
                      {revenueCategories.map((c) => (
                        <SelectItem key={c.id} value={c.name}>
                          {c.name}
                        </SelectItem>
                      ))}
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
