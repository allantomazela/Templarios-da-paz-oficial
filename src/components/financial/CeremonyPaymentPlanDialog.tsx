import { useEffect, useMemo, useState } from 'react'
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
import { GraduationCap, Loader2 } from 'lucide-react'
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
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { BrotherSearchCombobox, type BrotherOption } from '@/components/financial/BrotherSearchCombobox'
import { fetchBankAccounts } from '@/lib/contribution-payments'
import { Checkbox } from '@/components/ui/checkbox'
import { formatCurrencyBRL } from '@/lib/member-payments'
import { todayLocalISODate } from '@/lib/format-utils'
import {
  CEREMONY_PAYMENT_TYPES,
  CEREMONY_PAYMENT_TYPE_LABELS,
  splitInstallmentAmounts,
  type CeremonyPaymentType,
  type CeremonyPlanFormData,
} from '@/lib/ceremony-payment-types'

const planSchema = z
  .object({
    brotherId: z.string().min(1, 'Irmão é obrigatório'),
    paymentType: z.enum(['Iniciacao', 'Elevacao', 'Exaltacao', 'Outros']),
    description: z.string().optional(),
    totalAmount: z.coerce.number().min(0.01, 'Valor total inválido'),
    installmentsCount: z.coerce.number().int().min(1).max(48),
    firstDueDate: z.string().optional(),
    ceremonyDate: z.string().optional(),
    registerNow: z.boolean(),
    paymentDate: z.string().optional(),
    accountId: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.paymentType === 'Outros' && !data.description?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Descreva o tipo de pagamento',
        path: ['description'],
      })
    }
    if (data.registerNow && !data.accountId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Selecione a conta bancária para registrar na tesouraria',
        path: ['accountId'],
      })
    }
  })

type PlanFormValues = z.infer<typeof planSchema>

interface CeremonyPaymentPlanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultBrotherId?: string
  brothers: BrotherOption[]
  onSave: (data: CeremonyPlanFormData) => Promise<void>
  saving?: boolean
}

export function CeremonyPaymentPlanDialog({
  open,
  onOpenChange,
  defaultBrotherId,
  brothers,
  onSave,
  saving = false,
}: CeremonyPaymentPlanDialogProps) {
  const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(true)

  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      brotherId: '',
      paymentType: 'Iniciacao',
      description: '',
      totalAmount: 0,
      installmentsCount: 1,
      firstDueDate: todayLocalISODate(),
      ceremonyDate: '',
      registerNow: true,
      paymentDate: todayLocalISODate(),
      accountId: '',
    },
  })

  const watchRegisterNow = form.watch('registerNow')

  const watchTotal = form.watch('totalAmount')
  const watchCount = form.watch('installmentsCount')
  const watchType = form.watch('paymentType')

  const previewAmounts = useMemo(() => {
    const total = Number(watchTotal) || 0
    const count = Number(watchCount) || 1
    if (total <= 0 || count <= 0) return []
    return splitInstallmentAmounts(total, count)
  }, [watchTotal, watchCount])

  useEffect(() => {
    if (!open) return
    setLoadingAccounts(true)
    fetchBankAccounts()
      .then((data) => {
        setAccounts(data)
        if (data.length === 1) {
          form.setValue('accountId', data[0].id)
        }
      })
      .finally(() => setLoadingAccounts(false))
  }, [open, form])

  useEffect(() => {
    if (!open) return
    form.reset({
      brotherId: defaultBrotherId || '',
      paymentType: 'Iniciacao',
      description: '',
      totalAmount: 0,
      installmentsCount: 1,
      firstDueDate: todayLocalISODate(),
      ceremonyDate: '',
      registerNow: true,
      paymentDate: todayLocalISODate(),
      accountId: accounts[0]?.id || '',
    })
  }, [open, defaultBrotherId, form, accounts])

  const handleSubmit = async (values: PlanFormValues) => {
    const brother = brothers.find((b) => b.id === values.brotherId)
    await onSave({
      brotherId: values.brotherId,
      brotherName: brother?.full_name?.trim(),
      paymentType: values.paymentType as CeremonyPaymentType,
      description: values.description?.trim(),
      totalAmount: values.totalAmount,
      installmentsCount: values.installmentsCount,
      firstDueDate: values.firstDueDate || todayLocalISODate(),
      ceremonyDate: values.ceremonyDate || undefined,
      registerPayment: values.registerNow
        ? {
            paymentDate: values.paymentDate || todayLocalISODate(),
            accountId: values.accountId!,
          }
        : undefined,
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
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto" aria-describedby={undefined}>
        <DialogTitle className="sr-only">Nova taxa / pagamento parcelado</DialogTitle>
        <FormHeader
          icon={<GraduationCap className="h-5 w-5" />}
          title="Nova taxa / pagamento parcelado"
          description="Iniciação, Elevação, Exaltação ou outro valor com controle de parcelas."
        />
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="brotherId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Irmão</FormLabel>
                  <BrotherSearchCombobox
                    brothers={brothers}
                    value={field.value}
                    onChange={field.onChange}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de pagamento</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CEREMONY_PAYMENT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {CEREMONY_PAYMENT_TYPE_LABELS[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchType === 'Outros' ? (
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex.: taxa de regularização" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="totalAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor total</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="installmentsCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nº de parcelas</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" max="48" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {previewAmounts.length > 0 ? (
              <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
                <p className="font-medium mb-1">Parcelas geradas:</p>
                <p className="text-muted-foreground">
                  {previewAmounts
                    .map((amount, index) => `${index + 1}ª: ${formatCurrencyBRL(amount)}`)
                    .join(' · ')}
                </p>
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="firstDueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>1º vencimento</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription>
                      Demais parcelas a cada 1 mês.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ceremonyDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data da cerimônia (opcional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-3 rounded-md border p-3">
              <FormField
                control={form.control}
                name="registerNow"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start gap-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => field.onChange(checked === true)}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Registrar 1ª parcela na tesouraria agora</FormLabel>
                      <FormDescription>
                        Gera receita em Financeiro → Receitas e compõe o saldo da conta.
                        Demais parcelas podem ser registradas depois.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {watchRegisterNow ? (
                <div className="grid gap-4 sm:grid-cols-2 pt-1">
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ) : null}
            </div>

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
                  'Criar plano de parcelas'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
