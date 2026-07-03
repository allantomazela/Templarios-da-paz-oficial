import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Loader2, MoreHorizontal, Pencil, Plus, Trash2, Wallet } from 'lucide-react'
import { useAsyncOperation } from '@/hooks/use-async-operation'
import { usePayablesList } from '@/hooks/use-payables-list'
import useFinancialStore from '@/stores/useFinancialStore'
import { notifyFinancialDataChanged } from '@/stores/useFinancialStore'
import { formatCurrencyBRL, formatDateBR } from '@/lib/format-utils'
import {
  PAYABLE_STATUS_LABELS,
  type FinancialPayable,
  type PayableStatus,
} from '@/lib/financial-payable-types'
import {
  deleteFinancialPayable,
  saveFinancialPayable,
  updatePayablePayment,
} from '@/lib/financial-payables-api'
import { isPayableOpen } from '@/lib/financial-payables-status'
import { PayableDialog, type PayableFormValues } from '@/components/financial/PayableDialog'
import {
  PayablePaymentDialog,
  type PayablePaymentFormValues,
} from '@/components/financial/PayablePaymentDialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

function canModifyPayable(payable: FinancialPayable): boolean {
  return payable.status !== 'Pago'
}

type StatusFilter = 'open' | PayableStatus | 'all'

const STATUS_VARIANT: Record<
  PayableStatus,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  Pendente: 'secondary',
  Pago: 'default',
  Atrasado: 'destructive',
  Cancelado: 'outline',
}

interface PayablesPanelProps {
  /** Pré-preenche o formulário ao abrir (ex.: a partir do planejamento). */
  createDefaults?: Partial<PayableFormValues & { forecastItemId?: string }>
  onCreateDefaultsConsumed?: () => void
}

export function PayablesPanel({
  createDefaults,
  onCreateDefaultsConsumed,
}: PayablesPanelProps) {
  const categories = useFinancialStore((state) => state.categories)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('open')
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [selectedPayable, setSelectedPayable] = useState<FinancialPayable | null>(null)
  const [payableToDelete, setPayableToDelete] = useState<FinancialPayable | null>(null)
  const [pendingForecastItemId, setPendingForecastItemId] = useState<string | null>(null)

  const { payables, loading: listLoading, reload } = usePayablesList(statusFilter)
  const reloadRef = useRef(reload)
  reloadRef.current = reload

  useEffect(() => {
    if (!createDefaults) return
    setPendingForecastItemId(createDefaults.forecastItemId ?? null)
    setSelectedPayable(null)
    setDialogOpen(true)
    onCreateDefaultsConsumed?.()
  }, [createDefaults, onCreateDefaultsConsumed])

  const filteredPayables = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return payables
    return payables.filter(
      (payable) =>
        payable.description.toLowerCase().includes(term) ||
        payable.supplierName?.toLowerCase().includes(term) ||
        payable.categoryName?.toLowerCase().includes(term) ||
        payable.documentReference?.toLowerCase().includes(term),
    )
  }, [payables, search])

  const openTotal = useMemo(
    () =>
      payables
        .filter((payable) => isPayableOpen(payable.status))
        .reduce((sum, payable) => sum + payable.amount, 0),
    [payables],
  )

  const saveOperation = useAsyncOperation(
    async (values: PayableFormValues) => {
      await saveFinancialPayable(
        {
          ...values,
          forecastItemId:
            pendingForecastItemId ?? selectedPayable?.forecastItemId ?? undefined,
        },
        selectedPayable?.id,
      )
      setPendingForecastItemId(null)
      await reloadRef.current()
    },
    {
      successMessage: 'Conta a pagar salva.',
      errorMessage: 'Falha ao salvar conta a pagar.',
    },
  )

  const paymentOperation = useAsyncOperation(
    async (values: PayablePaymentFormValues) => {
      if (!selectedPayable) return
      await updatePayablePayment(selectedPayable.id, values)
      notifyFinancialDataChanged()
      await reloadRef.current()
    },
    {
      successMessage: 'Pagamento atualizado.',
      errorMessage: 'Falha ao registrar pagamento.',
    },
  )

  const deleteOperation = useAsyncOperation(
    async (id: string) => {
      await deleteFinancialPayable(id)
      notifyFinancialDataChanged()
      await reloadRef.current()
    },
    {
      successMessage: 'Conta a pagar excluída.',
      errorMessage: 'Falha ao excluir.',
    },
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-medium">Contas a pagar</h3>
          <p className="text-sm text-muted-foreground">
            Cadastre boletos e compromissos com vencimento. O caixa só é afetado ao confirmar o
            pagamento.
          </p>
        </div>
        <Button
          className="gap-2"
          onClick={() => {
            setSelectedPayable(null)
            setPendingForecastItemId(null)
            setDialogOpen(true)
          }}
        >
          <Plus className="h-4 w-4" />
          Nova conta a pagar
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Em aberto</CardDescription>
            <CardTitle className="text-2xl text-destructive">
              {formatCurrencyBRL(openTotal)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pendentes / atrasadas</CardDescription>
            <CardTitle className="text-2xl">
              {payables.filter((p) => isPayableOpen(p.status)).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pagas no filtro atual</CardDescription>
            <CardTitle className="text-2xl">
              {payables.filter((p) => p.status === 'Pago').length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Compromissos</CardTitle>
          <CardDescription>
            Filtre por situação e busque por descrição ou fornecedor. Use Editar ou Excluir na
            coluna Ações para ajustar lançamentos em aberto.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row">
            <Input
              placeholder="Buscar..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="md:max-w-sm"
            />
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as StatusFilter)}
            >
              <SelectTrigger className="md:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Em aberto</SelectItem>
                <SelectItem value="Pendente">Pendente</SelectItem>
                <SelectItem value="Atrasado">Em atraso</SelectItem>
                <SelectItem value="Pago">Pago</SelectItem>
                <SelectItem value="Cancelado">Cancelado</SelectItem>
                <SelectItem value="all">Todos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {listLoading && payables.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Carregando...
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="min-w-[11rem] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayables.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                        Nenhuma conta a pagar encontrada.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPayables.map((payable) => (
                      <TableRow
                        key={payable.id}
                        className={cn(
                          payable.status === 'Atrasado' && 'bg-destructive/5',
                        )}
                      >
                        <TableCell>{formatDateBR(payable.dueDate)}</TableCell>
                        <TableCell>
                          <div className="font-medium">{payable.description}</div>
                          {payable.supplierName ? (
                            <div className="text-xs text-muted-foreground">
                              {payable.supplierName}
                            </div>
                          ) : null}
                          {payable.documentReference ? (
                            <div className="text-xs text-muted-foreground">
                              Ref: {payable.documentReference}
                            </div>
                          ) : null}
                        </TableCell>
                        <TableCell>{payable.categoryName ?? '—'}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrencyBRL(payable.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={STATUS_VARIANT[payable.status]}>
                            {PAYABLE_STATUS_LABELS[payable.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <PayableRowActions
                            payable={payable}
                            onPay={() => {
                              setSelectedPayable(payable)
                              setPaymentDialogOpen(true)
                            }}
                            onEdit={() => {
                              setSelectedPayable(payable)
                              setPendingForecastItemId(payable.forecastItemId ?? null)
                              setDialogOpen(true)
                            }}
                            onDelete={() => setPayableToDelete(payable)}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <PayableDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        payableToEdit={selectedPayable}
        categories={categories}
        defaultValues={createDefaults}
        saving={saveOperation.loading}
        onSave={async (values) => {
          const result = await saveOperation.execute(values)
          return result !== null
        }}
      />

      <PayablePaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        payable={selectedPayable}
        saving={paymentOperation.loading}
        onSave={async (values) => {
          const result = await paymentOperation.execute(values)
          return result !== null
        }}
      />

      <AlertDialog
        open={payableToDelete !== null}
        onOpenChange={(open) => !open && setPayableToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conta a pagar?</AlertDialogTitle>
            <AlertDialogDescription>
              {payableToDelete?.description} — {formatCurrencyBRL(payableToDelete?.amount ?? 0)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!payableToDelete) return
                void deleteOperation.execute(payableToDelete.id).then(() => {
                  setPayableToDelete(null)
                })
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

interface PayableRowActionsProps {
  payable: FinancialPayable
  onPay: () => void
  onEdit: () => void
  onDelete: () => void
}

function PayableRowActions({ payable, onPay, onEdit, onDelete }: PayableRowActionsProps) {
  const showPay = isPayableOpen(payable.status)
  const showModify = canModifyPayable(payable)

  return (
    <div className="flex items-center justify-end gap-1">
      <div className="hidden flex-wrap justify-end gap-1 md:flex">
        {showPay ? (
          <Button size="sm" variant="default" className="h-8 gap-1" onClick={onPay}>
            <Wallet className="h-3.5 w-3.5" />
            Pagar
          </Button>
        ) : null}
        {showModify ? (
          <>
            <Button size="sm" variant="outline" className="h-8 gap-1" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5" />
              Editar
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1 text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Excluir
            </Button>
          </>
        ) : (
          <Button size="sm" variant="outline" className="h-8 gap-1" onClick={onPay}>
            Estornar
          </Button>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1 md:hidden"
            aria-label="Ações da conta a pagar"
          >
            <MoreHorizontal className="h-4 w-4" />
            Ações
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          {showPay ? (
            <DropdownMenuItem onClick={onPay}>
              <Wallet className="mr-2 h-4 w-4" />
              Pagar
            </DropdownMenuItem>
          ) : null}
          {showModify ? (
            <>
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </>
          ) : (
            <DropdownMenuItem onClick={onPay}>
              <Wallet className="mr-2 h-4 w-4" />
              Estornar pagamento
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
