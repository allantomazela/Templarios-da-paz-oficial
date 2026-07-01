import { useEffect, useMemo, useRef, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useReactToPrint } from 'react-to-print'
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import type { ForecastProjectionResult } from '@/lib/forecast-types'
import {
  DEFAULT_FORECAST_REPORT_DISPLAY_OPTIONS,
  hasVisibleForecastReportSection,
} from '@/lib/forecast-report-display'
import {
  loadForecastReportPreferences,
  saveForecastReportPreferences,
  type ForecastReportMonthScope,
} from '@/lib/forecast-report-preferences'
import { exportForecastPlanningCsv } from '@/lib/forecast-report-export'
import {
  FORECAST_PRINT_PAGE_STYLE,
  ForecastPlanningReportDocument,
} from '@/components/financial/ForecastPlanningReportDocument'
import { ForecastReportContentOptions } from '@/components/financial/ForecastReportContentOptions'

interface ForecastPlanningReportProps {
  projection: ForecastProjectionResult | null
  loading?: boolean
}

function buildPeriodLabel(projection: ForecastProjectionResult): string {
  if (projection.months.length === 0) return 'Sem período'
  if (projection.months.length === 1) return projection.months[0].label
  const first = projection.months[0].label
  const last = projection.months[projection.months.length - 1].label
  return `${first} — ${last}`
}

export function ForecastPlanningReport({
  projection,
  loading = false,
}: ForecastPlanningReportProps) {
  const { toast } = useToast()
  const reportRef = useRef<HTMLDivElement>(null)
  const savedPreferences = useMemo(() => loadForecastReportPreferences(), [])

  const [displayOptions, setDisplayOptions] = useState(
    savedPreferences?.displayOptions ?? DEFAULT_FORECAST_REPORT_DISPLAY_OPTIONS,
  )
  const [monthScope, setMonthScope] = useState<ForecastReportMonthScope>(
    savedPreferences?.monthScope ?? 'all',
  )

  useEffect(() => {
    saveForecastReportPreferences({ displayOptions, monthScope })
  }, [displayOptions, monthScope])

  const generatedAtLabel = useMemo(
    () => format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }),
    [],
  )

  const periodLabel = projection ? buildPeriodLabel(projection) : ''
  const hasData = Boolean(projection?.months.some((month) => month.rows.length > 0))
  const canRenderReport = hasData && hasVisibleForecastReportSection(displayOptions)

  const resolvedMonthScope =
    monthScope === 'all' ? 'all' : Number(monthScope)

  const handlePrint = useReactToPrint({
    contentRef: reportRef,
    documentTitle: `Planejamento_Financeiro_${format(new Date(), 'yyyy-MM-dd')}`,
    pageStyle: FORECAST_PRINT_PAGE_STYLE,
    onAfterPrint: () => {
      toast({
        title: 'Relatório enviado à impressão',
        description:
          'Use "Salvar como PDF" na janela de impressão para gerar o arquivo.',
      })
    },
    onPrintError: () => {
      toast({
        title: 'Erro ao imprimir',
        description: 'Não foi possível exportar o relatório. Tente novamente.',
        variant: 'destructive',
      })
    },
  })

  const handleExportCsv = () => {
    if (!projection) return

    try {
      exportForecastPlanningCsv(projection)
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
            : 'Não há dados de planejamento para exportar.',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Carregando relatório de planejamento...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="no-print space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <FileText className="h-5 w-5" />
              Relatório de Planejamento
            </h3>
            <p className="text-sm text-muted-foreground">
              Previsto × realizado com a mesma personalização dos demais relatórios
              da loja (logo, nome e endereço).
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button
              variant="outline"
              onClick={handleExportCsv}
              disabled={!hasData}
              className="gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Exportar Excel
            </Button>
            <Button
              onClick={() => handlePrint()}
              disabled={!canRenderReport}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Imprimir / Salvar PDF
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Período do detalhamento</CardTitle>
            <CardDescription>
              O resumo e os indicadores consideram os 3 meses do horizonte. O
              detalhamento linha a linha pode ser filtrado por mês.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-w-xs space-y-2">
              <Label htmlFor="forecast-report-month-scope">Mês no detalhamento</Label>
              <Select
                value={monthScope}
                onValueChange={(value) =>
                  setMonthScope(value as ForecastReportMonthScope)
                }
              >
                <SelectTrigger id="forecast-report-month-scope">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os meses (3 meses)</SelectItem>
                  {projection?.months.map((month, index) => (
                    <SelectItem key={month.label} value={String(index)}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <ForecastReportContentOptions
          options={displayOptions}
          onChange={setDisplayOptions}
        />
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="no-print">
          <CardTitle className="text-base">Pré-visualização</CardTitle>
          <CardDescription>
            {hasData
              ? periodLabel
              : 'Cadastre contas fixas para gerar o relatório de planejamento.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {!hasData ? (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground sm:px-0">
              Nenhum item previsto no horizonte de 3 meses.
            </p>
          ) : !canRenderReport ? (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground sm:px-0">
              Selecione ao menos uma seção em &quot;Conteúdo do relatório&quot; para
              visualizar ou imprimir.
            </p>
          ) : (
            <div className="max-h-[70vh] overflow-auto border-t bg-white p-3 sm:rounded-md sm:border sm:p-4">
              <div
                id="financial-planning-report-container"
                ref={reportRef}
                className="rounded-md border bg-white p-6 text-black print:border-0 print:p-0"
              >
                {projection ? (
                  <ForecastPlanningReportDocument
                    projection={projection}
                    periodLabel={periodLabel}
                    generatedAt={generatedAtLabel}
                    display={displayOptions}
                    monthScope={resolvedMonthScope}
                  />
                ) : null}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
