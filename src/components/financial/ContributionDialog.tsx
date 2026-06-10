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
import { Wallet } from 'lucide-react'
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
  CONTRIBUTION_PAYMENT_METHODS,
  getPaymentMethodFromNotes,
  setPaymentMethodInNotes,
} from '@/lib/contribution-payment-methods'
import { BrotherSearchCombobox } from '@/components/financial/BrotherSearchCombobox'
import { MembershipFeeQuickSettings } from '@/components/financial/MembershipFeeQuickSettings'
import { formatCurrencyBRL } from '@/lib/member-payments'
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
    if (data.status === 'Pago' && !data.accountId) {
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
  defaultAmount?: number
  feeSettings?: MembershipFeeSettings
  onUpdateFeeSettings?: (settings: MembershipFeeSettings) => Promise<void>
  onSave: (data: ContributionFormData) => void
}

export function ContributionDialog({
  open,
  onOpenChange,
  contributionToEdit,
  defaultBrotherId,
  defaultAmount = 150,
  feeSettings,
  onUpdateFeeSettings,
  onSave,
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
      paymentDate: new Date().toISOString().slice(0, 10),
      accountId: '',
      notes: '',
    },
  })

  const watchStatus = form.watch('status')
  const watchNotes = form.watch('notes')
  const selectedPaymentMethod = getPaymentMethodFromNotes(watchNotes)

  useEffect(() => {
    if (!open) return

    const loadOptions = async () => {
      setLoadingOptions(true)
      try {
        const [brothersData, accountsData] = await Promise.all([
          fetchApprovedBrothers(),
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
  }, [open])

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
          contributionToEdit.paymentDate ||
          new Date().toISOString().slice(0, 10),
        accountId: contributionToEdit.accountId || '',
        notes: contributionToEdit.notes || '',
      })
    } else {
      form.reset({
        brotherId: defaultBrotherId || '',
        month: CONTRIBUTION_MONTHS[new Date().getMonth()],
        year: new Date().getFullYear(),
        amount: defaultAmount,
        status: 'Pago',
        paymentDate: new Date().toISOString().slice(0, 10),
        accountId: '',
        notes: '',
      })
    }
  }, [contributionToEdit, defaultBrotherId, defaultAmount, form, open])

  useEffect(() => {
    if (watchStatus === 'Pago' && !form.getValues('paymentDate')) {
      form.setValue('paymentDate', new Date().toISOString().slice(0, 10))
    }
  }, [watchStatus, form])

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
      brotherName: brother?.full_name || undefined,
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
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                      disabled={!!contributionToEdit}
                      loading={loadingOptions}
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
