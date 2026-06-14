import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Contribution } from '@/lib/data'
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
import {
  CONTRIBUTION_MONTHS,
  fetchApprovedBrothers,
  fetchBankAccounts,
  type ContributionFormData,
  type MembershipFeeSettings,
} from '@/lib/contribution-payments'
import {
  isMembershipHistoricalPeriod,
  MEMBERSHIP_HISTORICAL_NOTE,
} from '@/lib/membership-schedule'
import {
  CONTRIBUTION_PAYMENT_METHODS,
  getPaymentMethodFromNotes,
  setPaymentMethodInNotes,
} from '@/lib/contribution-payment-methods'
import { BrotherSearchCombobox, type BrotherOption } from '@/components/financial/BrotherSearchCombobox'
import { MembershipFeeQuickSettings } from '@/components/financial/MembershipFeeQuickSettings'
import { formatCurrencyBRL } from '@/lib/member-payments'
import { todayLocalISODate } from '@/lib/format-utils'
import { cn } from '@/lib/utils'

const contributionSchema = z
  .object({
    brotherId: z.string().min(1, 'Irmão é obrigatório'),
    month: z.string().min(1, 'Mês é obrigatório'),
    year: z.coerce.number().min(2000, 'Ano inválido'),
    amount: z.coerce.number().min(0.01, 'Valor inválido'),
    status: z.enum(['Pago', 'Pendente', 'Atrasado']),
    paymentDate: z.string().optional(),
    accountId: z.string().optional(),
    notes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const monthIndex = CONTRIBUTION_MONTHS.indexOf(
      data.month as (typeof CONTRIBUTION_MONTHS)[number],
    )
    const monthNum = monthIndex >= 0 ? monthIndex + 1 : 0
    const isHistorical =
      monthNum > 0 && isMembershipHistoricalPeriod(data.year, monthNum)

    if (data.status === 'Pago' && !isHistorical && !data.accountId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Conta bancária é obrigatória para pagamento confirmado',
        path: ['accountId'],
      })
    }
  })

type ContributionFormValues = z.infer<typeof contributionSchema>

interface ContributionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contributionToEdit: Contribution | null
  defaultBrotherId?: string
  defaultBrotherName?: string
  defaultMonth?: string
  defaultYear?: number
  defaultAmount?: number
  brothers?: BrotherOption[]
  feeSettings?: MembershipFeeSettings
  onUpdateFeeSettings?: (settings: MembershipFeeSettings) => Promise<void>
  onSave: (data: ContributionFormData) => void
  saving?: boolean
}

export function ContributionDialog({
  open,
  onOpenChange,
  contributionToEdit,
  defaultBrotherId,
  defaultBrotherName,
  defaultMonth,
  defaultYear,
  defaultAmount = 150,
  brothers: brothersProp,
  feeSettings,
  onUpdateFeeSettings,
  onSave,
  saving = false,
}: ContributionDialogProps) {
  const [brothers, setBrothers] = useState<
    { id: string; full_name: string | null }[]
  >([])
  const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([])
  const [loadingOptions, setLoadingOptions] = useState(true)

  const form = useForm<ContributionFormValues>({
    resolver: zodResolver(contributionSchema),
    defaultValues: {
      brotherId: '',
      month: CONTRIBUTION_MONTHS[new Date().getMonth()],
      year: new Date().getFullYear(),
      amount: defaultAmount,
      status: 'Pago',
      paymentDate: todayLocalISODate(),
      accountId: '',
      notes: '',
    },
  })

  const watchStatus = form.watch('status')
  const watchNotes = form.watch('notes')
  const watchMonth = form.watch('month')
  const watchYear = form.watch('year')
  const selectedPaymentMethod = getPaymentMethodFromNotes(watchNotes)

  const monthIndex = CONTRIBUTION_MONTHS.indexOf(
    watchMonth as (typeof CONTRIBUTION_MONTHS)[number],
  )
  const isHistoricalPeriod =
    monthIndex >= 0 &&
    isMembershipHistoricalPeriod(watchYear, monthIndex + 1)

  useEffect(() => {
    if (!open) return

    const loadOptions = async () => {
      if (brothersProp && brothersProp.length > 0) {
        setBrothers(brothersProp)
      }

      setLoadingOptions(true)
      try {
        const [brothersData, accountsData] = await Promise.all([
          brothersProp && brothersProp.length > 0
            ? Promise.resolve(brothersProp)
            : fetchApprovedBrothers(),
          fetchBankAccounts(),
        ])
        setBrothers(brothersData)
        setAccounts(accountsData)
      } catch (error) {
        console.error('Erro ao carregar opções:', error)
      } finally {
        setLoadingOptions(false)
      }
    }

    loadOptions()
  }, [open, brothersProp])

  useEffect(() => {
    if (!open) return

    if (contributionToEdit) {
      form.reset({
        brotherId: contributionToEdit.brotherId,
        month: contributionToEdit.month,
        year: contributionToEdit.year,
        amount: contributionToEdit.amount,
        status: contributionToEdit.status,
        paymentDate:
          contributionToEdit.paymentDate || todayLocalISODate(),
        accountId: contributionToEdit.accountId || '',
        notes: contributionToEdit.notes || '',
      })
    } else {
      form.reset({
        brotherId: defaultBrotherId || '',
        month: defaultMonth || CONTRIBUTION_MONTHS[new Date().getMonth()],
        year: defaultYear ?? new Date().getFullYear(),
        amount: defaultAmount,
        status: 'Pago',
        paymentDate: todayLocalISODate(),
        accountId: '',
        notes: '',
      })
    }
  }, [
    contributionToEdit,
    defaultBrotherId,
    defaultMonth,
    defaultYear,
    defaultAmount,
    form,
    open,
  ])

  useEffect(() => {
    if (watchStatus !== 'Pago') return
    if (contributionToEdit) {
      if (!form.getValues('paymentDate')) {
        form.setValue('paymentDate', todayLocalISODate())
      }
      return
    }
    form.setValue('paymentDate', todayLocalISODate())
  }, [watchStatus, contributionToEdit, form])

  const dialogTitle = contributionToEdit
    ? 'Editar mensalidade'
    : 'Registrar mensalidade'
  const dialogDescription = contributionToEdit
    ? 'Atualize o lançamento. Pagamentos confirmados atualizam a receita na tesouraria.'
    : 'Informe o pagamento individual do irmão. Ao marcar como Pago, a receita entra no saldo.'

  const handleSubmit = (values: ContributionFormValues) => {
    const brother = brothers.find((b) => b.id === values.brotherId)
    const monthIdx = CONTRIBUTION_MONTHS.indexOf(
      values.month as (typeof CONTRIBUTION_MONTHS)[number],
    )
    const historical =
      monthIdx >= 0 &&
      isMembershipHistoricalPeriod(values.year, monthIdx + 1)

    onSave({
      ...values,
      brotherName:
        brother?.full_name?.trim() ||
        defaultBrotherName?.trim() ||
        contributionToEdit?.brotherName ||
        undefined,
      notes: historical
        ? values.notes?.trim()
          ? `${MEMBERSHIP_HISTORICAL_NOTE}. ${values.notes.trim()}`
          : MEMBERSHIP_HISTORICAL_NOTE
        : values.notes,
      accountId: historical ? undefined : values.accountId,
    })
  }

  const handlePaymentMethodSelect = (method: (typeof CONTRIBUTION_PAYMENT_METHODS)[number]) => {
    form.setValue('notes', setPaymentMethodInNotes(form.getValues('notes'), method), {
      shouldDirty: true,
    })
  }

  const applyDefaultAmount = () => {
    form.setValue('amount', defaultAmount, { shouldDirty: true })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (saving) return
        onOpenChange(next)
      }}
    >
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
        <DialogTitle className="sr-only">{dialogTitle}</DialogTitle>
        <FormHeader
          title={dialogTitle}
          description={dialogDescription}
          icon={<Wallet className="h-5 w-5" />}
        />

        {feeSettings && onUpdateFeeSettings && !contributionToEdit && (
          <MembershipFeeQuickSettings
            compact
            settings={feeSettings}
            onSave={onUpdateFeeSettings}
          />
        )}

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
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
                      selectedLabel={
                        defaultBrotherName ||
                        contributionToEdit?.brotherName ||
                        undefined
                      }
                      disabled={!!contributionToEdit}
                      loading={loadingOptions && brothers.length === 0}
                      placeholder="Buscar e selecionar irmão"
                    />
                  </FormControl>
                  <FormDescription>
                    Digite o nome para filtrar a lista de irmãos.
                  </FormDescription>
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
                    <FormLabel>Mês referência</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Mês" />
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
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                    <FormDescription className="flex flex-wrap items-center gap-1">
                      <span>Padrão: {formatCurrencyBRL(defaultAmount)}</span>
                      <Button
                        type="button"
                        variant="link"
                        className="h-auto p-0 text-xs"
                        onClick={applyDefaultAmount}
                      >
                        Aplicar
                      </Button>
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Status" />
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
            </div>

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
                {isHistoricalPeriod ? (
                  <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    Período anterior a jun/2026: registro apenas de controle.{' '}
                    <strong>Não gera receita</strong> na tesouraria.
                  </p>
                ) : (
                  <FormField
                    control={form.control}
                    name="accountId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Conta bancária (tesouraria)</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={loadingOptions}
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
                          Gera receita na categoria Mensalidade e compõe o saldo.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </>
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      placeholder="Complementos: comprovante, acordo, observações..."
                      {...field}
                    />
                  </FormControl>
                  <div className="space-y-2 pt-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      Forma de pagamento
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {CONTRIBUTION_PAYMENT_METHODS.map((method) => (
                        <Button
                          key={method}
                          type="button"
                          size="sm"
                          variant={
                            selectedPaymentMethod === method
                              ? 'default'
                              : 'outline'
                          }
                          className={cn(
                            'h-8 text-xs',
                            selectedPaymentMethod === method &&
                              'ring-2 ring-primary ring-offset-1',
                          )}
                          onClick={() => handlePaymentMethodSelect(method)}
                        >
                          {method}
                        </Button>
                      ))}
                    </div>
                  </div>
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
              <Button type="submit" disabled={saving || loadingOptions}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
