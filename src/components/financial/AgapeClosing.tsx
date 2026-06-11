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
  Loader2,
  RefreshCw,
  Pencil,
  Trash2,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  Wine,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useDialog } from '@/hooks/use-dialog'
import { useAsyncOperation } from '@/hooks/use-async-operation'
import { useToast } from '@/hooks/use-toast'
import { formatCurrencyBRL } from '@/lib/format-utils'
import { notifyFinancialDataChanged } from '@/stores/useFinancialStore'
import useSiteSettingsStore from '@/stores/useSiteSettingsStore'
import { AgapeChargeDialog } from './AgapeChargeDialog'
import {
  closeAgapeMonth,
  deleteAgapeCharge,
  fetchAgapeChargesForMonth,
  fetchAgapeMonthlyClosing,
  fetchLiveConsumptionTotals,
  generateAgapeChargesForMonth,
  reopenAgapeMonth,
  saveAgapeCharge,
  type AgapeChargeFormData,
} from '@/lib/agape-payments'

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
  const { agapePix } = useSiteSettingsStore()
  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [charges, setCharges] = useState<AgapeBrotherCharge[]>([])
  const [brotherNames, setBrotherNames] = useState<Record<string, string>>({})
  const [closing, setClosing] = useState<AgapeMonthlyClosing | null>(null)
  const [liveTotal, setLiveTotal] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const dialog = useDialog()
  const [selectedCharge, setSelectedCharge] = useState<AgapeBrotherCharge | null>(null)

  const monthLabel = useMemo(
    () =>
      format(new Date(selectedYear, selectedMonth - 1, 1), 'MMMM yyyy', {
        locale: ptBR,
      }),
    [selectedMonth, selectedYear],
  )

  const loadData = useAsyncOperation(async () => {
    setLoading(true)
    try {
      const [closingData, chargesData, consumptionTotals] = await Promise.all([
        fetchAgapeMonthlyClosing(selectedMonth, selectedYear),
        fetchAgapeChargesForMonth(selectedMonth, selectedYear),
        fetchLiveConsumptionTotals(selectedMonth, selectedYear).catch(() => []),
      ])

      setClosing(closingData)
      setCharges(chargesData.charges)
      setBrotherNames(chargesData.brotherNames)
      setLiveTotal(
        consumptionTotals.reduce(
          (sum, r) => sum + Number(r.total_amount),
          0,
        ),
      )
    } finally {
      setLoading(false)
    }
  })

  useEffect(() => {
    loadData.run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedYear])

  const saveOperation = useAsyncOperation(async (data: AgapeChargeFormData) => {
    await saveAgapeCharge(data, {
      chargeId: selectedCharge?.id,
      existingTransactionId: selectedCharge?.transactionId,
    })
    notifyFinancialDataChanged()
    toast({
      title: 'Pagamento registrado',
      description: 'A receita foi lançada na tesouraria.',
    })
    dialog.close()
    setSelectedCharge(null)
    await loadData.run()
  })

  const generateOperation = useAsyncOperation(async () => {
    const result = await generateAgapeChargesForMonth(selectedMonth, selectedYear)
    toast({
      title: 'Cobranças geradas',
      description: `${result.created} nova(s), ${result.updated} atualizada(s). Total consumido: ${formatCurrencyBRL(result.totalConsumed)}.`,
    })
    await loadData.run()
  })

  const closeOperation = useAsyncOperation(async () => {
    await closeAgapeMonth(selectedMonth, selectedYear)
    toast({
      title: 'Fechamento encerrado',
      description: `O mês ${monthLabel} foi fechado com sucesso.`,
    })
    await loadData.run()
  })

  const reopenOperation = useAsyncOperation(async () => {
    await reopenAgapeMonth(selectedMonth, selectedYear)
    toast({
      title: 'Fechamento reaberto',
      description: 'O mês pode ser editado novamente.',
    })
    await loadData.run()
  })

  const deleteOperation = useAsyncOperation(async (charge: AgapeBrotherCharge) => {
    if (!confirm(`Excluir cobrança de ${brotherNames[charge.brotherId] || 'irmão'}?`)) {
      return
    }
    await deleteAgapeCharge(charge)
    notifyFinancialDataChanged()
    toast({ title: 'Cobrança excluída' })
    await loadData.run()
  })

  const totalConsumed = charges.reduce((s, c) => s + c.consumedAmount, 0)
  const totalPaid = charges
    .filter((c) => c.status === 'Pago')
    .reduce((s, c) => s + c.amount, 0)
  const totalPending = charges
    .filter((c) => c.status !== 'Pago')
    .reduce((s, c) => s + c.amount, 0)
  const isBalanced =
    charges.length > 0 &&
    charges.every((c) => c.status === 'Pago') &&
    Math.abs(totalConsumed - totalPaid) < 0.01
  const consumptionMismatch =
    liveTotal != null &&
    charges.length > 0 &&
    Math.abs(liveTotal - totalConsumed) > 0.01
  const isClosed = closing?.status === 'closed'

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
            Gere cobranças a partir dos consumos, registre pagamentos dos irmãos e
            encerre o mês quando tudo conferir.
          </p>
        </div>
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
      </div>

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
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Consumo no mês</CardDescription>
                <CardTitle className="text-2xl">
                  {formatCurrencyBRL(liveTotal ?? totalConsumed)}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Sessões fechadas/finalizadas
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Cobranças geradas</CardDescription>
                <CardTitle className="text-2xl">
                  {formatCurrencyBRL(totalConsumed)}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                {charges.length} irmão(s)
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total recebido</CardDescription>
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
                <CardDescription>Pendente</CardDescription>
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

          {consumptionMismatch && !isClosed && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Consumo desatualizado</AlertTitle>
              <AlertDescription>
                O consumo registrado nas sessões (
                {formatCurrencyBRL(liveTotal!)}) difere das cobranças (
                {formatCurrencyBRL(totalConsumed)}). Clique em &quot;Atualizar
                cobranças&quot; para sincronizar.
              </AlertDescription>
            </Alert>
          )}

          {isBalanced && !isClosed && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Pronto para encerrar</AlertTitle>
              <AlertDescription className="text-green-700">
                Todos os irmãos pagaram e o total confere com o consumo do mês.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => generateOperation.run()}
              disabled={isClosed || generateOperation.loading}
              variant="outline"
            >
              {generateOperation.loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              {charges.length === 0 ? 'Gerar cobranças do mês' : 'Atualizar cobranças'}
            </Button>

            {!isClosed && (
              <Button
                onClick={() => closeOperation.run()}
                disabled={!isBalanced || closeOperation.loading}
              >
                {closeOperation.loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Lock className="mr-2 h-4 w-4" />
                )}
                Encerrar fechamento
              </Button>
            )}

            {isClosed && (
              <Button
                variant="outline"
                onClick={() => reopenOperation.run()}
                disabled={reopenOperation.loading}
              >
                {reopenOperation.loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Unlock className="mr-2 h-4 w-4" />
                )}
                Reabrir mês
              </Button>
            )}
          </div>

          {charges.length === 0 ? (
            <div className="rounded-md border bg-card py-12 text-center text-muted-foreground">
              Nenhuma cobrança para {monthLabel}. Gere as cobranças a partir dos
              consumos das sessões fechadas.
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
                    {!isClosed && (
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
                      {!isClosed && (
                        <TableCell className="text-right space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedCharge(charge)
                              dialog.open()
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => deleteOperation.run(charge)}
                            disabled={deleteOperation.loading}
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
        open={dialog.isOpen}
        onOpenChange={(open) => {
          if (!open) {
            dialog.close()
            setSelectedCharge(null)
          }
        }}
        chargeToEdit={selectedCharge}
        defaultMonth={selectedMonth}
        defaultYear={selectedYear}
        readOnlyMonthYear
        onSave={(data) => saveOperation.run(data)}
        saving={saveOperation.loading}
      />
    </div>
  )
}
