import { useEffect, useMemo, useRef, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useReactToPrint } from 'react-to-print'
import {
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  Share2,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
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
import { ReportHeader } from '@/components/reports/ReportHeader'
import { AgapePaymentReport } from '@/components/agape/AgapePaymentReport'
import { useToast } from '@/hooks/use-toast'
import useSiteSettingsStore from '@/stores/useSiteSettingsStore'
import { useAgapeStore } from '@/stores/useAgapeStore'
import { logError } from '@/lib/logger'
import {
  buildAgapeReportData,
  filterAgapeSessionsByScope,
  listAgapeSessionsForPicker,
  resolveAgapeReportMeta,
  type AgapeBrotherReportRow,
  type AgapeReportScope,
} from '@/lib/agape-report'
import {
  exportAgapeReportCsv,
  shareAgapeReport,
} from '@/lib/agape-report-export'
import {
  loadAgapeReportPreferences,
  saveAgapeReportPreferences,
} from '@/lib/agape-report-preferences'
import { formatCurrencyBRL, formatDateBR } from '@/lib/format-utils'

const SCOPE_OPTIONS: { value: AgapeReportScope; label: string }[] = [
  { value: 'session', label: 'Sessão' },
  { value: 'monthly', label: 'Mensal' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'semiannual', label: 'Semestral' },
  { value: 'annual', label: 'Anual' },
]

function getDefaultPreferences() {
  return {
    scope: 'monthly' as AgapeReportScope,
    monthValue: format(new Date(), 'yyyy-MM'),
    yearValue: new Date().getFullYear(),
    quarter: 1,
    half: 1,
    selectedSessionId: '',
  }
}

function formatSessionLabel(date: string, description: string | null): string {
  const base = formatDateBR(date)
  const details = description?.trim()
  return details ? `${base} — ${details}` : base
}

export function AgapeReports() {
  const { sessions, fetchSessions, fetchConsumptions } = useAgapeStore()
  const { agapePix } = useSiteSettingsStore()
  const { toast } = useToast()
  const reportRef = useRef<HTMLDivElement>(null)

  const savedPreferences = useMemo(() => loadAgapeReportPreferences(), [])
  const defaults = getDefaultPreferences()

  const [scope, setScope] = useState<AgapeReportScope>(
    savedPreferences?.scope ?? defaults.scope,
  )
  const [monthValue, setMonthValue] = useState(
    savedPreferences?.monthValue ?? defaults.monthValue,
  )
  const [yearValue, setYearValue] = useState(
    savedPreferences?.yearValue ?? defaults.yearValue,
  )
  const [quarter, setQuarter] = useState(
    savedPreferences?.quarter ?? defaults.quarter,
  )
  const [half, setHalf] = useState(savedPreferences?.half ?? defaults.half)
  const [selectedSessionId, setSelectedSessionId] = useState(
    savedPreferences?.selectedSessionId ?? defaults.selectedSessionId,
  )
  const [loading, setLoading] = useState(false)
  const [showPdfReport, setShowPdfReport] = useState(false)
  const [reportData, setReportData] = useState<AgapeBrotherReportRow[]>([])

  const periodParams = useMemo(
    () => ({
      monthValue,
      yearValue,
      quarter,
      half,
      selectedSessionId,
    }),
    [monthValue, yearValue, quarter, half, selectedSessionId],
  )

  const sessionOptions = useMemo(
    () => listAgapeSessionsForPicker(sessions),
    [sessions],
  )

  const reportMeta = useMemo(
    () => resolveAgapeReportMeta(scope, periodParams, sessions),
    [scope, periodParams, sessions],
  )

  useEffect(() => {
    void fetchSessions()
  }, [fetchSessions])

  useEffect(() => {
    if (scope === 'session' && !selectedSessionId && sessionOptions.length > 0) {
      setSelectedSessionId(sessionOptions[0].id)
    }
  }, [scope, selectedSessionId, sessionOptions])

  useEffect(() => {
    saveAgapeReportPreferences({
      scope,
      monthValue,
      yearValue,
      quarter,
      half,
      selectedSessionId,
    })
  }, [scope, monthValue, yearValue, quarter, half, selectedSessionId])

  useEffect(() => {
    let isMounted = true

    const loadReport = async () => {
      setLoading(true)
      try {
        const targetSessions = filterAgapeSessionsByScope(
          sessions,
          scope,
          periodParams,
        )

        if (targetSessions.length === 0) {
          if (isMounted) setReportData([])
          return
        }

        await fetchConsumptions()
        if (!isMounted) return

        const latestConsumptions = useAgapeStore.getState().consumptions
        setReportData(
          buildAgapeReportData(sessions, latestConsumptions, targetSessions),
        )
      } catch (error) {
        logError('Error loading agape report', error)
        if (isMounted) setReportData([])
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    void loadReport()
    return () => {
      isMounted = false
    }
  }, [sessions, scope, periodParams, fetchConsumptions])

  const totalAmount = reportData.reduce((sum, row) => sum + row.totalAmount, 0)
  const totalItems = reportData.reduce((sum, row) => sum + row.totalItems, 0)
  const hasData = reportData.length > 0

  const monthOptions = Array.from({ length: 24 }, (_, index) => {
    const date = new Date()
    date.setMonth(date.getMonth() - index)
    return {
      value: format(date, 'yyyy-MM'),
      label: format(date, 'MMMM yyyy', { locale: ptBR }),
    }
  })

  const yearOptions = Array.from({ length: 6 }, (_, index) => {
    const year = new Date().getFullYear() - index
    return { value: year, label: String(year) }
  })

  const handlePrint = useReactToPrint({
    contentRef: reportRef,
    documentTitle: reportMeta.filenameSlug,
    pageStyle: `
      @page { size: A4; margin: 12mm 15mm; }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        #agape-report-container table {
          font-size: 9px;
          line-height: 1.15;
        }
        #agape-report-container th,
        #agape-report-container td {
          padding-top: 1px !important;
          padding-bottom: 1px !important;
        }
      }
    `,
    onAfterPrint: () => {
      toast({
        title: 'Relatório enviado à impressão',
        description:
          'Use "Salvar como PDF" na janela de impressão, se desejar.',
      })
    },
    onPrintError: () => {
      toast({
        title: 'Erro ao imprimir',
        description: 'Não foi possível gerar o relatório. Tente novamente.',
        variant: 'destructive',
      })
    },
  })

  const handleExport = () => {
    try {
      exportAgapeReportCsv(reportData, reportMeta.filenameSlug)
      toast({
        title: 'Planilha exportada',
        description: 'O arquivo CSV foi baixado e pode ser aberto no Excel.',
      })
    } catch (error) {
      toast({
        title: 'Nada para exportar',
        description:
          error instanceof Error
            ? error.message
            : 'Não há dados no período selecionado.',
        variant: 'destructive',
      })
    }
  }

  const handleShare = async () => {
    if (!hasData) {
      toast({
        title: 'Nada para compartilhar',
        description: 'Não há dados no filtro selecionado.',
        variant: 'destructive',
      })
      return
    }

    try {
      const result = await shareAgapeReport(
        reportMeta.periodLabel,
        reportData,
        totalItems,
        totalAmount,
      )

      if (result === 'shared') {
        toast({ title: 'Relatório compartilhado' })
        return
      }

      if (result === 'copied') {
        toast({
          title: 'Resumo copiado',
          description: 'O texto do relatório foi copiado para a área de transferência.',
        })
        return
      }

      toast({
        title: 'Não foi possível compartilhar',
        description: 'Tente exportar o CSV ou usar a impressão.',
        variant: 'destructive',
      })
    } catch {
      toast({
        title: 'Erro ao compartilhar',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="no-print space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold">Relatórios</h3>
            <p className="text-sm text-muted-foreground">
              Filtre por sessão ou período, imprima, compartilhe ou exporte os
              consumos do ágape.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => handlePrint()}
              className="gap-2"
              disabled={!hasData || loading}
            >
              <Download className="h-4 w-4" />
              Imprimir / Salvar PDF
            </Button>
            <Button
              variant="outline"
              onClick={handleShare}
              className="gap-2"
              disabled={!hasData || loading}
            >
              <Share2 className="h-4 w-4" />
              Compartilhar
            </Button>
            <Button
              variant="outline"
              onClick={handleExport}
              className="gap-2"
              disabled={!hasData || loading}
            >
              <FileSpreadsheet className="h-4 w-4" />
              Exportar Excel
            </Button>
            {hasData && agapePix.pixKey && agapePix.pixName && (
              <Button
                variant="secondary"
                onClick={() => setShowPdfReport(!showPdfReport)}
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                {showPdfReport ? 'Ocultar' : 'Gerar'} Relatório com PIX
              </Button>
            )}
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Filtros</CardTitle>
            <CardDescription>
              Escolha a sessão ou a abrangência temporal do relatório.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Abrangência</Label>
              <Select
                value={scope}
                onValueChange={(value) => setScope(value as AgapeReportScope)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCOPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {scope === 'session' && (
              <div className="space-y-2 md:col-span-2">
                <Label>Sessão</Label>
                <Select
                  value={selectedSessionId}
                  onValueChange={setSelectedSessionId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a sessão" />
                  </SelectTrigger>
                  <SelectContent>
                    {sessionOptions.map((session) => (
                      <SelectItem key={session.id} value={session.id}>
                        {formatSessionLabel(session.date, session.description)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {scope === 'monthly' && (
              <div className="space-y-2">
                <Label>Mês de referência</Label>
                <Select value={monthValue} onValueChange={setMonthValue}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {scope === 'quarterly' && (
              <>
                <div className="space-y-2">
                  <Label>Ano</Label>
                  <Select
                    value={String(yearValue)}
                    onValueChange={(value) => setYearValue(Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {yearOptions.map((option) => (
                        <SelectItem key={option.value} value={String(option.value)}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Trimestre</Label>
                  <Select
                    value={String(quarter)}
                    onValueChange={(value) => setQuarter(Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1º trimestre (Jan–Mar)</SelectItem>
                      <SelectItem value="2">2º trimestre (Abr–Jun)</SelectItem>
                      <SelectItem value="3">3º trimestre (Jul–Set)</SelectItem>
                      <SelectItem value="4">4º trimestre (Out–Dez)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {scope === 'semiannual' && (
              <>
                <div className="space-y-2">
                  <Label>Ano</Label>
                  <Select
                    value={String(yearValue)}
                    onValueChange={(value) => setYearValue(Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {yearOptions.map((option) => (
                        <SelectItem key={option.value} value={String(option.value)}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Semestre</Label>
                  <Select
                    value={String(half)}
                    onValueChange={(value) => setHalf(Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1º semestre (Jan–Jun)</SelectItem>
                      <SelectItem value="2">2º semestre (Jul–Dez)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {scope === 'annual' && (
              <div className="space-y-2">
                <Label>Ano</Label>
                <Select
                  value={String(yearValue)}
                  onValueChange={(value) => setYearValue(Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((option) => (
                      <SelectItem key={option.value} value={String(option.value)}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {!loading && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resumo — {reportMeta.label}</CardTitle>
              <CardDescription>
                {hasData
                  ? `${reportData.length} irmão(ãos) · ${totalItems} item(ns) · ${formatCurrencyBRL(totalAmount)}`
                  : 'Nenhum consumo encontrado para o filtro selecionado.'}
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center p-8 no-print">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      <div
        id="agape-report-container"
        ref={reportRef}
        className="rounded-md border bg-white p-6 text-black print:p-3"
      >
        <ReportHeader
          title="Relatório de Consumo no Ágape"
          subtitle={reportMeta.periodLabel}
          description={reportMeta.description}
          className="mb-1 print:mb-0.5"
        />

        <div className="mb-1.5 grid grid-cols-3 gap-1.5 border-b border-black pb-1 print:mb-1 print:gap-1 print:pb-0.5">
          <div className="text-center">
            <p className="mb-0.5 text-[10px] font-bold uppercase text-gray-500 print:mb-0 print:text-[9px]">
              Total de Irmãos
            </p>
            <p className="text-lg font-bold text-black print:text-base">
              {reportData.length}
            </p>
          </div>
          <div className="text-center">
            <p className="mb-0.5 text-[10px] font-bold uppercase text-gray-500 print:mb-0 print:text-[9px]">
              Total de Itens
            </p>
            <p className="text-lg font-bold text-black print:text-base">
              {totalItems}
            </p>
          </div>
          <div className="text-center">
            <p className="mb-0.5 text-[10px] font-bold uppercase text-gray-500 print:mb-0 print:text-[9px]">
              Valor Total
            </p>
            <p className="text-lg font-bold text-black print:text-base">
              {formatCurrencyBRL(totalAmount)}
            </p>
          </div>
        </div>

        {!hasData ? (
          <div className="py-4 text-center text-gray-500 print:py-3">
            <p className="text-xs print:text-[10px]">
              Nenhum consumo registrado para o filtro selecionado.
            </p>
          </div>
        ) : (
          <div className="space-y-2 print:space-y-1">
            {reportData.map((row) => (
              <div
                key={row.brotherId}
                className="break-inside-avoid rounded border border-gray-200 print:break-inside-avoid"
              >
                <div className="flex flex-wrap items-center justify-between gap-1 border-b border-gray-200 bg-gray-50 px-2 py-1 print:px-1.5 print:py-0.5">
                  <h3 className="text-xs font-bold leading-tight text-black print:text-[10px]">
                    {row.brotherName}
                  </h3>
                  <p className="text-[11px] leading-tight text-gray-600 print:text-[9px]">
                    {row.totalItems} item(ns) · {formatCurrencyBRL(row.totalAmount)}
                  </p>
                </div>
                <Table className="[&_th]:h-7 [&_td]:h-7 print:[&_th]:h-6 print:[&_td]:h-6">
                  <TableHeader>
                    <TableRow className="border-b border-gray-200 hover:bg-transparent">
                      <TableHead className="h-7 px-2 py-0.5 text-[11px] font-bold leading-tight text-black print:h-6 print:px-1.5 print:py-0 print:text-[9px]">
                        Data
                      </TableHead>
                      <TableHead className="h-7 px-2 py-0.5 text-[11px] font-bold leading-tight text-black print:h-6 print:px-1.5 print:py-0 print:text-[9px]">
                        Item
                      </TableHead>
                      <TableHead className="h-7 px-2 py-0.5 text-center text-[11px] font-bold leading-tight text-black print:h-6 print:px-1.5 print:py-0 print:text-[9px]">
                        Qtd.
                      </TableHead>
                      <TableHead className="h-7 px-2 py-0.5 text-right text-[11px] font-bold leading-tight text-black print:h-6 print:px-1.5 print:py-0 print:text-[9px]">
                        Valor unit.
                      </TableHead>
                      <TableHead className="h-7 px-2 py-0.5 text-right text-[11px] font-bold leading-tight text-black print:h-6 print:px-1.5 print:py-0 print:text-[9px]">
                        Total
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {row.consumptions.map((consumption, index) => (
                      <TableRow
                        key={`${row.brotherId}-${index}`}
                        className="border-b border-gray-100 hover:bg-transparent"
                      >
                        <TableCell className="px-2 py-0.5 text-[11px] leading-tight text-black print:px-1.5 print:py-0 print:text-[9px]">
                          {formatDateBR(consumption.date)}
                        </TableCell>
                        <TableCell className="px-2 py-0.5 text-[11px] leading-tight text-black print:px-1.5 print:py-0 print:text-[9px]">
                          {consumption.itemName}
                        </TableCell>
                        <TableCell className="px-2 py-0.5 text-center text-[11px] leading-tight text-black print:px-1.5 print:py-0 print:text-[9px]">
                          {consumption.quantity}
                        </TableCell>
                        <TableCell className="px-2 py-0.5 text-right text-[11px] leading-tight text-black print:px-1.5 print:py-0 print:text-[9px]">
                          {formatCurrencyBRL(consumption.unitPrice)}
                        </TableCell>
                        <TableCell className="px-2 py-0.5 text-right text-[11px] font-medium leading-tight text-black print:px-1.5 print:py-0 print:text-[9px]">
                          {formatCurrencyBRL(consumption.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ))}
          </div>
        )}

        <div className="mt-2 border-t pt-1 text-center text-[10px] text-gray-400 print:mt-1 print:pt-0.5 print:text-[8px]">
          <p>Documento gerado eletronicamente pelo sistema Templários da Paz</p>
        </div>
      </div>

      {!loading && showPdfReport && hasData && agapePix.pixKey && agapePix.pixName && (
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
              periodLabel={reportMeta.periodLabel}
              paymentType={agapePix.paymentType}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
