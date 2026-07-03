import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import type { Category } from '@/lib/data'
import type { FinancialPayable } from '@/lib/financial-payable-types'
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
import { FormHeader } from '@/components/ui/form-header'
import { FileText, Loader2 } from 'lucide-react'
import { todayLocalISODate } from '@/lib/format-utils'

const payableSchema = z.object({
  description: z.string().min(3, 'Descrição é obrigatória'),
  supplierName: z.string().optional(),
  categoryId: z.string().min(1, 'Categoria é obrigatória'),
  amount: z.coerce.number().min(0.01, 'Valor deve ser maior que zero'),
  dueDate: z.string().min(1, 'Vencimento é obrigatório'),
  documentReference: z.string().optional(),
  notes: z.string().optional(),
})

export type PayableFormValues = z.infer<typeof payableSchema>

interface PayableDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  payableToEdit: FinancialPayable | null
  categories: Category[]
  defaultValues?: Partial<PayableFormValues & { forecastItemId?: string }>
  onSave: (data: PayableFormValues) => Promise<void>
  saving?: boolean
}

export function PayableDialog({
  open,
  onOpenChange,
  payableToEdit,
  categories,
  defaultValues,
  onSave,
  saving = false,
}: PayableDialogProps) {
  const expenseCategories = categories.filter((c) => c.type === 'Despesa')

  const form = useForm<PayableFormValues>({
    resolver: zodResolver(payableSchema),
    defaultValues: {
      description: '',
      supplierName: '',
      categoryId: '',
      amount: 0,
      dueDate: todayLocalISODate(),
      documentReference: '',
      notes: '',
    },
  })

  useEffect(() => {
    if (!open) return

    if (payableToEdit) {
      form.reset({
        description: payableToEdit.description,
        supplierName: payableToEdit.supplierName ?? '',
        categoryId: payableToEdit.categoryId,
        amount: payableToEdit.amount,
        dueDate: payableToEdit.dueDate,
        documentReference: payableToEdit.documentReference ?? '',
        notes: payableToEdit.notes ?? '',
      })
      return
    }

    form.reset({
      description: defaultValues?.description ?? '',
      supplierName: defaultValues?.supplierName ?? '',
      categoryId: defaultValues?.categoryId ?? '',
      amount: defaultValues?.amount ?? 0,
      dueDate: defaultValues?.dueDate ?? todayLocalISODate(),
      documentReference: defaultValues?.documentReference ?? '',
      notes: defaultValues?.notes ?? '',
    })
  }, [open, payableToEdit, defaultValues, form])

  const handleSubmit = async (values: PayableFormValues) => {
    await onSave(values)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogTitle className="sr-only">
          {payableToEdit ? 'Editar conta a pagar' : 'Nova conta a pagar'}
        </DialogTitle>
        <FormHeader
          icon={<FileText className="h-5 w-5" />}
          title={payableToEdit ? 'Editar conta a pagar' : 'Nova conta a pagar'}
          description="Registre boletos e compromissos futuros sem afetar o saldo até o pagamento."
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
                    <Input placeholder="Ex.: Boleto energia elétrica" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="supplierName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fornecedor (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do fornecedor" {...field} />
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
                    <FormLabel>Valor</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vencimento</FormLabel>
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
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {expenseCategories.map((category) => (
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
              name="documentReference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Referência do documento (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Nº boleto, NF, linha digitável..." {...field} />
                  </FormControl>
                  <FormMessage />
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
                    <Textarea rows={2} placeholder="Detalhes para conferência no pagamento" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
