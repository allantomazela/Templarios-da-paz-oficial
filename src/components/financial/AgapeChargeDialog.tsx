import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import type { AgapeBrotherCharge } from '@/lib/data'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog'
import { FormHeader } from '@/components/ui/form-header'
import { Wine, Loader2 } from 'lucide-react'
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
import {
  CONTRIBUTION_MONTHS,
  fetchApprovedBrothers,
  fetchBankAccounts,
  type AgapeChargeFormData,
} from '@/lib/agape-payments'
import { BrotherSearchCombobox } from '@/components/financial/BrotherSearchCombobox'
import { formatCurrencyBRL } from '@/lib/member-payments'
import { todayLocalISODate } from '@/lib/format-utils'

const chargeSchema = z
  .object({
    brotherId: z.string().min(1, 'Irmão é obrigatório'),
    month: z.string().min(1, 'Mês é obrigatório'),
    year: z.coerce.number().min(2000, 'Ano inválido'),
    consumedAmount: z.coerce.number().min(0, 'Valor inválido'),
    amount: z.coerce.number().min(0.01, 'Valor inválido'),
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

type ChargeFormValues = z.infer<typeof chargeSchema>

interface AgapeChargeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  chargeToEdit: AgapeBrotherCharge | null
  defaultMonth?: number
  defaultYear?: number
  defaultBrotherId?: string
  defaultConsumedAmount?: number
  readOnlyMonthYear?: boolean
  onSave: (data: AgapeChargeFormData) => void
  saving?: boolean
}

export function AgapeChargeDialog({
  open,
  onOpenChange,
  chargeToEdit,
  defaultMonth,
  defaultYear,
  defaultBrotherId,
  defaultConsumedAmount = 0,
  readOnlyMonthYear = false,
  onSave,
  saving = false,
}: AgapeChargeDialogProps) {
  const [brothers, setBrothers] = useState<
    { id: string; full_name: string | null }[]
  >([])
  const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([])
  const [loadingOptions, setLoadingOptions] = useState(true)

  const monthIndex =
    chargeToEdit?.month != null
      ? chargeToEdit.month - 1
      : defaultMonth != null
        ? defaultMonth - 1
        : new Date().getMonth()

  const form = useForm<ChargeFormValues>({
    resolver: zodResolver(chargeSchema),
    defaultValues: {
      brotherId: '',
      month: CONTRIBUTION_MONTHS[monthIndex],
      year: defaultYear ?? new Date().getFullYear(),
      consumedAmount: defaultConsumedAmount,
      amount: defaultConsumedAmount || 0.01,
      status: 'Pago',
      paymentDate: todayLocalISODate(),
      accountId: '',
      notes: '',
    },
  })

  const watchStatus = form.watch('status')
  const watchConsumed = form.watch('consumedAmount')

  useEffect(() => {
    if (!open) return

    let cancelled = false
    setLoadingOptions(true)

    Promise.all([fetchApprovedBrothers(), fetchBankAccounts()])
      .then(([bros, accs]) => {
        if (cancelled) return
        setBrothers(bros)
        setAccounts(accs)
        if (accs.length === 1 && !form.getValues('accountId')) {
          form.setValue('accountId', accs[0].id)
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingOptions(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, form])

  useEffect(() => {
    if (!open) return

    if (chargeToEdit) {
      form.reset({
        brotherId: chargeToEdit.brotherId,
        month: CONTRIBUTION_MONTHS[chargeToEdit.month - 1],
        year: chargeToEdit.year,
        consumedAmount: chargeToEdit.consumedAmount,
        amount: chargeToEdit.amount,
        status: chargeToEdit.status,
        paymentDate: chargeToEdit.paymentDate || todayLocalISODate(),
        accountId: chargeToEdit.accountId || '',
        notes: chargeToEdit.notes || '',
      })
    } else {
      form.reset({
        brotherId: defaultBrotherId || '',
        month: CONTRIBUTION_MONTHS[monthIndex],
        year: defaultYear ?? new Date().getFullYear(),
        consumedAmount: defaultConsumedAmount,
        amount: defaultConsumedAmount || 0.01,
        status: 'Pago',
        paymentDate: todayLocalISODate(),
        accountId: accounts[0]?.id || '',
        notes: '',
      })
    }
  }, [
    open,
    chargeToEdit,
    defaultBrotherId,
    defaultConsumedAmount,
    defaultYear,
    monthIndex,
    form,
    accounts,
  ])

  const handleSubmit = (values: ChargeFormValues) => {
    const brotherName =
      brothers.find((b) => b.id === values.brotherId)?.full_name || undefined

    onSave({
      brotherId: values.brotherId,
      brotherName,
      month: values.month,
      year: values.year,
      consumedAmount: values.consumedAmount,
      amount: values.amount,
      status: values.status,
      paymentDate: values.paymentDate,
      accountId: values.accountId,
      notes: values.notes,
    })
  }

  return (
    <Dialog open={open} onOpenChange={saving ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <FormHeader
          icon={<Wine className="h-5 w-5" />}
          title={chargeToEdit ? 'Editar pagamento do ágape' : 'Registrar pagamento do ágape'}
          description="Vincula o pagamento do irmão à tesouraria como receita na categoria Ágape."
        />
        <DialogTitle className="sr-only">
          {chargeToEdit ? 'Editar pagamento' : 'Registrar pagamento'}
        </DialogTitle>

        {loadingOptions ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="brotherId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Irmão</FormLabel>
                    <FormControl>
                      <BrotherSearchCombobox
                        brothers={brothers}
                        value={field.value}
                        onChange={field.onChange}
                        disabled={!!chargeToEdit}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="month"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mês</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={readOnlyMonthYear || !!chargeToEdit}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CONTRIBUTION_MONTHS.map((m) => (
                            <SelectItem key={m} value={m}>
                              {m}
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
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ano</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          disabled={readOnlyMonthYear || !!chargeToEdit}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="consumedAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Consumo registrado</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          {...field}
                          readOnly={!!chargeToEdit}
                        />
                      </FormControl>
                      <FormDescription>
                        {formatCurrencyBRL(watchConsumed)}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor a pagar</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" min="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
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

              {watchStatus === 'Pago' && (
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
                        <FormLabel>Conta bancária</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a conta" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {accounts.length === 0 ? (
                              <SelectItem value="__none__" disabled>
                                Nenhuma conta cadastrada
                              </SelectItem>
                            ) : (
                              accounts.map((acc) => (
                                <SelectItem key={acc.id} value={acc.id}>
                                  {acc.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

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
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}
