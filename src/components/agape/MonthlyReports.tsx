import { useState, useEffect, useRef } from 'react'
import { logError } from '@/lib/logger'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAgapeStore } from '@/stores/useAgapeStore'
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Download, Loader2, FileText } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { AgapePaymentReport } from './AgapePaymentReport'
import useSiteSettingsStore from '@/stores/useSiteSettingsStore'
import { useAgapePermissions } from '@/hooks/use-agape-permissions'
import { ReportHeader } from '@/components/reports/ReportHeader'
import { useReactToPrint } from 'react-to-print'
import { useToast } from '@/hooks/use-toast'

export function MonthlyReports() {
  const { sessions, fetchSessions, fetchConsumptions } = useAgapeStore()
  const { agapePix } = useSiteSettingsStore()
  const { isAgapeAdmin } = useAgapePermissions()
  const { toast } = useToast()
  const reportRef = useRef<HTMLDivElement>(null)
  const [selectedMonth, setSelectedMonth] = useState<string>(
    format(new Date(), 'yyyy-MM')
  )
  const [loading, setLoading] = useState(false)
  const [showPdfReport, setShowPdfReport] = useState(false)
  const [reportData, setReportData] = useState<Array<{
    brotherId: string
    brotherName: string
    totalAmount: number
    totalItems: number
    consumptions: Array<{
      date: string
      itemName: string
      quantity: number
      amount: number
    }>
  }>>([])

  useEffect(() => {
    fetchSessions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!selectedMonth) return

    let isMounted = true

    const loadMonthlyReport = async () => {
      setLoading(true)
      try {
        const [year, month] = selectedMonth.split('-').map(Number)
        const startDate = startOfMonth(new Date(year, month - 1))
        const endDate = endOfMonth(new Date(year, month - 1))

        // Buscar sessões do mês
        const monthSessions = sessions.filter((s) => {
          const sessionDate = parseISO(s.date)
          return sessionDate >= startDate && sessionDate <= endDate
        })

        // Buscar todos os consumos das sessões do mês
        const sessionIds = monthSessions.map((s) => s.id)
        if (sessionIds.length === 0) {
          if (isMounted) {
            setReportData([])
            setLoading(false)
          }
          return
        }

        await fetchConsumptions()

        if (!isMounted) return

        // Agrupar por irmão usando consumptions atualizados
        const brotherMap = new Map<string, {
          brotherId: string
          brotherName: string
          totalAmount: number
          totalItems: number
          consumptions: Array<{
            date: string
            itemName: string
            quantity: number
            amount: number
          }>
        }>()

        // Obter consumptions atualizados do store
        const storeState = useAgapeStore.getState()
        const monthConsumptions = storeState.consumptions.filter((c) =>
          sessionIds.includes(c.session_id)
        )

        for (const consumption of monthConsumptions) {
          const session = monthSessions.find((s) => s.id === consumption.session_id)
          if (!session) continue

          const brotherId = consumption.brother_id
          const brotherName = consumption.brother?.full_name || 'Sem nome'

          if (!brotherMap.has(brotherId)) {
            brotherMap.set(brotherId, {
              brotherId,
              brotherName,
              totalAmount: 0,
              totalItems: 0,
              consumptions: [],
            })
          }

          const brotherData = brotherMap.get(brotherId)!
          brotherData.totalAmount += consumption.total_amount
          brotherData.totalItems += consumption.quantity
          brotherData.consumptions.push({
            date: session.date,
            itemName: consumption.menu_item?.name || 'Item removido',
            quantity: consumption.quantity,
            amount: consumption.total_amount,
          })
        }

        if (isMounted) {
          setReportData(Array.from(brotherMap.values()))
        }
      } catch (error) {
        logError('Error loading monthly report', error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadMonthlyReport()

    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth])

  const monthName = format(parseISO(`${selectedMonth}-01`), 'MMMM yyyy', { locale: ptBR })

  const handlePrint = useReactToPrint({
    contentRef: reportRef,
    documentTitle: `Relatorio_Agape_Mensal_${selectedMonth}`,
    pageStyle: `
      @page {
        size: A4;
        margin: 15mm 20mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    `,
    onBeforeGetContent: () => {
      // Garantir que o conteúdo está pronto
      return Promise.resolve()
    },
    onAfterPrint: () => {
      toast({
        title: 'Relatório Gerado',
        description: 'O relatório foi enviado para impressão/PDF. Use "Salvar como PDF" na janela de impressão para salvar o arquivo.',
      })
    },
    onPrintError: (error) => {
      toast({
        title: 'Erro ao Gerar PDF',
        description: 'Não foi possível gerar o PDF. Tente novamente.',
        variant: 'destructive',
      })
      console.error('Erro ao imprimir:', error)
    },
  })

  const handleExport = () => {
    const csv = [
      ['Irmão', 'Total de Itens', 'Valor Total'].join(','),
      ...reportData.map((r) =>
        [
          r.brotherName,
          r.totalItems.toString(),
          r.totalAmount.toFixed(2),
        ].join(',')
      ),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `relatorio-agape-${monthName}.csv`
    link.click()
  }

  const totalAmount = reportData.reduce((sum, r) => sum + r.totalAmount, 0)
  const totalItems = reportData.reduce((sum, r) => sum + r.totalItems, 0)

  return (
    <div className="space-y-6">
      {/* Controles - não aparecem na impressão */}
      <div className="flex items-center justify-between no-print">
        <div>
          <h3 className="text-lg font-semibold">Relatórios Mensais</h3>
          <p className="text-sm text-muted-foreground">
            Visualize, imprima ou salve como PDF os relatórios de consumo mensal dos irmãos.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Selecione o mês" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => {
                const date = new Date()
                date.setMonth(date.getMonth() - i)
                const value = format(date, 'yyyy-MM')
                const label = format(date, 'MMMM yyyy', { locale: ptBR })
                return (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
          {reportData.length > 0 && (
            <>
              <Button onClick={handlePrint} className="gap-2" title="Imprimir ou salvar como PDF">
                <Download className="h-4 w-4" />
                Imprimir / Salvar PDF
              </Button>
              <Button onClick={handleExport} variant="outline" title="Exportar dados em formato CSV">
                <Download className="mr-2 h-4 w-4" />
                Exportar CSV
              </Button>
              {agapePix.pixKey && agapePix.pixName && (
                <Button onClick={() => setShowPdfReport(!showPdfReport)} variant="secondary">
                  <FileText className="mr-2 h-4 w-4" />
                  {showPdfReport ? 'Ocultar' : 'Gerar'} Relatório com PIX
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Loading indicator - não aparece na impressão */}
      {loading && (
        <div className="flex items-center justify-center p-8 no-print">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Resumo - não aparece na impressão */}
      {!loading && reportData.length > 0 && (
        <Card className="no-print">
          <CardHeader>
            <CardTitle>Resumo do Mês</CardTitle>
            <CardDescription>
              {format(parseISO(`${selectedMonth}-01`), 'MMMM yyyy', { locale: ptBR })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total de Irmãos</p>
                <p className="text-2xl font-bold">{reportData.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Itens</p>
                <p className="text-2xl font-bold">{totalItems}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(totalAmount)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Relatório formatado para impressão/PDF - sempre renderizado */}
      <div
        id="agape-monthly-report-container"
        className="border rounded-md bg-white text-black p-8 print:p-0"
        ref={reportRef}
      >
        <ReportHeader
          title="Relatório Mensal de Consumo no Ágape"
          subtitle={`Período: ${monthName}`}
          description={`Relatório detalhado dos consumos registrados pelos irmãos nas sessões de ágape do mês de ${monthName}`}
        />

        {/* Resumo estatístico */}
        <div className="mb-2 print:mb-1.5 grid grid-cols-3 gap-2 print:gap-1.5 border-b border-black print:border-b pb-1.5 print:pb-1">
          <div className="text-center">
            <p className="text-[10px] print:text-[9px] font-bold text-gray-500 uppercase mb-0.5 print:mb-0">
              Total de Irmãos
            </p>
            <p className="text-lg print:text-base font-bold text-black">{reportData.length}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] print:text-[9px] font-bold text-gray-500 uppercase mb-0.5 print:mb-0">
              Total de Itens
            </p>
            <p className="text-lg print:text-base font-bold text-black">{totalItems}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] print:text-[9px] font-bold text-gray-500 uppercase mb-0.5 print:mb-0">
              Valor Total
            </p>
            <p className="text-lg print:text-base font-bold text-black">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(totalAmount)}
            </p>
          </div>
        </div>

        {/* Tabela de consumos */}
        {reportData.length === 0 ? (
          <div className="text-center py-4 print:py-3 text-gray-500">
            <p className="text-xs print:text-[10px]">Nenhum consumo registrado para o mês selecionado.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-b border-black">
                <TableHead className="text-black font-bold text-xs print:text-[10px] py-1 print:py-0.5">Irmão</TableHead>
                <TableHead className="text-center text-black font-bold text-xs print:text-[10px] py-1 print:py-0.5">
                  Total de Itens
                </TableHead>
                <TableHead className="text-right text-black font-bold text-xs print:text-[10px] py-1 print:py-0.5">
                  Valor Total
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.map((data) => (
                <TableRow key={data.brotherId} className="border-b border-gray-200">
                  <TableCell className="font-medium text-black text-xs print:text-[10px] py-1 print:py-0.5">
                    {data.brotherName}
                  </TableCell>
                  <TableCell className="text-center text-black text-xs print:text-[10px] py-1 print:py-0.5">
                    {data.totalItems}
                  </TableCell>
                  <TableCell className="text-right text-black font-medium text-xs print:text-[10px] py-1 print:py-0.5">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(data.totalAmount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Rodapé do documento */}
        <div className="mt-4 print:mt-3 pt-2 print:pt-1 border-t text-center text-[10px] print:text-[9px] text-gray-400">
          <p>Documento gerado eletronicamente pelo sistema Templários da Paz</p>
        </div>
      </div>

      {/* Relatório PDF com QR Code PIX */}
      {!loading && showPdfReport && reportData.length > 0 && agapePix.pixKey && agapePix.pixName && (
        <Card className="no-print">
          <CardHeader>
            <CardTitle>Relatório de Pagamento com QR Code PIX</CardTitle>
            <CardDescription>
              Relatório individual para cada irmão com QR Code para pagamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AgapePaymentReport
              reportData={reportData}
              selectedMonth={selectedMonth}
              paymentType={agapePix.paymentType}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
