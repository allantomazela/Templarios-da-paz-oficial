import { useEffect, useState, useMemo } from 'react'
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
import { Wallet, Loader2, Info } from 'lucide-react'
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
  fetchLinkableMensalidadeTransactions,
  type ContributionFormData,
  type ContributionTreasuryMode,
  type LinkableMensalidadeTransaction,
  type MembershipFeeSettings,
} from '@/lib/contribution-payments'
import {
  CONTRIBUTION_PAYMENT_METHODS,
  getPaymentMethodFromNotes,
  setPaymentMethodInNotes,
} from '@/lib/contribution-payment-methods'
import { BrotherSearchCombobox, type BrotherOption } from '@/components/financial/BrotherSearchCombobox'
import { MembershipFeeQuickSettings } from '@/components/financial/MembershipFeeQuickSettings'
import { formatCurrencyBRL } from '@/lib/member-payments'
import { formatDateBR, todayLocalISODate } from '@/lib/format-utils'
import { cn } from '@/lib/utils'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { getMembershipLaunchGuidance } from '@/lib/membership-payment-guidance'
import { isMembershipHistoricalPeriod } from '@/lib/membership-schedule'
import {
  detectTreasuryModeFromContribution,
  stripControlOnlyNote,
} from '@/lib/membership-control-only'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

function monthNameToNumber(month: string): number {
  return (
    CONTRIBUTION_MONTHS.indexOf(month as (typeof CONTRIBUTION_MONTHS)[number]) + 1
  )
}

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
    treasuryMode: z
      .enum(['standard', 'control_only', 'link_existing'])
      .optional(),
    linkedTransactionId: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status !== 'Pago') return

    const monthNum = monthNameToNumber(data.month)
    const isProduction = !isMembershipHistoricalPeriod(data.year, monthNum)
    const mode = data.treasuryMode ?? 'standard'

    if (mode === 'standard' && !data.accountId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Conta bancária é obrigatória para pagamento confirmado',
        path: ['accountId'],
      })
    }

    if (isProduction && mode === 'link_existing' && !data.linkedTransactionId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Selecione a receita existente para vincular',
        path: ['linkedTransactionId'],
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
  /** Meses em aberto no cronograma do irmão (para orientação de lançamento). */
  openMonthsCount?: number
  /** Lançamento iniciado a partir de uma linha específica do cronograma. */
  launchFromSchedule?: boolean
  /** Modo inicial da tesouraria (ex.: só controle no cronograma). */
  defaultTreasuryMode?: ContributionTreasuryMode
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
  openMonthsCount = 0,
  launchFromSchedule = false,
  defaultTreasuryMode = 'standard',
}: ContributionDialogProps) {
  const [brothers, setBrothers] = useState<
    { id: string; full_name: string | null }[]
  >([])
  const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([])
  const [linkableTransactions, setLinkableTransactions] = useState<
    LinkableMensalidadeTransaction[]
  >([])
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [loadingLinkable, setLoadingLinkable] = useState(false)

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
      treasuryMode: 'standard' as ContributionTreasuryMode,
      linkedTransactionId: '',
    },
  })

  const watchStatus = form.watch('status')
  const watchNotes = form.watch('notes')
  const watchBrotherId = form.watch('brotherId')
  const watchMonth = form.watch('month')
  const watchYear = form.watch('year')
  const watchTreasuryMode = form.watch('treasuryMode')
  const selectedPaymentMethod = getPaymentMethodFromNotes(watchNotes)

  const isProductionPeriod = useMemo(() => {
    if (!watchMonth) return false
    return !isMembershipHistoricalPeriod(
      watchYear,
      monthNameToNumber(watchMonth),
    )
  }, [watchMonth, watchYear])

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
    if (!open || watchStatus !== 'Pago' || watchTreasuryMode !== 'link_existing') {
      setLinkableTransactions([])
      return
    }

    const brother = brothers.find((b) => b.id === watchBrotherId)
    const brotherName =
      brother?.full_name?.trim() ||
      defaultBrotherName?.trim() ||
      contributionToEdit?.brotherName?.trim()

    if (!brotherName || !watchMonth) return

    const monthNum = monthNameToNumber(watchMonth)
    let cancelled = false

    const loadLinkable = async () => {
      setLoadingLinkable(true)
      try {
        const rows = await fetchLinkableMensalidadeTransactions({
          brotherName,
          referenceMonth: monthNum,
          referenceYear: watchYear,
        })
        if (!cancelled) setLinkableTransactions(rows)
      } catch (error) {
        console.error('Erro ao carregar receitas vinculáveis:', error)
        if (!cancelled) setLinkableTransactions([])
      } finally {
        if (!cancelled) setLoadingLinkable(false)
      }
    }

    loadLinkable()
    return () => {
      cancelled = true
    }
  }, [
    open,
    watchStatus,
    watchTreasuryMode,
    watchBrotherId,
    watchMonth,
    watchYear,
    brothers,
    defaultBrotherName,
    contributionToEdit?.brotherName,
  ])

  useEffect(() => {
    if (!open) return

    if (contributionToEdit) {
      const treasuryMode = detectTreasuryModeFromContribution(contributionToEdit)
      form.reset({
        brotherId: contributionToEdit.brotherId,
        month: contributionToEdit.month,
        year: contributionToEdit.year,
        amount: contributionToEdit.amount,
        status: contributionToEdit.status,
        paymentDate:
          contributionToEdit.paymentDate || todayLocalISODate(),
        accountId: contributionToEdit.accountId || '',
        notes: stripControlOnlyNote(contributionToEdit.notes),
        treasuryMode,
        linkedTransactionId: contributionToEdit.transactionId || '',
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
        treasuryMode: defaultTreasuryMode,
        linkedTransactionId: '',
      })
    }
  }, [
    contributionToEdit,
    defaultBrotherId,
    defaultMonth,
    defaultYear,
    defaultAmount,
    defaultTreasuryMode,
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

    onSave({
      ...values,
      brotherName:
        brother?.full_name?.trim() ||
        defaultBrotherName?.trim() ||
        contributionToEdit?.brotherName ||
        undefined,
      notes: values.notes?.trim() || undefined,
      accountId: values.accountId,
      treasuryMode: values.treasuryMode ?? 'standard',
      linkedTransactionId: values.linkedTransactionId || undefined,
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

  const launchGuidance = useMemo(() => {
    if (contributionToEdit) return null

    if (launchFromSchedule || defaultMonth) {
      return getMembershipLaunchGuidance({
        openMonthsCount: Math.max(openMonthsCount, 1),
        isSingleMonthLaunch: true,
      })
    }

    if (openMonthsCount >= 2) {
      return {
        title: 'Vários meses em aberto',
        message: `Este irmão tem ${openMonthsCount} mês(es) em aberto. Para quitar vários meses com um único PIX, abra o cronograma e use "Quitar selecionados".`,
        variant: 'warning' as const,
        suggestBatchSettlement: true,
      }
    }

    return null
  }, [
    contributionToEdit,
    launchFromSchedule,
    defaultMonth,
    openMonthsCount,
  ])

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
            {launchGuidance ? (
              <Alert
                className={cn(
                  launchGuidance.variant === 'warning'
                    ? 'border-amber-200 bg-amber-50 text-amber-900'
                    : 'border-sky-200 bg-sky-50 text-sky-900',
                )}
              >
                <Info className="h-4 w-4" />
                <AlertTitle className="text-sm">{launchGuidance.title}</AlertTitle>
                <AlertDescription className="text-sm">
                  {launchGuidance.message}
                </AlertDescription>
              </Alert>
            ) : null}

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

                {isProductionPeriod ? (
                  <FormField
                    control={form.control}
                    name="treasuryMode"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Tesouraria</FormLabel>
                        <FormControl>
                          <RadioGroup
                            value={field.value ?? 'standard'}
                            onValueChange={(value) => {
                              field.onChange(value as ContributionTreasuryMode)
                              if (value === 'control_only') {
                                form.setValue('accountId', '')
                                form.setValue('linkedTransactionId', '')
                              }
                              if (value === 'standard') {
                                form.setValue('linkedTransactionId', '')
                              }
                            }}
                            className="space-y-2"
                          >
                            <div className="flex items-start gap-2 rounded-md border p-3">
                              <RadioGroupItem
                                value="standard"
                                id="treasury-standard"
                                className="mt-0.5"
                              />
                              <Label
                                htmlFor="treasury-standard"
                                className="cursor-pointer space-y-1 font-normal"
                              >
                                <span className="block text-sm font-medium">
                                  Lançar receita no caixa
                                </span>
                                <span className="block text-xs text-muted-foreground">
                                  Cria ou atualiza a receita na conta bancária
                                  selecionada.
                                </span>
                              </Label>
                            </div>
                            <div className="flex items-start gap-2 rounded-md border p-3">
                              <RadioGroupItem
                                value="control_only"
                                id="treasury-control-only"
                                className="mt-0.5"
                              />
                              <Label
                                htmlFor="treasury-control-only"
                                className="cursor-pointer space-y-1 font-normal"
                              >
                                <span className="block text-sm font-medium">
                                  Pago — somente controle
                                </span>
                                <span className="block text-xs text-muted-foreground">
                                  Marca o mês como quitado sem gerar nova receita
                                  (valor já está no caixa).
                                </span>
                              </Label>
                            </div>
                            <div className="flex items-start gap-2 rounded-md border p-3">
                              <RadioGroupItem
                                value="link_existing"
                                id="treasury-link-existing"
                                className="mt-0.5"
                              />
                              <Label
                                htmlFor="treasury-link-existing"
                                className="cursor-pointer space-y-1 font-normal"
                              >
                                <span className="block text-sm font-medium">
                                  Vincular receita existente
                                </span>
                                <span className="block text-xs text-muted-foreground">
                                  Associa uma receita de mensalidade já lançada
                                  na tesouraria.
                                </span>
                              </Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : null}

                {watchTreasuryMode === 'link_existing' && isProductionPeriod ? (
                  <FormField
                    control={form.control}
                    name="linkedTransactionId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Receita existente</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={loadingLinkable}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  loadingLinkable
                                    ? 'Carregando receitas...'
                                    : 'Selecione a receita'
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {linkableTransactions.length === 0 ? (
                              <SelectItem value="__none__" disabled>
                                Nenhuma receita disponível para este mês
                              </SelectItem>
                            ) : (
                              linkableTransactions.map((tx) => (
                                <SelectItem key={tx.id} value={tx.id}>
                                  {formatDateBR(tx.date)} —{' '}
                                  {formatCurrencyBRL(tx.amount)}
                                  {tx.accountName ? ` (${tx.accountName})` : ''}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Mostra receitas de mensalidade do irmão ainda não
                          vinculadas ao cronograma.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : null}

                {(watchTreasuryMode ?? 'standard') === 'standard' ? (
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
                ) : null}
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
