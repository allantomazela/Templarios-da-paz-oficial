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
import { Wallet, Loader2 } from 'lucide-react'
import {
  Form,
  FormControl,
  FormDescription,
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
import {
  CONTRIBUTION_PAYMENT_METHODS,
  getPaymentMethodFromNotes,
  setPaymentMethodInNotes,
} from '@/lib/contribution-payment-methods'
import { formatCurrencyBRL } from '@/lib/member-payments'
import { todayLocalISODate } from '@/lib/format-utils'
import {
  ceremonyPlanLabel,
  type CeremonyInstallmentFormData,
  type CeremonyPaymentInstallment,
  type CeremonyPaymentPlan,
} from '@/lib/ceremony-payment-types'

const installmentSchema = z
  .object({
    status: z.enum(['Pago', 'Pendente', 'Atrasado']),
    paymentDate: z.string().optional(),
    accountId: z.string().optional(),
    notes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status === 'Pago' && !data.accountId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Conta bancária é obrigatória para pagamento confirmado',
        path: ['accountId'],
      })
    }
  })

type InstallmentFormValues = z.infer<typeof installmentSchema>

interface CeremonyInstallmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  plan: CeremonyPaymentPlan | null
  installment: CeremonyPaymentInstallment | null
  onSave: (data: CeremonyInstallmentFormData) => Promise<void>
  saving?: boolean
}

export function CeremonyInstallmentDialog({
  open,
  onOpenChange,
  plan,
  installment,
  onSave,
  saving = false,
}: CeremonyInstallmentDialogProps) {
  const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(true)

  const form = useForm<InstallmentFormValues>({
    resolver: zodResolver(installmentSchema),
    defaultValues: {
      status: 'Pago',
      paymentDate: todayLocalISODate(),
      accountId: '',
      notes: '',
    },
  })

  const watchStatus = form.watch('status')
  const watchNotes = form.watch('notes')
  const selectedPaymentMethod = getPaymentMethodFromNotes(watchNotes)

  useEffect(() => {
    if (!open) return
    setLoadingAccounts(true)
    fetchBankAccounts()
      .then(setAccounts)
      .finally(() => setLoadingAccounts(false))
  }, [open])

  useEffect(() => {
    if (!open || !installment) return
    form.reset({
      status: installment.status,
      paymentDate: installment.paymentDate || todayLocalISODate(),
      accountId: installment.accountId || '',
      notes: installment.notes || '',
    })
  }, [open, installment, form])

  if (!plan || !installment) return null

  const dialogTitle = `Parcela ${installment.installmentNumber}/${plan.installmentsCount}`

  const handleSubmit = async (values: InstallmentFormValues) => {
    await onSave({
      installmentId: installment.id,
      brotherName: plan.brotherName,
      paymentType: plan.paymentType,
      planDescription: plan.description,
      installmentNumber: installment.installmentNumber,
      installmentsCount: plan.installmentsCount,
      amount: installment.amount,
      status: values.status,
      paymentDate: values.paymentDate,
      accountId: values.accountId,
      notes: values.notes?.trim(),
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (saving) return
        onOpenChange(next)
      }}
    >
      <DialogContent className="max-w-lg" aria-describedby={undefined}>
        <DialogTitle className="sr-only">{dialogTitle}</DialogTitle>
        <FormHeader
          icon={<Wallet className="h-5 w-5" />}
          title={dialogTitle}
          description={`${ceremonyPlanLabel(plan)} — ${plan.brotherName || 'Irmão'}`}
        />
        <div className="rounded-md border px-3 py-2 text-sm">
          Valor da parcela:{' '}
          <strong>{formatCurrencyBRL(installment.amount)}</strong>
          {installment.dueDate ? (
            <span className="text-muted-foreground">
              {' '}
              · Vencimento {installment.dueDate.split('-').reverse().join('/')}
            </span>
          ) : null}
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Pago">Pago</SelectItem>
                      <SelectItem value="Pendente">Pendente</SelectItem>
                      <SelectItem value="Atrasado">Atrasado</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchStatus === 'Pago' ? (
              <>
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
                      <FormLabel>Conta bancária (tesouraria)</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={loadingAccounts}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Onde entrou o valor" />
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
                      <FormDescription>
                        Gera receita na categoria correspondente e compõe o saldo.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            ) : null}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <div className="flex flex-wrap gap-2 pb-2">
                    {CONTRIBUTION_PAYMENT_METHODS.map((method) => (
                      <Button
                        key={method}
                        type="button"
                        size="sm"
                        variant={selectedPaymentMethod === method ? 'default' : 'outline'}
                        onClick={() =>
                          form.setValue(
                            'notes',
                            setPaymentMethodInNotes(field.value, method),
                            { shouldDirty: true },
                          )
                        }
                      >
                        {method}
                      </Button>
                    ))}
                  </div>
                  <FormControl>
                    <Textarea rows={3} {...field} />
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
                    Salvando...
                  </>
                ) : (
                  'Salvar parcela'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
