import { useState, useRef, useEffect } from 'react'
import { useReactToPrint } from 'react-to-print'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { FileText, Download } from 'lucide-react'
import useChancellorStore from '@/stores/useChancellorStore'
import useReportStore from '@/stores/useReportStore'
import { useLodgePositionsStore } from '@/stores/useLodgePositionsStore'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useToast } from '@/hooks/use-toast'
import { ReportHeader } from './ReportHeader'

export function GOBAttendanceReport() {
  const { events, sessionRecords, attendanceRecords, brothers, locations } =
    useChancellorStore()
  const { addHistory } = useReportStore()
  const { positions, fetchPositions } = useLodgePositionsStore()
  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const { toast } = useToast()

  const componentRef = useRef<HTMLDivElement>(null)

  // Buscar cargos ao montar o componente
  useEffect(() => {
    fetchPositions()
  }, [fetchPositions])

  // Obter nomes do Venerável Mestre e Chanceler
  const venerableMaster = positions.find(
    (p) => p.position_type === 'veneravel_mestre'
  )?.user?.full_name || 'Venerável Mestre'

  const chancellor = positions.find(
    (p) => p.position_type === 'chanceler'
  )?.user?.full_name || 'Chanceler'

  const selectedEvent = events.find((e) => e.id === selectedEventId)

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Relatorio_GOB_${selectedEvent?.date || 'unknown'}`,
    onAfterPrint: () => {
      addHistory({
        id: crypto.randomUUID(),
        title: `Relatório GOB - ${selectedEvent?.title}`,
        date: new Date().toISOString(),
        templateName: 'Modelo Oficial GOB',
        type: 'GOB',
      })
      toast({
        title: 'Sucesso',
        description:
          'Relatório enviado para impressão/PDF e salvo no histórico.',
      })
    },
  })

  // Get attendance data for the selected event
  const eventAttendance = selectedEvent
    ? (() => {
        const record = sessionRecords.find(
          (r) => r.eventId === selectedEvent.id,
        )

        return brothers
          .filter((b) => b.status === 'Ativo')
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((brother) => {
            let status = 'Pendente'
            if (record) {
              const att = attendanceRecords.find(
                (ar) =>
                  ar.sessionRecordId === record.id &&
                  ar.brotherId === brother.id,
              )
              if (att) status = att.status
              else status = 'Ausente'
            }

            return {
              brother,
              status,
            }
          })
      })()
    : []

  const locationName = selectedEvent?.locationId
    ? locations.find((l) => l.id === selectedEvent.locationId)?.name
    : selectedEvent?.location

  const presentCount = eventAttendance.filter(
    (a) => a.status === 'Presente',
  ).length
  const totalCount = eventAttendance.length
  const percentage =
    totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0

  return (
    <div className="space-y-6">
      <Card className="no-print">
        <CardHeader>
          <CardTitle>Relatório de Presença (Modelo GOB)</CardTitle>
          <CardDescription>
            Gere relatórios oficiais de presença para submissão ao Grande
            Oriente do Brasil.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="space-y-2 flex-1 w-full">
              <label className="text-sm font-medium">
                Selecione a Sessão/Evento
              </label>
              <Select
                value={selectedEventId}
                onValueChange={setSelectedEventId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um evento..." />
                </SelectTrigger>
                <SelectContent>
                  {events
                    .sort(
                      (a, b) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime(),
                    )
                    .map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        {format(new Date(event.date), 'dd/MM/yyyy')} -{' '}
                        {event.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => handlePrint()}
              disabled={!selectedEventId}
              className="w-full md:w-auto"
            >
              <Download className="mr-2 h-4 w-4" /> Exportar PDF / Imprimir
            </Button>
          </div>
        </CardContent>
      </Card>

      {selectedEvent ? (
        <div className="overflow-auto bg-gray-100 p-4 rounded-lg border shadow-inner">
          <div
            className="border bg-white text-black shadow-lg mx-auto w-[210mm] min-h-[297mm] p-8 print:p-0"
            ref={componentRef}
            id="gob-report-container"
          >
            {/* Cabeçalho GOB */}
            <ReportHeader
              title="LISTA DE PRESENÇA"
              subtitle={`Sessão de ${format(new Date(selectedEvent.date), 'dd/MM/yyyy')}`}
            />

            {/* Event Details - Formato GOB Compacto */}
            <div className="mb-3 print:mb-2 pb-2 print:pb-1 border-b border-gray-400 print:border-black">
              <div className="grid grid-cols-2 gap-x-6 print:gap-x-4 gap-y-2 print:gap-y-1">
                <div>
                  <span className="text-[10px] print:text-[9px] font-bold text-gray-600 print:text-black uppercase block mb-0.5 print:mb-0">
                    Natureza da Sessão
                  </span>
                  <span className="text-sm print:text-xs font-semibold text-black">
                    {selectedEvent.title}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] print:text-[9px] font-bold text-gray-600 print:text-black uppercase block mb-0.5 print:mb-0">
                    Data
                  </span>
                  <span className="text-sm print:text-xs font-semibold text-black">
                    {format(
                      new Date(selectedEvent.date),
                      "dd 'de' MMMM 'de' yyyy",
                      { locale: ptBR },
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] print:text-[9px] font-bold text-gray-600 print:text-black uppercase block mb-0.5 print:mb-0">
                    Local
                  </span>
                  <span className="text-sm print:text-xs font-semibold text-black">
                    {locationName || 'Templo Principal'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] print:text-[9px] font-bold text-gray-600 print:text-black uppercase block mb-0.5 print:mb-0">
                    Estatística
                  </span>
                  <span className="text-sm print:text-xs font-semibold text-black">
                    {presentCount} Presentes de {totalCount} Irmãos ({percentage}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Attendance Table - Formato GOB */}
            <div className="mt-4 print:mt-2">
              <Table>
                <TableHeader>
                  <TableRow className="border-b-2 border-black">
                    <TableHead className="text-black font-bold text-xs print:text-[10px] py-2 print:py-1 text-center w-[60px] print:w-[50px]">
                      Nº
                    </TableHead>
                    <TableHead className="text-black font-bold text-xs print:text-[10px] py-2 print:py-1">
                      Nome do Irmão
                    </TableHead>
                    <TableHead className="text-black font-bold text-xs print:text-[10px] py-2 print:py-1 text-center w-[100px] print:w-[80px]">
                      Grau
                    </TableHead>
                    <TableHead className="text-black font-bold text-xs print:text-[10px] py-2 print:py-1 text-center w-[80px] print:w-[70px]">
                      Status
                    </TableHead>
                    <TableHead className="text-black font-bold text-xs print:text-[10px] py-2 print:py-1 text-center w-[180px] print:w-[150px]">
                      Assinatura
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {eventAttendance.map(({ brother, status }, index) => (
                    <TableRow
                      key={brother.id}
                      className="border-b border-gray-300 print:border-gray-400"
                    >
                      <TableCell className="text-center text-xs print:text-[10px] text-black font-medium py-1.5 print:py-1">
                        {index + 1}
                      </TableCell>
                      <TableCell className="text-xs print:text-[10px] text-black py-1.5 print:py-1 font-medium">
                        {brother.name}
                      </TableCell>
                      <TableCell className="text-center text-xs print:text-[10px] text-black py-1.5 print:py-1">
                        {brother.degree}
                      </TableCell>
                      <TableCell className="text-center py-1.5 print:py-1">
                        <span
                          className={`text-xs print:text-[10px] font-bold ${
                            status === 'Presente'
                              ? 'text-black'
                              : status === 'Ausente'
                                ? 'text-gray-400'
                                : 'text-gray-600'
                          }`}
                        >
                          {status === 'Presente' ? 'P' : status === 'Ausente' ? 'A' : 'J'}
                        </span>
                      </TableCell>
                      <TableCell className="py-1.5 print:py-1">
                        <div className="border-b-2 border-dotted border-gray-600 print:border-black h-12 print:h-10 w-full flex flex-col justify-end">
                          <span className="text-[9px] print:text-[8px] text-gray-500 print:text-black mb-1 print:mb-0.5 leading-tight block">
                            {brother.name}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Footer Signatures - Formato GOB */}
            <div className="mt-10 print:mt-6 grid grid-cols-2 gap-12 print:gap-8 page-break-inside-avoid">
              <div className="text-center">
                <div className="border-t-2 border-black pt-3 print:pt-2 mt-20 print:mt-16 min-h-[60px] print:min-h-[50px]">
                  <p className="text-sm print:text-xs font-bold text-black mb-1 print:mb-0.5">
                    {venerableMaster}
                  </p>
                  <p className="text-xs print:text-[10px] text-black font-semibold uppercase">
                    Venerável Mestre
                  </p>
                </div>
              </div>
              <div className="text-center">
                <div className="border-t-2 border-black pt-3 print:pt-2 mt-20 print:mt-16 min-h-[60px] print:min-h-[50px]">
                  <p className="text-sm print:text-xs font-bold text-black mb-1 print:mb-0.5">
                    {chancellor}
                  </p>
                  <p className="text-xs print:text-[10px] text-black font-semibold uppercase">
                    Chanceler
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 print:mt-4 pt-3 print:pt-2 border-t text-center text-[10px] print:text-[9px] text-gray-400">
              Gerado eletronicamente em {format(new Date(), 'dd/MM/yyyy HH:mm')}{' '}
              • Sistema Templários da Paz
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg bg-muted/10 text-muted-foreground">
          <FileText className="h-12 w-12 mb-4 opacity-20" />
          <h3 className="text-lg font-medium">Nenhum evento selecionado</h3>
          <p className="text-sm">
            Selecione um evento acima para visualizar o relatório de presença.
          </p>
        </div>
      )}
    </div>
  )
}
