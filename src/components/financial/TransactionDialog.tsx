import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Transaction } from '@/lib/data'
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
import { format } from 'date-fns'
import useFinancialStore from '@/stores/useFinancialStore'

const transactionSchema = z.object({
  description: z.string().min(3, 'Descrição é obrigatória'),
  amount: z.coerce.number().min(0.01, 'Valor deve ser maior que zero'),
  date: z.string().min(1, 'Data é obrigatória'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  type: z.enum(['Receita', 'Despesa']),
  accountId: z.string().min(1, 'Conta é obrigatória'),
})

type TransactionFormValues = z.infer<typeof transactionSchema>

interface TransactionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transactionToEdit: Transaction | null
  onSave: (data: TransactionFormValues) => void
  defaultType: 'Receita' | 'Despesa'
}

export function TransactionDialog({
  open,
  onOpenChange,
  transactionToEdit,
  onSave,
  defaultType,
}: TransactionDialogProps) {
  const { categories, accounts } = useFinancialStore()
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      description: '',
      amount: 0,
      date: format(new Date(), 'yyyy-MM-dd'),
      category: '',
      type: defaultType,
      accountId: '',
    },
  })

  useEffect(() => {
    if (transactionToEdit) {
      form.reset({
        description: transactionToEdit.description,
        amount: transactionToEdit.amount,
        date: transactionToEdit.date,
        category: transactionToEdit.category,
        type: transactionToEdit.type,
        accountId: transactionToEdit.accountId || '',
      })
    } else {
      form.reset({
        description: '',
        amount: 0,
        date: format(new Date(), 'yyyy-MM-dd'),
        category: '',
        type: defaultType,
        accountId: accounts.length > 0 ? accounts[0].id : '',
      })
    }
  }, [transactionToEdit, form, open, defaultType, accounts])

  const currentType = form.watch('type') || defaultType
  const availableCategories = categories.filter((c) => c.type === currentType)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {transactionToEdit ? 'Editar' : 'Nova'}{' '}
            {defaultType === 'Receita' ? 'Receita' : 'Despesa'}
          </DialogTitle>
          <DialogDescription>
            {transactionToEdit
              ? 'Atualize as informações da transação.'
              : `Registre uma nova ${defaultType === 'Receita' ? 'receita' : 'despesa'}.`}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Mensalidades Maio" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data</FormLabel>
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
              name="accountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conta Bancária / Caixa</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a conta..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.name}
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
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
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
                      {availableCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.name}>
                          {cat.name}
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
