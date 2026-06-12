import { useState, useEffect, useMemo } from 'react'
import type { AgapeBrotherCharge, AgapeMonthlyClosing } from '@/lib/data'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'
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
import {
  Loader2,
  RefreshCw,
  Pencil,
  Trash2,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Wine,
  Plus,
  Save,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useDialog } from '@/hooks/use-dialog'
import { useAsyncOperation } from '@/hooks/use-async-operation'
import { useToast } from '@/hooks/use-toast'
import { formatCurrencyBRL } from '@/lib/format-utils'
import useFinancialStore, {
  notifyFinancialDataChanged,
} from '@/stores/useFinancialStore'
import useAgapeStore from '@/stores/useAgapeStore'
import useSiteSettingsStore from '@/stores/useSiteSettingsStore'
import { AgapeChargeDialog } from './AgapeChargeDialog'
import { AgapeClosingAdjustmentsPanel } from './AgapeClosingAdjustmentsPanel'
import {
  clearAgapeMonthClosing,
  closeAgapeMonth,
  deleteAgapeCharge,
  fetchAgapeChargesForMonth,
  fetchAgapeMonthlyClosing,
  fetchLiveConsumptionTotals,
  generateAgapeChargesForMonth,
  reopenAgapeMonth,
  saveAgapeCharge,
  saveAgapeMonthlyTotal,
  type AgapeChargeFormData,
  type AgapeConsumptionTotalRow,
} from '@/lib/agape-payments'
import { useAgapeClosingPermissions } from '@/hooks/use-agape-closing-permissions'
import { getSaveErrorMessage, isAuthError } from '@/lib/auth-utils'
import useAuthStore from '@/stores/useAuthStore'

function statusBadge(status: AgapeBrotherCharge['status']) {
  if (status === 'Pago') {
    return <Badge className="bg-green-600 hover:bg-green-700">{status}</Badge>
  }
  if (status === 'Atrasado') {
    return <Badge variant="destructive">{status}</Badge>
  }
  return <Badge variant="secondary">{status}</Badge>
}

export function AgapeClosing() {
  const { toast } = useToast()
  const signOut = useAuthStore((s) => s.signOut)
  const { canManageAgapeClosing, canAccessAgapeClosingOnly } =
    useAgapeClosingPermissions()
  const { agapePix } = useSiteSettingsStore()
  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [charges, setCharges] = useState<AgapeBrotherCharge[]>([])
  const [brotherNames, setBrotherNames] = useState<Record<string, string>>({})
  const [closing, setClosing] = useState<AgapeMonthlyClosing | null>(null)
  const [liveTotal, setLiveTotal] = useState<number | null>(null)
  const [liveConsumptionRows, setLiveConsumptionRows] = useState<
    AgapeConsumptionTotalRow[]
  >([])
  const [loading, setLoading] = useState(true)
  const dialog = useDialog()
  const [selectedCharge, setSelectedCharge] = useState<AgapeBrotherCharge | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AgapeBrotherCharge | null>(null)
  const [clearMonthOpen, setClearMonthOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isClearingMonth, setIsClearingMonth] = useState(false)
  const [totalBeveragesInput, setTotalBeveragesInput] = useState('')

  const handleOperationError = (error: unknown, fallback: string) => {
    if (isAuthError(error)) {
      void signOut()
      return
    }
    toast({
      variant: 'destructive',
      title: 'Operação não concluída',
      description: getSaveErrorMessage(error) || fallback,
    })
  }

  const monthLabel = useMemo(
    () =>
      format(new Date(selectedYear, selectedMonth - 1, 1), 'MMMM yyyy', {
        locale: ptBR,
      }),
    [selectedMonth, selectedYear],
  )

  const loadData = useAsyncOperation(
    async () => {
      setLoading(true)
      setClosing(null)
      setCharges([])
      setBrotherNames({})
      setLiveConsumptionRows([])
      setLiveTotal(0)
      setTotalBeveragesInput('')
      try {
        const [closingData, chargesData, consumptionTotals] = await Promise.all([
          fetchAgapeMonthlyClosing(selectedMonth, selectedYear),
          fetchAgapeChargesForMonth(selectedMonth, selectedYear),
          fetchLiveConsumptionTotals(selectedMonth, selectedYear),
        ])

        setClosing(closingData)
        setCharges(chargesData.charges)
        setBrotherNames(chargesData.brotherNames)
        setLiveConsumptionRows(consumptionTotals)
        setTotalBeveragesInput(
          closingData?.totalBeveragesSpent != null
            ? String(closingData.totalBeveragesSpent)
            : '',
        )
        setLiveTotal(
          consumptionTotals.reduce(
            (sum, r) => sum + Number(r.total_amount),
            0,
          ),
        )
      } finally {
        setLoading(false)
      }
    },
    {
      showSuccessToast: false,
      errorMessage: 'Falha ao carregar fechamento do ágape.',
    },
  )

  useEffect(() => {
    useAgapeStore.getState().clearOperationalCache()
    notifyFinancialDataChanged()
    void useFinancialStore.getState().fetchTransactions()
    loadData.execute()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedYear])

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        loadData.execute()
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedYear])

  const saveOperation = useAsyncOperation(
    async (data: AgapeChargeFormData) => {
      await saveAgapeCharge(data, {
        chargeId: selectedCharge?.id,
        existingTransactionId: selectedCharge?.transactionId,
      })
      notifyFinancialDataChanged()
      toast({
        title: selectedCharge ? 'Lançamento atualizado' : 'Pagamento registrado',
        description: selectedCharge
          ? 'A cobrança e a tesouraria foram atualizadas.'
          : 'A receita foi lançada na tesouraria.',
      })
      dialog.closeDialog()
      setSelectedCharge(null)
      await loadData.execute()
    },
    {
      showSuccessToast: false,
      showErrorToast: false,
      errorMessage: 'Não foi possível salvar o lançamento.',
      onError: (error) =>
        handleOperationError(error, 'Não foi possível salvar o lançamento.'),
    },
  )

  const generateOperation = useAsyncOperation(
    async () => {
      const result = await generateAgapeChargesForMonth(selectedMonth, selectedYear)
      toast({
        title: 'Consumos importados',
        description: `${result.created} nova(s), ${result.updated} atualizada(s). Total dos irmãos: ${formatCurrencyBRL(result.totalConsumed)} (${result.brothersWithConsumption} irmão(s)).`,
      })
      await loadData.execute()
    },
    { showSuccessToast: false },
  )

  const closeOperation = useAsyncOperation(
    async () => {
      await closeAgapeMonth(selectedMonth, selectedYear)
      toast({
        title: 'Fechamento encerrado',
        description: `O mês ${monthLabel} foi fechado com sucesso.`,
      })
      await loadData.execute()
    },
    { showSuccessToast: false },
  )

  const reopenOperation = useAsyncOperation(
    async () => {
      await reopenAgapeMonth(selectedMonth, selectedYear)
      toast({
        title: 'Fechamento reaberto',
        description: 'O mês pode ser editado novamente.',
      })
      await loadData.execute()
    },
    { showSuccessToast: false },
  )

  const saveTotalOperation = useAsyncOperation(
    async () => {
      const value = Number(totalBeveragesInput.replace(',', '.'))
      if (!value || value <= 0) {
        throw new Error('Informe o valor total gasto em bebidas.')
      }
      await saveAgapeMonthlyTotal(selectedMonth, selectedYear, value)
      toast({
        title: 'Total das bebidas salvo',
        description: `Valor de referência do mês: ${formatCurrencyBRL(value)}.`,
      })
      await loadData.execute()
    },
    { showSuccessToast: false },
  )

  const handleClearMonthConfirm = async () => {
    setIsClearingMonth(true)
    try {
      const result = await clearAgapeMonthClosing(selectedMonth, selectedYear)
      notifyFinancialDataChanged()
      toast({
        title: 'Mês limpo',
        description: `${result.removed} cobrança(s) removida(s) do fechamento.`,
      })
      setClearMonthOpen(false)
      await loadData.execute()
    } catch (error) {
      handleOperationError(error, 'Não foi possível limpar o mês.')
    } finally {
      setIsClearingMonth(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      await deleteAgapeCharge(deleteTarget)
      notifyFinancialDataChanged()
      toast({
        title: 'Lançamento excluído',
        description: deleteTarget.transactionId
          ? 'A cobrança e a receita na tesouraria foram removidas.'
          : 'A cobrança foi removida do fechamento.',
      })
      setDeleteTarget(null)
      await loadData.execute()
    } catch (error) {
      handleOperationError(error, 'Não foi possível excluir o lançamento.')
    } finally {
      setIsDeleting(false)
    }
  }

  const brothersTotal = charges.reduce((s, c) => s + c.amount, 0)
  const totalPaid = charges
    .filter((c) => c.status === 'Pago')
    .reduce((s, c) => s + c.amount, 0)
  const totalPending = charges
    .filter((c) => c.status !== 'Pago')
    .reduce((s, c) => s + c.amount, 0)
  const totalBeverages = closing?.totalBeveragesSpent ?? 0
  const remainingBalance = Math.max(0, totalBeverages - totalPaid)
  const paymentProgress =
    totalBeverages > 0 ? Math.min(100, (totalPaid / totalBeverages) * 100) : 0
  const pendingCount = charges.filter((c) => c.status !== 'Pago').length
  const beveragesVsConsumptionMismatch =
    totalBeverages > 0 &&
    (liveTotal ?? 0) > 0 &&
    Math.abs((liveTotal ?? 0) - totalBeverages) > 0.01
  const brothersMatchBeverages =
    totalBeverages > 0 &&
    charges.length > 0 &&
    Math.abs(brothersTotal - totalBeverages) < 0.01
  const allBrothersPaid =
    charges.length > 0 && charges.every((c) => c.status === 'Pago')
  const isReadyToClose =
    totalBeverages > 0 &&
    charges.length > 0 &&
    !beveragesVsConsumptionMismatch &&
    brothersMatchBeverages &&
    allBrothersPaid &&
    Math.abs(totalPaid - totalBeverages) < 0.01
  const needsImport =
    (liveTotal ?? 0) > 0 &&
    (charges.length === 0 || Math.abs((liveTotal ?? 0) - brothersTotal) > 0.01)
  const isClosed = closing?.status === 'closed'
  const canEdit = canManageAgapeClosing && !isClosed
  const closeDisabledReason = (() => {
    if (isClosed) return null
    if (totalBeverages <= 0) return 'Salve o total gasto em bebidas.'
    if (charges.length === 0) return 'Importe os consumos ou registre cobranças.'
    if (beveragesVsConsumptionMismatch) {
      return 'O consumo no Ágape deve conferir com o total das bebidas.'
    }
    if (!brothersMatchBeverages) {
      return 'Importe novamente os consumos para alinhar a soma dos irmãos.'
    }
    if (pendingCount > 0) {
      return `${pendingCount} irmão(s) ainda não confirmou pagamento.`
    }
    return null
  })()

  const handleUseLiveTotalAsBeverages = () => {
    if ((liveTotal ?? 0) <= 0) return
    setTotalBeveragesInput(String(liveTotal))
  }

  const monthOptions = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      return {
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        label: format(date, 'MMMM yyyy', { locale: ptBR }),
      }
    })
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Wine className="h-5 w-5" />
            Fechamento do Ágape
          </h3>
          <p className="text-sm text-muted-foreground">
            Informe o total gasto em bebidas, importe o consumo de cada irmão e
            acompanhe o saldo restante conforme os pagamentos entram. Erros de
            lançamento podem ser corrigidos na seção <strong>Correções e ajustes</strong>{' '}
            ou linha a linha na tabela.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={`${selectedYear}-${selectedMonth}`}
            onValueChange={(v) => {
              const [y, m] = v.split('-').map(Number)
              setSelectedYear(y)
              setSelectedMonth(m)
            }}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((opt) => (
                <SelectItem
                  key={`${opt.year}-${opt.month}`}
                  value={`${opt.year}-${opt.month}`}
                >
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => loadData.execute()}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Atualizar
          </Button>
        </div>
      </div>

      {!canManageAgapeClosing && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Acesso restrito</AlertTitle>
          <AlertDescription>
            Apenas a administração, a tesouraria e o Mestre de Banquete podem
            gerenciar o fechamento do ágape.
          </AlertDescription>
        </Alert>
      )}

      {canManageAgapeClosing && !loading && (
        <AgapeClosingAdjustmentsPanel
          monthLabel={monthLabel}
          canEdit={canEdit}
          isClosed={isClosed}
          hasCharges={charges.length > 0}
          hasBeveragesTotal={totalBeverages > 0}
          isAgapeOnlyUser={canAccessAgapeClosingOnly}
          onClearMonth={() => setClearMonthOpen(true)}
          onReopenMonth={() => reopenOperation.execute()}
          clearing={isClearingMonth}
          reopening={reopenOperation.loading}
        />
      )}

      {agapePix.pixName && (
        <Alert>
          <AlertTitle>Beneficiário dos pagamentos PIX</AlertTitle>
          <AlertDescription>
            Os irmãos pagam para <strong>{agapePix.pixName}</strong>
            {agapePix.pixKey ? ` (PIX: ${agapePix.pixKey})` : ''}. Ao confirmar
            cada pagamento aqui, a tesouraria registra a receita correspondente.
          </AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Valor total das bebidas</CardTitle>
              <CardDescription>
                Informe no final do mês quanto foi gasto no total. O saldo vai
                diminuindo conforme cada irmão paga a sua parte.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="total-beverages">Total gasto em bebidas (R$)</Label>
                  <Input
                    id="total-beverages"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Ex.: 850.00"
                    value={totalBeveragesInput}
                    onChange={(e) => setTotalBeveragesInput(e.target.value)}
                    disabled={!canEdit}
                  />
                </div>
                {canEdit && (
                  <Button
                    onClick={() => saveTotalOperation.execute()}
                    disabled={saveTotalOperation.loading}
                  >
                    {saveTotalOperation.loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Salvar total
                  </Button>
                )}
              </div>

              {totalBeverages > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Recebido dos irmãos</span>
                    <span className="font-medium">
                      {formatCurrencyBRL(totalPaid)} de {formatCurrencyBRL(totalBeverages)}
                    </span>
                  </div>
                  <Progress value={paymentProgress} className="h-2" />
                  <p className="text-sm">
                    <span className="text-muted-foreground">Saldo restante: </span>
                    <span
                      className={
                        remainingBalance <= 0.009
                          ? 'font-semibold text-green-600'
                          : 'font-semibold text-amber-600'
                      }
                    >
                      {formatCurrencyBRL(remainingBalance)}
                    </span>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total das bebidas</CardDescription>
                <CardTitle className="text-2xl">
                  {totalBeverages > 0
                    ? formatCurrencyBRL(totalBeverages)
                    : '—'}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Valor informado no fechamento
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Soma dos irmãos</CardDescription>
                <CardTitle className="text-2xl">
                  {formatCurrencyBRL(brothersTotal)}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                {charges.length} irmão(s)
                {liveTotal != null && liveTotal > 0 && (
                  <> · sistema: {formatCurrencyBRL(liveTotal)}</>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Já recebido</CardDescription>
                <CardTitle className="text-2xl text-green-600">
                  {formatCurrencyBRL(totalPaid)}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Pagamentos confirmados
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Saldo restante</CardDescription>
                <CardTitle
                  className={`text-2xl ${
                    totalBeverages > 0 && remainingBalance <= 0.009
                      ? 'text-green-600'
                      : 'text-amber-600'
                  }`}
                >
                  {totalBeverages > 0
                    ? formatCurrencyBRL(remainingBalance)
                    : '—'}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Total das bebidas − recebido
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>A receber</CardDescription>
                <CardTitle className="text-2xl text-amber-600">
                  {formatCurrencyBRL(totalPending)}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                {isClosed ? (
                  <Badge variant="outline" className="gap-1">
                    <Lock className="h-3 w-3" /> Encerrado
                  </Badge>
                ) : (
                  <Badge variant="outline">Em aberto</Badge>
                )}
              </CardContent>
            </Card>
          </div>

          {beveragesVsConsumptionMismatch && !isClosed && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Consumo não confere com o total das bebidas</AlertTitle>
              <AlertDescription>
                O consumo lançado no Ágape ({formatCurrencyBRL(liveTotal!)}) difere do
                total informado ({formatCurrencyBRL(totalBeverages)}). Ajuste o valor
                das bebidas ou confira os lançamentos no módulo Ágape.
              </AlertDescription>
            </Alert>
          )}

          {pendingCount > 0 && !isClosed && !beveragesVsConsumptionMismatch && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-800">Pagamentos em andamento</AlertTitle>
              <AlertDescription className="text-amber-900">
                {pendingCount} irmão(s) ainda não acertou o consumo ({formatCurrencyBRL(totalPending)}{' '}
                pendente). Use <strong>Registrar pagamento</strong> ou edite cada linha
                conforme os PIX forem chegando.
              </AlertDescription>
            </Alert>
          )}

          {needsImport && !isClosed && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Consumos do Ágape não importados</AlertTitle>
              <AlertDescription>
                Há {formatCurrencyBRL(liveTotal!)} lançados no Ágape neste mês, mas o
                fechamento tem {formatCurrencyBRL(brothersTotal)}. Clique em{' '}
                <strong>Importar consumos do mês</strong> para sincronizar.
              </AlertDescription>
            </Alert>
          )}

          {liveConsumptionRows.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  Consumos lançados no Ágape ({monthLabel})
                </CardTitle>
                <CardDescription>
                  Valores registrados no módulo Ágape — use Importar para trazer ao
                  fechamento financeiro.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Irmão</TableHead>
                        <TableHead className="text-right">Itens</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {liveConsumptionRows.map((row) => (
                        <TableRow key={row.brother_id}>
                          <TableCell>{row.brother_name}</TableCell>
                          <TableCell className="text-right">{row.total_items}</TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrencyBRL(row.total_amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="font-medium">
                    Total no Ágape: {formatCurrencyBRL(liveTotal ?? 0)}
                  </span>
                  {canEdit && (liveTotal ?? 0) > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleUseLiveTotalAsBeverages}
                    >
                      Usar este total nas bebidas
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {isReadyToClose && !isClosed && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Pronto para encerrar</AlertTitle>
              <AlertDescription className="text-green-700">
                Consumo, total das bebidas e pagamentos dos irmãos estão conferidos.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {canManageAgapeClosing && (
            <Button
              onClick={() => generateOperation.execute()}
              disabled={isClosed || generateOperation.loading}
              variant="outline"
            >
              {generateOperation.loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Importar consumos do mês
            </Button>
            )}

            {canEdit && (
              <Button
                variant="secondary"
                onClick={() => {
                  setSelectedCharge(null)
                  dialog.openDialog()
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Registrar pagamento
              </Button>
            )}

            {canEdit && (
              <Button
                onClick={() => closeOperation.execute()}
                disabled={!isReadyToClose || closeOperation.loading}
              >
                {closeOperation.loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Lock className="mr-2 h-4 w-4" />
                )}
                Encerrar fechamento
              </Button>
            )}

          </div>

          {closeDisabledReason && !isClosed && (
            <p className="text-sm text-muted-foreground">{closeDisabledReason}</p>
          )}

          {charges.length === 0 ? (
            <div className="rounded-md border bg-card py-12 text-center text-muted-foreground">
              Nenhuma cobrança para {monthLabel}. Informe o total das bebidas e
              importe os consumos ou registre os pagamentos dos irmãos.
            </div>
          ) : (
            <div className="rounded-md border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Irmão</TableHead>
                    <TableHead>Consumo</TableHead>
                    <TableHead>Valor cobrado</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data pagto.</TableHead>
                    <TableHead>Tesouraria</TableHead>
                    {canEdit && (
                      <TableHead className="text-right">Ações</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {charges.map((charge) => (
                    <TableRow key={charge.id}>
                      <TableCell className="font-medium">
                        {brotherNames[charge.brotherId] ||
                          charge.brotherName ||
                          'Desconhecido'}
                      </TableCell>
                      <TableCell className="font-mono">
                        {formatCurrencyBRL(charge.consumedAmount)}
                      </TableCell>
                      <TableCell className="font-mono">
                        {formatCurrencyBRL(charge.amount)}
                      </TableCell>
                      <TableCell>{statusBadge(charge.status)}</TableCell>
                      <TableCell>
                        {charge.paymentDate
                          ? format(new Date(charge.paymentDate), 'dd/MM/yyyy')
                          : '—'}
                      </TableCell>
                      <TableCell>
                        {charge.transactionId ? (
                          <Badge variant="outline" className="text-green-700">
                            Receita lançada
                          </Badge>
                        ) : charge.status === 'Pago' ? (
                          <Badge variant="outline">Sem vínculo</Badge>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      {canEdit && (
                        <TableCell className="text-right space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Editar lançamento"
                            onClick={() => {
                              setSelectedCharge(charge)
                              dialog.openDialog()
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            title="Excluir lançamento"
                            onClick={() => setDeleteTarget(charge)}
                            disabled={isDeleting}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}

      <AgapeChargeDialog
        open={dialog.open}
        onOpenChange={(open) => {
          dialog.onOpenChange(open)
          if (!open) setSelectedCharge(null)
        }}
        chargeToEdit={selectedCharge}
        defaultMonth={selectedMonth}
        defaultYear={selectedYear}
        readOnlyMonthYear
        onSave={(data) => saveOperation.execute(data)}
        saving={saveOperation.loading}
      />

      <AlertDialog
        open={clearMonthOpen}
        onOpenChange={(open) => !open && !isClearingMonth && setClearMonthOpen(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limpar todos os lançamentos do mês?</AlertDialogTitle>
            <AlertDialogDescription>
              Serão excluídas todas as cobranças de <strong>{monthLabel}</strong> e as
              receitas vinculadas na tesouraria. O total das bebidas será zerado. Use para
              recomeçar o fechamento deste mês.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isClearingMonth}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isClearingMonth}
              onClick={(e) => {
                e.preventDefault()
                void handleClearMonthConfirm()
              }}
            >
              {isClearingMonth ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Limpar mês
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && !isDeleting && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lançamento do fechamento?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget ? (
                <>
                  Você está prestes a excluir a cobrança de{' '}
                  <strong>
                    {brotherNames[deleteTarget.brotherId] ||
                      deleteTarget.brotherName ||
                      'irmão'}
                  </strong>{' '}
                  ({formatCurrencyBRL(deleteTarget.amount)}).
                  {deleteTarget.transactionId ? (
                    <>
                      {' '}
                      A receita vinculada na tesouraria também será removida.
                    </>
                  ) : null}{' '}
                  Esta ação não pode ser desfeita.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault()
                void handleDeleteConfirm()
              }}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
