import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog'
import { FormHeader } from '@/components/ui/form-header'
import { Banknote, Loader2 } from 'lucide-react'
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
import { fetchBankAccounts } from '@/lib/contribution-payments'
import { formatCurrencyBRL } from '@/lib/format-utils'
import { todayLocalISODate } from '@/lib/format-utils'
import type { TempleSale, TempleSaleMarkPaidData } from '@/lib/temple-sale-types'

const markPaidSchema = z.object({
  paymentDate: z.string().min(1, 'Data é obrigatória'),
  accountId: z.string().min(1, 'Conta bancária é obrigatória'),
  notes: z.string().optional(),
})

type MarkPaidFormValues = z.infer<typeof markPaidSchema>

interface TempleSaleMarkPaidDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sale: TempleSale | null
  onConfirm: (data: TempleSaleMarkPaidData) => void
  saving?: boolean
}

export function TempleSaleMarkPaidDialog({
  open,
  onOpenChange,
  sale,
  onConfirm,
  saving = false,
}: TempleSaleMarkPaidDialogProps) {
  const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(true)

  const form = useForm<MarkPaidFormValues>({
    resolver: zodResolver(markPaidSchema),
    defaultValues: {
      paymentDate: todayLocalISODate(),
      accountId: '',
      notes: '',
    },
  })

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoadingAccounts(true)
    fetchBankAccounts()
      .then((rows) => {
        if (!cancelled) setAccounts(rows)
      })
      .catch(() => {
        if (!cancelled) setAccounts([])
      })
      .finally(() => {
        if (!cancelled) setLoadingAccounts(false)
      })
    return () => {
      cancelled = true
    }
  }, [open])

  useEffect(() => {
    if (!open || !sale) return
    form.reset({
      paymentDate: todayLocalISODate(),
      accountId: sale.accountId ?? '',
      notes: sale.notes ?? '',
    })
  }, [open, sale, form])

  function handleSubmit(values: MarkPaidFormValues) {
    if (!sale) return
    onConfirm({
      saleId: sale.id,
      brotherName: sale.brotherName,
      description: sale.description,
      amount: sale.amount,
      paymentDate: values.paymentDate,
      accountId: values.accountId,
      notes: values.notes,
      existingTransactionId: sale.transactionId,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogTitle className="sr-only">Marcar venda como paga</DialogTitle>
        <FormHeader
          icon={<Banknote className="h-5 w-5" />}
          title="Marcar como pago"
          description={
            sale
              ? `${sale.brotherName ?? 'Irmão'} — ${sale.description} (${formatCurrencyBRL(sale.amount)})`
              : 'Confirme o pagamento da venda.'
          }
        />

        {loadingAccounts ? (
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Carregando contas...
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="paymentDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data do pagamento</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="accountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conta bancária</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a conta" />
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Confirmando...
                    </>
                  ) : (
                    'Confirmar pagamento'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}
