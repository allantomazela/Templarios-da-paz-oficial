import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import type { BankAccount } from '@/lib/data'
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
import { Wallet, Loader2 } from 'lucide-react'
import { formatCurrencyBRL, todayLocalISODate } from '@/lib/format-utils'
import { fetchBankAccounts } from '@/lib/contribution-payments'
import { PAYABLE_STATUS_LABELS } from '@/lib/financial-payable-types'

const paymentSchema = z
  .object({
    status: z.enum(['Pago', 'Pendente', 'Atrasado', 'Cancelado']),
    paymentDate: z.string().optional(),
    accountId: z.string().optional(),
    attachmentNotes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status === 'Pago' && !data.accountId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Conta bancária é obrigatória para confirmar pagamento',
        path: ['accountId'],
      })
    }
  })

export type PayablePaymentFormValues = z.infer<typeof paymentSchema>

interface PayablePaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  payable: FinancialPayable | null
  onSave: (data: PayablePaymentFormValues) => Promise<boolean>
  saving?: boolean
}

export function PayablePaymentDialog({
  open,
  onOpenChange,
  payable,
  onSave,
  saving = false,
}: PayablePaymentDialogProps) {
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(false)

  const form = useForm<PayablePaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      status: 'Pago',
      paymentDate: todayLocalISODate(),
      accountId: '',
      attachmentNotes: '',
    },
  })

  const currentStatus = form.watch('status')

  useEffect(() => {
    if (!open) return
    setLoadingAccounts(true)
    void fetchBankAccounts()
      .then(setAccounts)
      .catch(() => setAccounts([]))
      .finally(() => setLoadingAccounts(false))
  }, [open])

  useEffect(() => {
    if (!open || !payable) return

    form.reset({
      status: payable.status === 'Cancelado' ? 'Cancelado' : 'Pago',
      paymentDate: payable.paymentDate ?? todayLocalISODate(),
      accountId: payable.accountId ?? '',
      attachmentNotes: payable.notes ?? '',
    })
  }, [open, payable, form])

  const handleSubmit = async (values: PayablePaymentFormValues) => {
    const saved = await onSave(values)
    if (saved) onOpenChange(false)
  }

  if (!payable) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogTitle className="sr-only">Registrar pagamento</DialogTitle>
        <FormHeader
          icon={<Wallet className="h-5 w-5" />}
          title="Registrar pagamento"
          description={`${payable.description} — ${formatCurrencyBRL(payable.amount)} · venc. ${payable.dueDate.split('-').reverse().join('/')}`}
        />
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Situação</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Pago">Confirmar pagamento</SelectItem>
                      <SelectItem value="Pendente">Manter pendente</SelectItem>
                      <SelectItem value="Atrasado">Marcar em atraso</SelectItem>
                      <SelectItem value="Cancelado">Cancelar compromisso</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {currentStatus === 'Pago' ? (
              <>
                <div className="grid grid-cols-2 gap-4">
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
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || undefined}
                          disabled={loadingAccounts}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  loadingAccounts ? 'Carregando...' : 'Selecione'
                                }
                              />
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
                </div>

                <FormField
                  control={form.control}
                  name="attachmentNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações do comprovante</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={2}
                          placeholder="PIX, NF, protocolo..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Status atual: {PAYABLE_STATUS_LABELS[payable.status]}
                {currentStatus === 'Cancelado'
                  ? ' — o compromisso será cancelado e nenhuma despesa será lançada.'
                  : ' — nenhuma movimentação de caixa será registrada.'}
              </p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Fechar
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
