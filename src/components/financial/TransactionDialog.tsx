import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Transaction, Category, BankAccount } from '@/lib/data'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FormHeader } from '@/components/ui/form-header'
import { todayLocalISODate, toDateInputValue } from '@/lib/format-utils'
import { Loader2, DollarSign } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import useFinancialStore from '@/stores/useFinancialStore'
import { useFinancialAttachmentAccess } from '@/hooks/use-financial-attachment-access'
import {
  PendingFinancialAttachment,
  TransactionAttachmentsPanel,
  uploadPendingTransactionAttachments,
} from '@/components/financial/TransactionAttachmentsPanel'

import { fetchForecastItems } from '@/lib/forecast-items-api'
import type { ForecastItem } from '@/lib/forecast-types'
import { isControlOnlyTransaction } from '@/lib/transaction-control-only'

const transactionSchema = z
  .object({
    description: z.string().min(3, 'Descrição é obrigatória'),
    amount: z.coerce.number().min(0.01, 'Valor deve ser maior que zero'),
    date: z.string().min(1, 'Data é obrigatória'),
    category: z.string().min(1, 'Categoria é obrigatória'),
    type: z.enum(['Receita', 'Despesa']),
    accountId: z.string().optional(),
    attachmentNotes: z.string().optional(),
    forecastItemId: z.string().optional(),
    controlOnly: z.boolean().optional(),
  })
  .superRefine((values, ctx) => {
    const controlOnly = Boolean(values.controlOnly)
    if (!controlOnly && !values.accountId?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Conta é obrigatória',
        path: ['accountId'],
      })
    }
  })

export type TransactionFormValues = z.infer<typeof transactionSchema>

interface TransactionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transactionToEdit: Transaction | null
  onSave: (data: TransactionFormValues) => Promise<string | null>
  defaultType: 'Receita' | 'Despesa'
}

export function TransactionDialog({
  open,
  onOpenChange,
  transactionToEdit,
  onSave,
  defaultType,
}: TransactionDialogProps) {
  const { toast } = useToast()
  const canManageAttachments = useFinancialAttachmentAccess()
  const storeCategories = useFinancialStore((state) => state.categories)
  const storeAccounts = useFinancialStore((state) => state.accounts)
  const [categories, setCategories] = useState<Category[]>([])
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [loadingAccounts, setLoadingAccounts] = useState(true)
  const [pendingFiles, setPendingFiles] = useState<PendingFinancialAttachment[]>([])
  const [storedAttachmentCount, setStoredAttachmentCount] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [forecastItems, setForecastItems] = useState<ForecastItem[]>([])
  const [loadingForecastItems, setLoadingForecastItems] = useState(false)
  const categoriesRequestSeq = useRef(0)
  const accountsRequestSeq = useRef(0)

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      description: '',
      amount: 0,
      date: todayLocalISODate(),
      category: '',
      type: defaultType,
      accountId: '',
      attachmentNotes: '',
      forecastItemId: '',
      controlOnly: false,
    },
  })

  useEffect(() => {
    if (!open) {
      setPendingFiles([])
      setStoredAttachmentCount(0)
      return
    }

    if (storeCategories.length > 0) {
      setCategories(storeCategories)
      setLoadingCategories(false)
    } else {
      const requestId = ++categoriesRequestSeq.current
      setLoadingCategories(true)
      void useFinancialStore
        .getState()
        .fetchCategories()
        .then(() => {
          if (requestId !== categoriesRequestSeq.current) return
          const latest = useFinancialStore.getState().categories
          setCategories(latest)
        })
        .finally(() => {
          if (requestId === categoriesRequestSeq.current) {
            setLoadingCategories(false)
          }
        })
    }

    if (storeAccounts.length > 0) {
      setAccounts(storeAccounts)
      setLoadingAccounts(false)
    } else {
      const requestId = ++accountsRequestSeq.current
      setLoadingAccounts(true)
      void useFinancialStore
        .getState()
        .fetchAccounts()
        .then(() => {
          if (requestId !== accountsRequestSeq.current) return
          const latest = useFinancialStore.getState().accounts
          setAccounts(latest)
        })
        .finally(() => {
          if (requestId === accountsRequestSeq.current) {
            setLoadingAccounts(false)
          }
        })
    }

    setLoadingForecastItems(true)
    void fetchForecastItems()
      .then((items) => setForecastItems(items.filter((item) => item.isActive)))
      .catch(() => setForecastItems([]))
      .finally(() => setLoadingForecastItems(false))
  }, [open, storeCategories, storeAccounts])

  useEffect(() => {
    if (transactionToEdit) {
      form.reset({
        description: transactionToEdit.description,
        amount: transactionToEdit.amount,
        date: toDateInputValue(transactionToEdit.date),
        category: transactionToEdit.category,
        type: transactionToEdit.type,
        accountId: transactionToEdit.accountId || '',
        attachmentNotes: transactionToEdit.attachmentNotes || '',
        forecastItemId: transactionToEdit.forecastItemId || '',
        controlOnly: isControlOnlyTransaction(transactionToEdit),
      })
    } else if (open) {
      form.reset({
        description: '',
        amount: 0,
        date: todayLocalISODate(),
        category: '',
        type: defaultType,
        accountId: accounts.length > 0 ? accounts[0].id : '',
        attachmentNotes: '',
        forecastItemId: '',
        controlOnly: false,
      })
      setPendingFiles([])
    }
  }, [transactionToEdit, form, open, defaultType, accounts])

  const currentType = form.watch('type') || defaultType
  const controlOnly = Boolean(form.watch('controlOnly'))
  const isControlOnlyMode = controlOnly
  const availableCategories = categories.filter((category) => category.type === currentType)
  const availableForecastItems = forecastItems.filter((item) => item.type === currentType)

  const handleSubmit = async (values: TransactionFormValues) => {
    setIsSaving(true)
    try {
      const hadPendingAttachments = pendingFiles.length > 0
      const pendingCount = pendingFiles.length
      const transactionId = await onSave(values)
      if (!transactionId) return

      if (canManageAttachments && hadPendingAttachments) {
        await uploadPendingTransactionAttachments(transactionId, pendingFiles)
        setPendingFiles([])
      }

      if (canManageAttachments && defaultType === 'Despesa' && !values.controlOnly) {
        const hasAttachments =
          storedAttachmentCount + pendingCount > 0

        if (!hasAttachments) {
          toast({
            title: 'Despesa sem comprovante',
            description:
              values.attachmentNotes?.trim()
                ? 'Registro salvo com observação. Recomenda-se anexar o comprovante quando disponível.'
                : 'Nenhum comprovante foi anexado. Use o campo de observações para justificar, se necessário.',
          })
        }
      }

      onOpenChange(false)
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const dialogTitle = `${transactionToEdit ? 'Editar' : 'Nova'} ${defaultType === 'Receita' ? 'Receita' : 'Despesa'}`
  const dialogDescription = transactionToEdit
    ? 'Atualize as informações da transação e os comprovantes.'
    : `Registre uma nova ${defaultType === 'Receita' ? 'receita' : 'despesa'}.`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] max-w-lg overflow-y-auto"
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">{dialogTitle}</DialogTitle>
        <FormHeader
          title={dialogTitle}
          description={dialogDescription}
          icon={<DollarSign className="h-5 w-5" />}
        />
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Mensalidades Maio" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data</FormLabel>
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
              name="controlOnly"
              render={({ field }) => (
                <FormItem className="flex items-start gap-3 rounded-md border p-3">
                  <FormControl>
                    <Checkbox
                      checked={Boolean(field.value)}
                      onCheckedChange={(checked) => {
                        const next = checked === true
                        field.onChange(next)
                        if (next) {
                          form.setValue('accountId', '')
                        } else if (!form.getValues('accountId') && accounts.length > 0) {
                          form.setValue('accountId', accounts[0].id)
                        }
                      }}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="cursor-pointer font-medium">
                      Somente controle (não afeta o caixa)
                    </FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Registra o lançamento para acompanhamento, sem movimentar conta
                      bancária nem alterar a tesouraria.
                    </p>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conta Bancária / Caixa</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={loadingAccounts || isControlOnlyMode}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            loadingAccounts
                              ? 'Carregando...'
                              : 'Selecione a conta...'
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {loadingAccounts ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      ) : accounts.length === 0 ? (
                        <div className="p-4 text-sm text-muted-foreground">
                          Nenhuma conta cadastrada
                        </div>
                      ) : (
                        accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {isControlOnlyMode ? (
                    <p className="text-xs text-muted-foreground">
                      Lançamentos somente controle não usam conta bancária.
                    </p>
                  ) : null}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={loadingCategories}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            loadingCategories ? 'Carregando...' : 'Selecione...'
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {loadingCategories ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      ) : availableCategories.length === 0 ? (
                        <div className="p-4 text-sm text-muted-foreground">
                          Nenhuma categoria cadastrada para {currentType}
                        </div>
                      ) : (
                        availableCategories.map((category) => (
                          <SelectItem key={category.id} value={category.name}>
                            {category.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="forecastItemId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vínculo com planejamento (opcional)</FormLabel>
                  <Select
                    onValueChange={(value) =>
                      field.onChange(value === '__none__' ? '' : value)
                    }
                    value={field.value || '__none__'}
                    disabled={loadingForecastItems}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            loadingForecastItems
                              ? 'Carregando...'
                              : 'Sem vínculo'
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="__none__">Sem vínculo</SelectItem>
                      {availableForecastItems.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.description}
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
              name="attachmentNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações (comprovante / lançamento)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ex.: PIX confirmado, NF pendente, detalhes do pagamento..."
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {canManageAttachments ? (
              <TransactionAttachmentsPanel
                transactionId={transactionToEdit?.id ?? null}
                pendingFiles={pendingFiles}
                onPendingFilesChange={setPendingFiles}
                onStoredAttachmentCountChange={setStoredAttachmentCount}
              />
            ) : null}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
