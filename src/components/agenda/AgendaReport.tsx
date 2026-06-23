import { useMemo, useRef, useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useReactToPrint } from 'react-to-print'
import { Download, FileSpreadsheet, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ReportHeader } from '@/components/reports/ReportHeader'
import { useToast } from '@/hooks/use-toast'
import useChancellorStore from '@/stores/useChancellorStore'
import { useLodgePositionsStore } from '@/stores/useLodgePositionsStore'
import { formatDateBR } from '@/lib/format-utils'
import {
  ANNIVERSARY_CATEGORY_OPTIONS,
  buildPeriodAnchor,
  categoryFiltersToMilestoneOptions,
  DEFAULT_ANNIVERSARY_CATEGORY_FILTERS,
  getAnniversariesForPeriod,
  getSessionsForPeriod,
  resolveReportDateRange,
  type AgendaReportKind,
  type AgendaReportPeriod,
  type AnniversaryCategoryFilters,
} from '@/lib/agenda-events'
import {
  exportAgendaAnniversariesCsv,
  exportAgendaSessionsCsv,
} from '@/lib/agenda-report-export'
import {
  loadAgendaReportPreferences,
  saveAgendaReportPreferences,
} from '@/lib/agenda-report-preferences'
import type { Location } from '@/lib/data'

const PERIOD_OPTIONS: { value: AgendaReportPeriod; label: string }[] = [
  { value: 'monthly', label: 'Mensal' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'semiannual', label: 'Semestral' },
  { value: 'annual', label: 'Anual' },
]

function getDefaultPreferences() {
  return {
    reportKind: 'sessions' as AgendaReportKind,
    period: 'monthly' as AgendaReportPeriod,
    monthValue: format(new Date(), 'yyyy-MM'),
    yearValue: new Date().getFullYear(),
    quarter: 1,
    half: 1,
    categoryFilters: DEFAULT_ANNIVERSARY_CATEGORY_FILTERS,
  }
}

function resolveLocationName(
  eventLocation: string,
  locationId: string | undefined,
  locations: Location[],
): string {
  if (locationId) {
    const found = locations.find((l) => l.id === locationId)
    if (found?.name) return found.name
  }
  return eventLocation?.trim() || '—'
}

export function AgendaReport() {
  const { events, brothers, locations } = useChancellorStore()
  const { positions, fetchPositions, initialized } = useLodgePositionsStore()
  const { toast } = useToast()
  const reportRef = useRef<HTMLDivElement>(null)
  const savedPreferences = useMemo(() => loadAgendaReportPreferences(), [])
  const defaults = getDefaultPreferences()

  const [reportKind, setReportKind] = useState<AgendaReportKind>(
    savedPreferences?.reportKind ?? defaults.reportKind,
  )
  const [period, setPeriod] = useState<AgendaReportPeriod>(
    savedPreferences?.period ?? defaults.period,
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
  const [categoryFilters, setCategoryFilters] = useState<AnniversaryCategoryFilters>(
    savedPreferences?.categoryFilters ?? defaults.categoryFilters,
  )

  useEffect(() => {
    if (!initialized) void fetchPositions()
  }, [initialized, fetchPositions])

  useEffect(() => {
    saveAgendaReportPreferences({
      reportKind,
      period,
      monthValue,
      yearValue,
      quarter,
      half,
      categoryFilters,
    })
  }, [reportKind, period, monthValue, yearValue, quarter, half, categoryFilters])

  const periodAnchor = buildPeriodAnchor(period, {
    monthValue,
    yearValue,
    quarter,
    half,
  })

  const dateRange = useMemo(
    () => resolveReportDateRange(period, periodAnchor),
    [period, periodAnchor],
  )

  const sessions = useMemo(
    () => getSessionsForPeriod(events, dateRange),
    [events, dateRange],
  )

  const anniversaries = useMemo(
    () =>
      getAnniversariesForPeriod(
        brothers,
        dateRange,
        categoryFiltersToMilestoneOptions(categoryFilters),
      ),
    [brothers, dateRange, categoryFilters],
  )

  const reportTitle =
    reportKind === 'sessions'
      ? 'Relatório de Sessões Agendadas'
      : 'Relatório de Aniversariantes'

  const venerableMaster =
    positions.find((p) => p.position_type === 'veneravel_mestre')?.user
      ?.full_name || 'Venerável Mestre'
  const chancellor =
    positions.find((p) => p.position_type === 'chanceler')?.user?.full_name ||
    'Chanceler'

  const handlePrint = useReactToPrint({
    contentRef: reportRef,
    documentTitle: `${reportKind}_${periodAnchor}`,
    pageStyle: `
      @page { size: A4; margin: 15mm 20mm; }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    `,
    onAfterPrint: () => {
      toast({
        title: 'Relatório enviado à impressão',
        description: 'Use "Salvar como PDF" na janela de impressão, se desejar.',
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

  const activeCount =
    reportKind === 'sessions' ? sessions.length : anniversaries.length

  const toggleCategory = (categoryId: keyof AnniversaryCategoryFilters, checked: boolean) => {
    setCategoryFilters((prev) => ({ ...prev, [categoryId]: checked }))
  }

  const handleExportCsv = () => {
    try {
      if (reportKind === 'sessions') {
        exportAgendaSessionsCsv(sessions, dateRange, locations)
      } else {
        exportAgendaAnniversariesCsv(anniversaries, dateRange)
      }

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

  return (
    <div className="space-y-6">
      <div className="no-print space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <FileText className="h-5 w-5" />
              Relatórios da Agenda
            </h3>
            <p className="text-sm text-muted-foreground">
              Gere relatórios separados de sessões ou aniversariantes, por período
              e categoria.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button
              variant="outline"
              onClick={handleExportCsv}
              className="gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Exportar Excel
            </Button>
            <Button onClick={() => handlePrint()} className="gap-2">
              <Download className="h-4 w-4" />
              Imprimir / Salvar PDF
            </Button>
          </div>
        </div>

        <Tabs
          value={reportKind}
          onValueChange={(value) => setReportKind(value as AgendaReportKind)}
        >
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="sessions">Sessões</TabsTrigger>
            <TabsTrigger value="anniversaries">Aniversariantes</TabsTrigger>
          </TabsList>
        </Tabs>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Período e filtros</CardTitle>
            <CardDescription>
              Escolha a abrangência do relatório e, para aniversariantes, as
              categorias desejadas.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Período</Label>
              <Select
                value={period}
                onValueChange={(value) => setPeriod(value as AgendaReportPeriod)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {period === 'monthly' && (
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

            {period === 'quarterly' && (
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

            {period === 'semiannual' && (
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

            {period === 'annual' && (
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

          {reportKind === 'anniversaries' && (
            <CardContent className="border-t pt-4">
              <Label className="mb-3 block">Categorias de aniversariantes</Label>
              <div className="grid gap-3 sm:grid-cols-2">
                {ANNIVERSARY_CATEGORY_OPTIONS.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`agenda-cat-${option.id}`}
                      checked={categoryFilters[option.id]}
                      onCheckedChange={(checked) =>
                        toggleCategory(option.id, Boolean(checked))
                      }
                    />
                    <Label htmlFor={`agenda-cat-${option.id}`}>{option.label}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resumo — {dateRange.label}</CardTitle>
            <CardDescription>
              {reportKind === 'sessions'
                ? `${activeCount} sessão(ões) no período selecionado.`
                : `${activeCount} aniversariante(s) nas categorias selecionadas.`}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <div
        id="agenda-report-container"
        ref={reportRef}
        className="rounded-md border bg-white p-8 text-black print:p-0"
      >
        <ReportHeader
          title={reportTitle}
          subtitle={dateRange.periodLabel}
        />

        {reportKind === 'sessions' ? (
          <section className="mb-4 print:mb-3">
            <h3 className="mb-2 border-b border-black pb-1 text-sm font-bold uppercase print:mb-1 print:text-xs">
              Sessões Agendadas
            </h3>
            {sessions.length === 0 ? (
              <p className="text-xs text-gray-600 print:text-[10px]">
                Nenhuma sessão agendada para o período selecionado.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-b-2 border-black hover:bg-transparent">
                    <TableHead className="text-[10px] font-bold uppercase text-black print:text-[9px]">
                      Data
                    </TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-black print:text-[9px]">
                      Hora
                    </TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-black print:text-[9px]">
                      Título
                    </TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-black print:text-[9px]">
                      Local
                    </TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-black print:text-[9px]">
                      Descrição
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow
                      key={session.id}
                      className="border-b border-gray-300 hover:bg-transparent print:border-black"
                    >
                      <TableCell className="text-xs print:text-[10px]">
                        {formatDateBR(session.date)}
                      </TableCell>
                      <TableCell className="text-xs print:text-[10px]">
                        {session.time || '—'}
                      </TableCell>
                      <TableCell className="text-xs font-medium print:text-[10px]">
                        {session.title}
                      </TableCell>
                      <TableCell className="text-xs print:text-[10px]">
                        {resolveLocationName(
                          session.location,
                          session.locationId,
                          locations,
                        )}
                      </TableCell>
                      <TableCell className="text-xs print:text-[10px]">
                        {session.description?.trim() || '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </section>
        ) : (
          <section className="mb-4 print:mb-3">
            <h3 className="mb-2 border-b border-black pb-1 text-sm font-bold uppercase print:mb-1 print:text-xs">
              Aniversariantes do Período
            </h3>
            <p className="mb-2 text-[10px] text-gray-600 print:mb-1 print:text-[9px]">
              Categorias:{' '}
              {ANNIVERSARY_CATEGORY_OPTIONS.filter((o) => categoryFilters[o.id])
                .map((o) => o.label)
                .join(' · ') || 'Nenhuma categoria selecionada'}
            </p>
            {anniversaries.length === 0 ? (
              <p className="text-xs text-gray-600 print:text-[10px]">
                Nenhum aniversariante encontrado para o período e categorias
                selecionados.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-b-2 border-black hover:bg-transparent">
                    <TableHead className="text-[10px] font-bold uppercase text-black print:text-[9px]">
                      Data
                    </TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-black print:text-[9px]">
                      Nome
                    </TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-black print:text-[9px]">
                      Categoria
                    </TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-black print:text-[9px]">
                      Vínculo
                    </TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-black print:text-[9px]">
                      Observação
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {anniversaries.map((row) => (
                    <TableRow
                      key={row.id}
                      className="border-b border-gray-300 hover:bg-transparent print:border-black"
                    >
                      <TableCell className="text-xs print:text-[10px]">
                        {formatDateBR(row.date)}
                      </TableCell>
                      <TableCell className="text-xs font-medium print:text-[10px]">
                        {row.name}
                      </TableCell>
                      <TableCell className="text-xs print:text-[10px]">
                        {row.category}
                      </TableCell>
                      <TableCell className="text-xs print:text-[10px]">
                        {row.relatedTo}
                      </TableCell>
                      <TableCell className="text-xs print:text-[10px]">
                        {row.notes}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </section>
        )}

        <footer className="mt-6 grid grid-cols-2 gap-8 border-t border-black pt-4 print:mt-4 print:gap-6 print:pt-3 page-break-inside-avoid">
          <div className="text-center">
            <div className="mx-auto mb-8 h-px w-48 border-t border-black print:mb-6 print:w-40" />
            <p className="text-xs font-semibold print:text-[10px]">{venerableMaster}</p>
            <p className="text-[10px] uppercase tracking-wide print:text-[9px]">
              Venerável Mestre
            </p>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-8 h-px w-48 border-t border-black print:mb-6 print:w-40" />
            <p className="text-xs font-semibold print:text-[10px]">{chancellor}</p>
            <p className="text-[10px] uppercase tracking-wide print:text-[9px]">
              Chanceler
            </p>
          </div>
        </footer>

        <p className="mt-4 text-center text-[9px] text-gray-500 print:mt-2 print:text-[8px]">
          Documento gerado eletronicamente pelo sistema Templários da Paz
        </p>
      </div>
    </div>
  )
}
