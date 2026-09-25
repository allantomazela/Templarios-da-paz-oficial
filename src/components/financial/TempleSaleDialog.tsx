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
import { ShoppingBag, Loader2 } from 'lucide-react'
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
import { BrotherSearchCombobox } from '@/components/financial/BrotherSearchCombobox'
import {
  fetchApprovedBrothers,
  fetchBankAccounts,
} from '@/lib/contribution-payments'
import { todayLocalISODate } from '@/lib/format-utils'
import type { TempleSale, TempleSaleFormData } from '@/lib/temple-sale-types'

const saleSchema = z
  .object({
    brotherId: z.string().min(1, 'Irmão é obrigatório'),
    description: z.string().min(1, 'Descrição é obrigatória'),
    amount: z.coerce.number().min(0.01, 'Valor inválido'),
    saleDate: z.string().min(1, 'Data da venda é obrigatória'),
    dueDate: z.string().optional(),
    paymentMode: z.enum(['avista', 'prazo']),
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

type SaleFormValues = z.infer<typeof saleSchema>

interface TempleSaleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  saleToEdit: TempleSale | null
  onSave: (data: TempleSaleFormData) => void
  saving?: boolean
}

export function TempleSaleDialog({
  open,
  onOpenChange,
  saleToEdit,
  onSave,
  saving = false,
}: TempleSaleDialogProps) {
  const [brothers, setBrothers] = useState<
    { id: string; full_name: string | null }[]
  >([])
  const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([])
  const [loadingOptions, setLoadingOptions] = useState(true)

  const form = useForm<SaleFormValues>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      brotherId: '',
      description: '',
      amount: 0,
      saleDate: todayLocalISODate(),
      dueDate: '',
      paymentMode: 'prazo',
      status: 'Pendente',
      paymentDate: todayLocalISODate(),
      accountId: '',
      notes: '',
    },
  })

  const paymentMode = form.watch('paymentMode')
  const status = form.watch('status')

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoadingOptions(true)
    Promise.all([fetchApprovedBrothers(), fetchBankAccounts()])
      .then(([brotherRows, accountRows]) => {
        if (cancelled) return
        setBrothers(brotherRows)
        setAccounts(accountRows)
      })
      .catch(() => {
        if (!cancelled) {
          setBrothers([])
          setAccounts([])
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingOptions(false)
      })
    return () => {
      cancelled = true
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    if (saleToEdit) {
      form.reset({
        brotherId: saleToEdit.brotherId,
        description: saleToEdit.description,
        amount: saleToEdit.amount,
        saleDate: saleToEdit.saleDate,
        dueDate: saleToEdit.dueDate ?? '',
        paymentMode: saleToEdit.paymentMode,
        status:
          saleToEdit.status === 'Cancelado' ? 'Pendente' : saleToEdit.status,
        paymentDate: saleToEdit.paymentDate ?? todayLocalISODate(),
        accountId: saleToEdit.accountId ?? '',
        notes: saleToEdit.notes ?? '',
      })
      return
    }
    form.reset({
      brotherId: '',
      description: '',
      amount: 0,
      saleDate: todayLocalISODate(),
      dueDate: '',
      paymentMode: 'prazo',
      status: 'Pendente',
      paymentDate: todayLocalISODate(),
      accountId: '',
      notes: '',
    })
  }, [open, saleToEdit, form])

  useEffect(() => {
    if (paymentMode === 'avista') {
      form.setValue('status', 'Pago')
    }
  }, [paymentMode, form])

  function handleSubmit(values: SaleFormValues) {
    const brotherName =
      brothers.find((b) => b.id === values.brotherId)?.full_name ?? undefined
    onSave({
      id: saleToEdit?.id,
      brotherId: values.brotherId,
      brotherName: brotherName ?? undefined,
      description: values.description,
      amount: values.amount,
      saleDate: values.saleDate,
      dueDate: values.dueDate || undefined,
      paymentMode: values.paymentMode,
      status: values.status,
      paymentDate: values.paymentDate,
      accountId: values.accountId || undefined,
      notes: values.notes,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogTitle className="sr-only">
          {saleToEdit ? 'Editar venda' : 'Nova venda do templo'}
        </DialogTitle>
        <FormHeader
          icon={<ShoppingBag className="h-5 w-5" />}
          title={saleToEdit ? 'Editar venda' : 'Nova venda do templo'}
          description="Descrição e valor livres. À vista já registra no caixa."
        />

        {loadingOptions ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Carregando...
          </div>
        ) : (
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
                        placeholder="Selecione o irmão"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex.: Camisa da loja G" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor (R$)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" min="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="saleDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data da venda</FormLabel>
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
                name="paymentMode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Forma</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="avista">À vista</SelectItem>
                        <SelectItem value="prazo">A prazo</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {paymentMode === 'prazo' ? (
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vencimento (opcional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null}

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={paymentMode === 'avista'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Pendente">Pendente</SelectItem>
                        <SelectItem value="Pago">Pago</SelectItem>
                        <SelectItem value="Atrasado">Atrasado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      À vista fica paga automaticamente e gera receita no caixa.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {status === 'Pago' ? (
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
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
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
                </>
              ) : null}

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
                      Salvando...
                    </>
                  ) : (
                    'Salvar'
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
