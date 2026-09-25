import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useReactToPrint } from 'react-to-print'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { BrotherSearchCombobox } from '@/components/financial/BrotherSearchCombobox'
import { TempleSaleDialog } from '@/components/financial/TempleSaleDialog'
import { TempleSaleMarkPaidDialog } from '@/components/financial/TempleSaleMarkPaidDialog'
import { TempleSalesReportDocument } from '@/components/financial/TempleSalesReportDocument'
import { useToast } from '@/hooks/use-toast'
import { fetchApprovedBrothers } from '@/lib/contribution-payments'
import { downloadCsvFile } from '@/lib/export-utils'
import { formatCurrencyBRL, formatDateBR } from '@/lib/format-utils'
import { MEMBERSHIP_PRINT_STYLE } from '@/lib/membership-print-style'
import {
  TEMPLE_SALE_PAYMENT_MODE_LABELS,
  templeSaleStatusLabel,
  type TempleSale,
  type TempleSaleFormData,
  type TempleSaleMarkPaidData,
  type TempleSaleStatus,
} from '@/lib/temple-sale-types'
import {
  cancelTempleSale,
  deleteTempleSale,
  fetchTempleSales,
  markTempleSalePaid,
  saveTempleSale,
} from '@/lib/temple-sales'
import { notifyFinancialDataChanged } from '@/stores/useFinancialStore'
import {
  CheckCircle2,
  FileSpreadsheet,
  Loader2,
  Pencil,
  Plus,
  Printer,
  Trash2,
  XCircle,
} from 'lucide-react'

function statusBadge(status: TempleSaleStatus) {
  if (status === 'Pago') {
    return <Badge className="bg-green-600 hover:bg-green-700">Pago</Badge>
  }
  if (status === 'Atrasado') {
    return <Badge variant="destructive">Atrasado</Badge>
  }
  if (status === 'Cancelado') {
    return <Badge variant="outline">Cancelado</Badge>
  }
  return <Badge variant="secondary">Pendente</Badge>
}

export function TempleSalesPanel() {
  const { toast } = useToast()
  const printRef = useRef<HTMLDivElement>(null)
  const [sales, setSales] = useState<TempleSale[]>([])
  const [brothers, setBrothers] = useState<
    { id: string; full_name: string | null }[]
  >([])
  const [loading, setLoading] = useState(true)
  const [brotherFilter, setBrotherFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<TempleSaleStatus | 'all'>(
    'all',
  )
  const [dialogOpen, setDialogOpen] = useState(false)
  const [markPaidOpen, setMarkPaidOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saleToEdit, setSaleToEdit] = useState<TempleSale | null>(null)
  const [saleToPay, setSaleToPay] = useState<TempleSale | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [saleRows, brotherRows] = await Promise.all([
        fetchTempleSales({
          brotherId: brotherFilter || undefined,
          status: statusFilter,
        }),
        fetchApprovedBrothers(),
      ])
      setSales(saleRows)
      setBrothers(brotherRows)
    } catch (error) {
      toast({
        title: 'Erro ao carregar vendas',
        description:
          error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [brotherFilter, statusFilter, toast])

  useEffect(() => {
    void load()
  }, [load])

  const summary = useMemo(() => {
    const open = sales.filter(
      (s) => s.status === 'Pendente' || s.status === 'Atrasado',
    )
    const paid = sales.filter((s) => s.status === 'Pago')
    return {
      openCount: open.length,
      openAmount: open.reduce((sum, s) => sum + s.amount, 0),
      paidCount: paid.length,
      paidAmount: paid.reduce((sum, s) => sum + s.amount, 0),
    }
  }, [sales])

  const reportData = useMemo(() => {
    const brotherLabel = brotherFilter
      ? brothers.find((b) => b.id === brotherFilter)?.full_name ||
        'Irmão selecionado'
      : 'Todos os irmãos'
    const statusLabel =
      statusFilter === 'all'
        ? 'Todos os status'
        : templeSaleStatusLabel(statusFilter)

    return {
      sales,
      summary: {
        ...summary,
        brotherFilterLabel: brotherLabel,
        statusFilterLabel: statusLabel,
        generatedAt: new Date().toISOString(),
      },
    }
  }, [sales, summary, brotherFilter, brothers, statusFilter])

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Vendas do Templo',
    pageStyle: MEMBERSHIP_PRINT_STYLE,
    onAfterPrint: () => {
      toast({ title: 'Relatório enviado à impressão' })
    },
  })

  async function handleSave(data: TempleSaleFormData) {
    setSaving(true)
    try {
      await saveTempleSale(data)
      notifyFinancialDataChanged()
      toast({ title: 'Venda salva com sucesso' })
      setDialogOpen(false)
      setSaleToEdit(null)
      await load()
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description:
          error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleMarkPaid(data: TempleSaleMarkPaidData) {
    setSaving(true)
    try {
      await markTempleSalePaid(data)
      notifyFinancialDataChanged()
      toast({ title: 'Pagamento registrado' })
      setMarkPaidOpen(false)
      setSaleToPay(null)
      await load()
    } catch (error) {
      toast({
        title: 'Erro ao marcar pago',
        description:
          error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleCancel(sale: TempleSale) {
    if (!window.confirm(`Cancelar a venda "${sale.description}"?`)) return
    try {
      await cancelTempleSale(sale.id)
      notifyFinancialDataChanged()
      toast({ title: 'Venda cancelada' })
      await load()
    } catch (error) {
      toast({
        title: 'Erro ao cancelar',
        description:
          error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      })
    }
  }

  async function handleDelete(sale: TempleSale) {
    if (!window.confirm(`Excluir definitivamente "${sale.description}"?`)) return
    try {
      await deleteTempleSale(sale.id)
      notifyFinancialDataChanged()
      toast({ title: 'Venda excluída' })
      await load()
    } catch (error) {
      toast({
        title: 'Erro ao excluir',
        description:
          error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      })
    }
  }

  function handleExportCsv() {
    const rows = sales.map((sale) => [
      sale.brotherName ?? '',
      sale.description,
      sale.amount.toFixed(2),
      formatDateBR(sale.saleDate),
      sale.dueDate ? formatDateBR(sale.dueDate) : '',
      TEMPLE_SALE_PAYMENT_MODE_LABELS[sale.paymentMode],
      templeSaleStatusLabel(sale.status),
      sale.paymentDate ? formatDateBR(sale.paymentDate) : '',
      sale.notes?.trim() ?? '',
    ])
    downloadCsvFile(
      [
        'Irmão',
        'Descrição',
        'Valor (R$)',
        'Data venda',
        'Vencimento',
        'Forma',
        'Status',
        'Data pagamento',
        'Observações',
      ],
      rows,
      'vendas-templo',
    )
    toast({ title: 'CSV exportado' })
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Em aberto</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.openCount}</p>
            <p className="text-sm text-muted-foreground">
              {formatCurrencyBRL(summary.openAmount)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pagas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-700">
              {summary.paidCount}
            </p>
            <p className="text-sm text-muted-foreground">
              {formatCurrencyBRL(summary.paidAmount)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vendas do Templo</CardTitle>
          <CardDescription>
            Controle de vendas por irmão (à vista ou a prazo), com vínculo ao
            caixa e ao extrato.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <BrotherSearchCombobox
              brothers={brothers}
              value={brotherFilter}
              onChange={setBrotherFilter}
              placeholder="Todos os irmãos"
              className="lg:flex-1"
            />
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as TempleSaleStatus | 'all')
              }
            >
              <SelectTrigger className="lg:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="Pendente">Pendente</SelectItem>
                <SelectItem value="Atrasado">Atrasado</SelectItem>
                <SelectItem value="Pago">Pago</SelectItem>
                <SelectItem value="Cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={handleExportCsv}
                disabled={sales.length === 0}
              >
                <FileSpreadsheet className="h-4 w-4" />
                CSV
              </Button>
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => handlePrint()}
                disabled={sales.length === 0}
              >
                <Printer className="h-4 w-4" />
                Imprimir / PDF
              </Button>
              <Button
                type="button"
                className="gap-2"
                onClick={() => {
                  setSaleToEdit(null)
                  setDialogOpen(true)
                }}
              >
                <Plus className="h-4 w-4" />
                Nova venda
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Carregando vendas...
            </div>
          ) : sales.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma venda encontrada para o filtro atual.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Irmão</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Forma</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">
                        {sale.brotherName ?? '—'}
                      </TableCell>
                      <TableCell className="max-w-[220px]">
                        <div className="truncate">{sale.description}</div>
                        {sale.dueDate ? (
                          <div className="text-xs text-muted-foreground">
                            Venc. {formatDateBR(sale.dueDate)}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell>{formatDateBR(sale.saleDate)}</TableCell>
                      <TableCell>
                        {TEMPLE_SALE_PAYMENT_MODE_LABELS[sale.paymentMode]}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrencyBRL(sale.amount)}
                      </TableCell>
                      <TableCell>{statusBadge(sale.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {sale.status === 'Pendente' ||
                          sale.status === 'Atrasado' ? (
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              title="Marcar pago"
                              onClick={() => {
                                setSaleToPay(sale)
                                setMarkPaidOpen(true)
                              }}
                            >
                              <CheckCircle2 className="h-4 w-4 text-green-700" />
                            </Button>
                          ) : null}
                          {sale.status !== 'Cancelado' ? (
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              title="Editar"
                              onClick={() => {
                                setSaleToEdit(sale)
                                setDialogOpen(true)
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          ) : null}
                          {sale.status !== 'Cancelado' &&
                          sale.status !== 'Pago' ? (
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              title="Cancelar"
                              onClick={() => void handleCancel(sale)}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          ) : null}
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            title="Excluir"
                            onClick={() => void handleDelete(sale)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="no-print">
          <CardTitle className="text-base">Pré-visualização</CardTitle>
          <CardDescription>
            Documento usado na impressão / PDF das vendas do templo.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="max-h-[70vh] overflow-auto border-t bg-white p-3 sm:rounded-md sm:border sm:p-4">
            <div id="temple-sales-report-container" ref={printRef}>
              <TempleSalesReportDocument data={reportData} />
            </div>
          </div>
        </CardContent>
      </Card>

      <TempleSaleDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setSaleToEdit(null)
        }}
        saleToEdit={saleToEdit}
        onSave={(data) => void handleSave(data)}
        saving={saving}
      />

      <TempleSaleMarkPaidDialog
        open={markPaidOpen}
        onOpenChange={(open) => {
          setMarkPaidOpen(open)
          if (!open) setSaleToPay(null)
        }}
        sale={saleToPay}
        onConfirm={(data) => void handleMarkPaid(data)}
        saving={saving}
      />
    </div>
  )
}
