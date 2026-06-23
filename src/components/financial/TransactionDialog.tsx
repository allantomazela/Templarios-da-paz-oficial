import { useEffect, useState } from 'react'
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
import { supabase } from '@/lib/supabase/client'
import { Loader2, DollarSign } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useFinancialAttachmentAccess } from '@/hooks/use-financial-attachment-access'
import {
  PendingFinancialAttachment,
  TransactionAttachmentsPanel,
  uploadPendingTransactionAttachments,
} from '@/components/financial/TransactionAttachmentsPanel'
import { fetchTransactionAttachments } from '@/lib/financial-attachments'

const transactionSchema = z.object({
  description: z.string().min(3, 'Descrição é obrigatória'),
  amount: z.coerce.number().min(0.01, 'Valor deve ser maior que zero'),
  date: z.string().min(1, 'Data é obrigatória'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  type: z.enum(['Receita', 'Despesa']),
  accountId: z.string().min(1, 'Conta é obrigatória'),
  attachmentNotes: z.string().optional(),
})

export type TransactionFormValues = z.infer<typeof transactionSchema>

interface TransactionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transactionToEdit: Transaction | null
  onSave: (data: TransactionFormValues) => Promise<string | null>
  defaultType: 'Receita' | 'Despesa'
}

interface CategoryFromDB {
  id: string
  name: string
  type: 'Receita' | 'Despesa'
}

interface AccountFromDB {
  id: string
  name: string
  type: string
  initial_balance?: number | string
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
  const [categories, setCategories] = useState<Category[]>([])
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [loadingAccounts, setLoadingAccounts] = useState(true)
  const [pendingFiles, setPendingFiles] = useState<PendingFinancialAttachment[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const supabaseAny = supabase as any

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
    },
  })

  useEffect(() => {
    if (open) {
      const loadData = async () => {
        setLoadingCategories(true)
        setLoadingAccounts(true)

        const { data: categoriesData, error: categoriesError } =
          await supabaseAny.from('financial_categories').select('*').order('name')

        if (!categoriesError && categoriesData) {
          setCategories(
            categoriesData.map((category: CategoryFromDB) => ({
              id: category.id,
              name: category.name,
              type: category.type,
            })),
          )
        }
        setLoadingCategories(false)

        const { data: accountsData, error: accountsError } = await supabaseAny
          .from('financial_accounts')
          .select('*')
          .order('name')

        if (!accountsError && accountsData) {
          setAccounts(
            accountsData.map((account: AccountFromDB) => ({
              id: account.id,
              name: account.name,
              type: account.type as 'Corrente' | 'Poupança' | 'Caixa' | 'Investimento',
              initialBalance:
                typeof account.initial_balance === 'number'
                  ? account.initial_balance
                  : parseFloat(String(account.initial_balance ?? 0)),
            })),
          )
        }
        setLoadingAccounts(false)
      }

      void loadData()
    } else {
      setPendingFiles([])
    }
  }, [open, supabaseAny])

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
      })
      setPendingFiles([])
    }
  }, [transactionToEdit, form, open, defaultType, accounts])

  const currentType = form.watch('type') || defaultType
  const availableCategories = categories.filter((category) => category.type === currentType)

  const handleSubmit = async (values: TransactionFormValues) => {
    setIsSaving(true)
    try {
      const hadPendingAttachments = pendingFiles.length > 0
      const transactionId = await onSave(values)
      if (!transactionId) return

      if (canManageAttachments && hadPendingAttachments) {
        await uploadPendingTransactionAttachments(transactionId, pendingFiles)
        setPendingFiles([])
      }

      if (canManageAttachments && defaultType === 'Despesa') {
        const existingAttachments = await fetchTransactionAttachments(transactionId)
        const hasAttachments =
          existingAttachments.length > 0 || hadPendingAttachments

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
              name="accountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conta Bancária / Caixa</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={loadingAccounts}
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

            {canManageAttachments ? (
              <>
                <FormField
                  control={form.control}
                  name="attachmentNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações sobre comprovantes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Ex.: comprovante será anexado após recebimento da NF..."
                          rows={2}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <TransactionAttachmentsPanel
                  transactionId={transactionToEdit?.id ?? null}
                  pendingFiles={pendingFiles}
                  onPendingFilesChange={setPendingFiles}
                />
              </>
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
