import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
  })
  .superRefine((data, ctx) => {
    if (data.paymentType === 'Outros' && !data.description?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Descreva o tipo de pagamento',
        path: ['description'],
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
    },
  })

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
    form.reset({
      brotherId: defaultBrotherId || '',
      paymentType: 'Iniciacao',
      description: '',
      totalAmount: 0,
      installmentsCount: 1,
      firstDueDate: todayLocalISODate(),
      ceremonyDate: '',
    })
  }, [open, defaultBrotherId, form])

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
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto">
        <FormHeader
          icon={GraduationCap}
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
