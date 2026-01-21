import { useState, useMemo, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format, parseISO, startOfToday, isAfter, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { useDialog } from '@/hooks/use-dialog'
import { useAsyncOperation } from '@/hooks/use-async-operation'
import useChancellorStore from '@/stores/useChancellorStore'
import useFinancialStore from '@/stores/useFinancialStore'
import {
  Plus,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  TrendingUp,
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

const charitySchema = z.object({
  eventId: z.string().min(1, 'Selecione um evento'),
  amount: z.coerce.number().min(0.01, 'Valor deve ser maior que zero'),
  accountId: z.string().min(1, 'Selecione uma conta'),
  date: z.string().min(1, 'Data é obrigatória'),
  description: z.string().optional(),
})

type CharityFormValues = z.infer<typeof charitySchema>

export function CharityCollection() {
  const { toast } = useToast()
  const { events, sessionRecords } = useChancellorStore()
  const {
    transactions,
    accounts,
    fetchTransactions,
    fetchAccounts,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  } = useFinancialStore()
  const dialog = useDialog()
  const [charityToEdit, setCharityToEdit] = useState<string | null>(null)

  // Carregar dados ao montar o componente
  useEffect(() => {
    fetchTransactions()
    fetchAccounts()
  }, [fetchTransactions, fetchAccounts])

  const form = useForm<CharityFormValues>({
    resolver: zodResolver(charitySchema),
    defaultValues: {
      eventId: '',
      amount: 0,
      accountId: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      description: '',
    },
  })

  // Filtrar eventos futuros ou do dia atual para seleção
  const availableEvents = useMemo(() => {
    const today = startOfToday()
    return events
      .filter((event) => {
        try {
          const eventDate = parseISO(event.date)
          return isAfter(eventDate, today) || isSameDay(eventDate, today)
        } catch {
          return false
        }
      })
      .sort((a, b) => {
        try {
          const dateA = parseISO(a.date)
          const dateB = parseISO(b.date)
          return dateA.getTime() - dateB.getTime()
        } catch {
          return 0
        }
      })
  }, [events])

  // Buscar transações de tronco de beneficência
  const charityTransactions = useMemo(() => {
    return transactions.filter(
      (t) => t.category === 'Tronco de Beneficência' && t.type === 'Receita',
    )
  }, [transactions])

  // Combinar com informações de eventos
  const charityWithEvents = useMemo(() => {
    return charityTransactions.map((transaction) => {
      // Tentar extrair eventId da descrição ou buscar por data
      const event = events.find((e) => {
        const eventDate = parseISO(e.date)
        const transDate = parseISO(transaction.date)
        return isSameDay(eventDate, transDate)
      })

      return {
        ...transaction,
        event,
      }
    })
  }, [charityTransactions, events])

  const saveOperation = useAsyncOperation({
    operation: async (data: CharityFormValues) => {
      const event = events.find((e) => e.id === data.eventId)
      if (!event) throw new Error('Evento não encontrado')

      const transactionData = {
        id: charityToEdit || crypto.randomUUID(),
        date: data.date,
        description:
          data.description ||
          `Tronco de Beneficência - ${event.title} - ${format(parseISO(data.date), 'dd/MM/yyyy', { locale: ptBR })}`,
        category: 'Tronco de Beneficência',
        type: 'Receita' as const,
        amount: data.amount,
        accountId: data.accountId,
      }

      if (charityToEdit) {
        await updateTransaction(transactionData)
      } else {
        await addTransaction(transactionData)
      }

      // Atualizar SessionRecord se existir
      const sessionRecord = sessionRecords.find((sr) => sr.eventId === data.eventId)
      if (sessionRecord) {
        useChancellorStore.getState().updateSessionRecord({
          ...sessionRecord,
          charityCollection: data.amount,
        })
      }
    },
    onSuccess: () => {
      toast({
        title: charityToEdit ? 'Tronco Atualizado' : 'Tronco Registrado',
        description: charityToEdit
          ? 'O registro do tronco foi atualizado com sucesso.'
          : 'O tronco de beneficência foi registrado com sucesso.',
      })
      dialog.closeDialog()
      form.reset()
      setCharityToEdit(null)
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error?.message || 'Não foi possível salvar o registro.',
      })
    },
  })

  const deleteOperation = useAsyncOperation({
    operation: async (transactionId: string) => {
      deleteTransaction(transactionId)
    },
    onSuccess: () => {
      toast({
        title: 'Registro Removido',
        description: 'O registro do tronco foi removido com sucesso.',
      })
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error?.message || 'Não foi possível remover o registro.',
      })
    },
  })

  const handleOpenDialog = (transactionId?: string) => {
    if (transactionId) {
      const transaction = charityTransactions.find((t) => t.id === transactionId)
      if (transaction) {
        setCharityToEdit(transactionId)
        // Tentar encontrar o evento pela data
        const event = events.find((e) => {
          try {
            return isSameDay(parseISO(e.date), parseISO(transaction.date))
          } catch {
            return false
          }
        })
        form.reset({
          eventId: event?.id || '',
          amount: transaction.amount,
          accountId: transaction.accountId || '',
          date: transaction.date,
          description: transaction.description,
        })
      }
    } else {
      setCharityToEdit(null)
      form.reset({
        eventId: '',
        amount: 0,
        accountId: accounts.length > 0 ? accounts[0].id : '',
        date: format(new Date(), 'yyyy-MM-dd'),
        description: '',
      })
    }
    dialog.openDialog()
  }

  const handleDelete = (transactionId: string) => {
    if (
      window.confirm(
        'Tem certeza que deseja remover este registro de tronco de beneficência?',
      )
    ) {
      deleteOperation.execute(transactionId)
    }
  }

  const handleSubmit = (data: CharityFormValues) => {
    saveOperation.execute(data)
  }

  const totalCharity = useMemo(() => {
    return charityTransactions.reduce((sum, t) => sum + t.amount, 0)
  }, [charityTransactions])

  // Filtrar apenas contas do tipo Caixa para tronco
  const cashAccounts = accounts.filter((a) => a.type === 'Caixa')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Tronco de Beneficência</h3>
          <p className="text-sm text-muted-foreground">
            Registre os valores coletados do tronco de beneficência em cada sessão
            ou evento.
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Registrar Tronco
        </Button>
      </div>

      <Alert>
        <DollarSign className="h-4 w-4" />
        <AlertDescription>
          <strong>Importante:</strong> O tronco de beneficência deve ser registrado
          após cada sessão ou evento. Os valores são automaticamente contabilizados
          como receita no sistema financeiro.
        </AlertDescription>
      </Alert>

      {/* Resumo */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Coletado</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {totalCharity.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {charityTransactions.length} registro
              {charityTransactions.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média por Registro</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {charityTransactions.length > 0
                ? (totalCharity / charityTransactions.length).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })
                : 'R$ 0,00'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Valor médio coletado
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Este Mês</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {charityTransactions
                .filter((t) => {
                  try {
                    const transDate = parseISO(t.date)
                    const now = new Date()
                    return (
                      transDate.getMonth() === now.getMonth() &&
                      transDate.getFullYear() === now.getFullYear()
                    )
                  } catch {
                    return false
                  }
                })
                .reduce((sum, t) => sum + t.amount, 0)
                .toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Coletado no mês atual
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Registros */}
      <Card>
        <CardHeader>
          <CardTitle>Registros de Tronco</CardTitle>
          <CardDescription>
            Histórico de todos os registros de tronco de beneficência.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {charityTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <DollarSign className="h-12 w-12 text-muted-foreground opacity-50 mb-4" />
              <p className="text-sm text-muted-foreground">
                Nenhum registro de tronco encontrado
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Clique em "Registrar Tronco" para adicionar o primeiro registro
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Conta</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {charityWithEvents
                  .sort((a, b) => {
                    try {
                      const dateA = parseISO(a.date)
                      const dateB = parseISO(b.date)
                      return dateB.getTime() - dateA.getTime()
                    } catch {
                      return 0
                    }
                  })
                  .map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {format(parseISO(transaction.date), 'dd/MM/yyyy', {
                            locale: ptBR,
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        {transaction.event ? (
                          <div>
                            <div className="font-medium">{transaction.event.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {transaction.event.type}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">
                            {transaction.description}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-green-600">
                          {transaction.amount.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </span>
                      </TableCell>
                      <TableCell>
                        {accounts.find((a) => a.id === transaction.accountId)?.name || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(transaction.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(transaction.id)}
                            disabled={deleteOperation.loading}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Registro */}
      <Dialog open={dialog.open} onOpenChange={dialog.onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {charityToEdit ? 'Editar Registro de Tronco' : 'Registrar Tronco'}
            </DialogTitle>
            <DialogDescription>
              {charityToEdit
                ? 'Atualize as informações do registro de tronco.'
                : 'Preencha os dados para registrar o tronco de beneficência de uma sessão ou evento.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="eventId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Evento/Sessão</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value)
                        // Atualizar data automaticamente quando evento for selecionado
                        const selectedEvent = events.find((e) => e.id === value)
                        if (selectedEvent) {
                          form.setValue('date', selectedEvent.date)
                        }
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o evento" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableEvents.length === 0 ? (
                          <SelectItem value="" disabled>
                            Nenhum evento disponível
                          </SelectItem>
                        ) : (
                          availableEvents.map((event) => (
                            <SelectItem key={event.id} value={event.id}>
                              <div>
                                <div className="font-medium">{event.title}</div>
                                <div className="text-xs text-muted-foreground">
                                  {format(parseISO(event.date), 'dd/MM/yyyy', {
                                    locale: ptBR,
                                  })}{' '}
                                  • {event.type}
                                </div>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Selecione o evento ou sessão relacionado ao tronco.
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
                    <FormLabel>Valor (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Valor total coletado no tronco de beneficência.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="accountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conta</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a conta" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {cashAccounts.length === 0 ? (
                          <SelectItem value="" disabled>
                            Nenhuma conta do tipo Caixa disponível
                          </SelectItem>
                        ) : (
                          cashAccounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.name} ({account.type})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Conta onde o valor será registrado (recomendado: Caixa).
                    </FormDescription>
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
                    <FormDescription>
                      Data em que o tronco foi coletado.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição (Opcional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Observações adicionais..."
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>
                      Informações adicionais sobre o registro.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={dialog.closeDialog}
                  disabled={saveOperation.loading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={saveOperation.loading}>
                  {saveOperation.loading
                    ? 'Salvando...'
                    : charityToEdit
                      ? 'Atualizar'
                      : 'Registrar'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

