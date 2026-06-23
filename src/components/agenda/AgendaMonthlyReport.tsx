import { useMemo, useRef, useEffect } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useReactToPrint } from 'react-to-print'
import { Download, FileText } from 'lucide-react'
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
import { ReportHeader } from '@/components/reports/ReportHeader'
import { useToast } from '@/hooks/use-toast'
import useChancellorStore from '@/stores/useChancellorStore'
import { useLodgePositionsStore } from '@/stores/useLodgePositionsStore'
import {
  formatCalendarDate,
  formatDateBR,
} from '@/lib/format-utils'
import {
  getAnniversariesForMonth,
  getSessionsForMonth,
  parseMonthValue,
} from '@/lib/agenda-events'
import type { Location } from '@/lib/data'

interface AgendaMonthlyReportProps {
  selectedMonth: string
  onMonthChange: (value: string) => void
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

export function AgendaMonthlyReport({
  selectedMonth,
  onMonthChange,
}: AgendaMonthlyReportProps) {
  const { events, brothers, locations } = useChancellorStore()
  const { positions, fetchPositions, initialized } = useLodgePositionsStore()
  const { toast } = useToast()
  const reportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!initialized) void fetchPositions()
  }, [initialized, fetchPositions])

  const { year, month } = parseMonthValue(selectedMonth)
  const monthLabel = formatCalendarDate(`${selectedMonth}-01`, 'MMMM yyyy', {
    locale: ptBR,
  })

  const sessions = useMemo(
    () => getSessionsForMonth(events, year, month),
    [events, year, month],
  )

  const anniversaries = useMemo(
    () => getAnniversariesForMonth(brothers, year, month),
    [brothers, year, month],
  )

  const venerableMaster =
    positions.find((p) => p.position_type === 'veneravel_mestre')?.user
      ?.full_name || 'Venerável Mestre'
  const chancellor =
    positions.find((p) => p.position_type === 'chanceler')?.user?.full_name ||
    'Chanceler'

  const handlePrint = useReactToPrint({
    contentRef: reportRef,
    documentTitle: `Agenda_Mensal_${selectedMonth}`,
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 no-print sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Relatório Mensal da Agenda
          </h3>
          <p className="text-sm text-muted-foreground">
            Sessões agendadas e aniversariantes do mês (irmãos, cônjuges e filhos).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectedMonth} onValueChange={onMonthChange}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Selecione o mês" />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => handlePrint()} className="gap-2">
            <Download className="h-4 w-4" />
            Imprimir / Salvar PDF
          </Button>
        </div>
      </div>

      <Card className="no-print">
        <CardHeader>
          <CardTitle className="text-base">Resumo — {monthLabel}</CardTitle>
          <CardDescription>
            {sessions.length} sessão(ões) e {anniversaries.length} aniversariante(s)
            no período.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Sessões agendadas</p>
            <p className="text-2xl font-bold">{sessions.length}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Aniversariantes</p>
            <p className="text-2xl font-bold">{anniversaries.length}</p>
          </div>
        </CardContent>
      </Card>

      <div
        id="agenda-monthly-report-container"
        ref={reportRef}
        className="rounded-md border bg-white p-8 text-black print:p-0"
      >
        <ReportHeader
          title="Relatório Mensal da Agenda"
          subtitle={`Referência: ${monthLabel}`}
        />

        <section className="mb-4 print:mb-3">
          <h3 className="mb-2 border-b border-black pb-1 text-sm font-bold uppercase print:mb-1 print:text-xs">
            Sessões Agendadas
          </h3>
          {sessions.length === 0 ? (
            <p className="text-xs text-gray-600 print:text-[10px]">
              Nenhuma sessão agendada para este mês.
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

        <section className="mb-4 print:mb-3">
          <h3 className="mb-2 border-b border-black pb-1 text-sm font-bold uppercase print:mb-1 print:text-xs">
            Aniversariantes do Mês
          </h3>
          <p className="mb-2 text-[10px] text-gray-600 print:mb-1 print:text-[9px]">
            Irmãos, aniversários maçônicos, cônjuges e filhos cadastrados na
            Secretaria.
          </p>
          {anniversaries.length === 0 ? (
            <p className="text-xs text-gray-600 print:text-[10px]">
              Nenhum aniversariante registrado para este mês.
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
