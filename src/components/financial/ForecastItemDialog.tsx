import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import type { BankAccount, Category } from '@/lib/data'
import type { ForecastItem } from '@/lib/forecast-types'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
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
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { FormHeader } from '@/components/ui/form-header'
import { CalendarClock } from 'lucide-react'

const forecastItemSchema = z
  .object({
    description: z.string().min(2, 'Descrição é obrigatória'),
    type: z.enum(['Receita', 'Despesa']),
    categoryId: z.string().optional(),
    expectedAmount: z.coerce.number().min(0.01, 'Valor deve ser maior que zero'),
    dueDay: z.coerce.number().min(1).max(28),
    recurrence: z.enum(['monthly', 'annual', 'once']),
    recurrenceMonth: z.coerce.number().optional(),
    preferredAccountId: z.string().optional(),
    isActive: z.boolean(),
    notes: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.recurrence !== 'monthly' && !values.recurrenceMonth) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Informe o mês para recorrência anual ou única',
        path: ['recurrenceMonth'],
      })
    }
  })

export type ForecastItemFormValues = z.infer<typeof forecastItemSchema>

interface ForecastItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemToEdit: ForecastItem | null
  categories: Category[]
  accounts: BankAccount[]
  onSave: (data: ForecastItemFormValues) => Promise<void>
}

export function ForecastItemDialog({
  open,
  onOpenChange,
  itemToEdit,
  categories,
  accounts,
  onSave,
}: ForecastItemDialogProps) {
  const form = useForm<ForecastItemFormValues>({
    resolver: zodResolver(forecastItemSchema),
    defaultValues: {
      description: '',
      type: 'Despesa',
      categoryId: '',
      expectedAmount: 0,
      dueDay: 10,
      recurrence: 'monthly',
      recurrenceMonth: undefined,
      preferredAccountId: '',
      isActive: true,
      notes: '',
    },
  })

  const currentType = form.watch('type')
  const recurrence = form.watch('recurrence')
  const filteredCategories = categories.filter(
    (category) => category.type === currentType,
  )

  useEffect(() => {
    if (itemToEdit) {
      form.reset({
        description: itemToEdit.description,
        type: itemToEdit.type,
        categoryId: itemToEdit.categoryId ?? '',
        expectedAmount: itemToEdit.expectedAmount,
        dueDay: itemToEdit.dueDay,
        recurrence: itemToEdit.recurrence,
        recurrenceMonth: itemToEdit.recurrenceMonth ?? undefined,
        preferredAccountId: itemToEdit.preferredAccountId ?? '',
        isActive: itemToEdit.isActive,
        notes: itemToEdit.notes ?? '',
      })
    } else if (open) {
      form.reset({
        description: '',
        type: 'Despesa',
        categoryId: '',
        expectedAmount: 0,
        dueDay: 10,
        recurrence: 'monthly',
        recurrenceMonth: undefined,
        preferredAccountId: accounts[0]?.id ?? '',
        isActive: true,
        notes: '',
      })
    }
  }, [itemToEdit, form, open, accounts])

  const handleSubmit = async (values: ForecastItemFormValues) => {
    await onSave(values)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogTitle className="sr-only">
          {itemToEdit ? 'Editar conta fixa' : 'Nova conta fixa'}
        </DialogTitle>
        <FormHeader
          icon={CalendarClock}
          title={itemToEdit ? 'Editar conta fixa' : 'Nova conta fixa'}
          description="Cadastre receitas ou despesas recorrentes para o planejamento."
        />
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Conta de luz" {...field} />
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
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
                name="expectedAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor previsto</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dueDay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dia de vencimento</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" max="28" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="recurrence"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recorrência</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="monthly">Mensal</SelectItem>
                        <SelectItem value="annual">Anual</SelectItem>
                        <SelectItem value="once">Única</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {recurrence !== 'monthly' ? (
              <FormField
                control={form.control}
                name="recurrenceMonth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mês</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      value={field.value ? String(field.value) : undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o mês" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, index) => (
                          <SelectItem key={index + 1} value={String(index + 1)}>
                            {index + 1}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || undefined}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Opcional" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="preferredAccountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conta preferida</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || undefined}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Opcional" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <FormLabel>Ativo no planejamento</FormLabel>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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
