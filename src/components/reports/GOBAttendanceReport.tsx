import { useState, useRef } from 'react'
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
import { Printer, FileText, Download } from 'lucide-react'
import useChancellorStore from '@/stores/useChancellorStore'
import useReportStore from '@/stores/useReportStore'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useToast } from '@/hooks/use-toast'

export function GOBAttendanceReport() {
  const { events, sessionRecords, attendanceRecords, brothers, locations } =
    useChancellorStore()
  const { addHistory } = useReportStore()
  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const { toast } = useToast()

  const componentRef = useRef<HTMLDivElement>(null)

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
        // Find session record
        const record = sessionRecords.find(
          (r) => r.eventId === selectedEvent.id,
        )

        // Map all active brothers
        return brothers
          .filter((b) => b.status === 'Ativo')
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((brother) => {
            // Find status if record exists
            let status = 'Pendente'
            if (record) {
              const att = attendanceRecords.find(
                (ar) =>
                  ar.sessionRecordId === record.id &&
                  ar.brotherId === brother.id,
              )
              if (att) status = att.status
              else status = 'Ausente' // Default if record exists but no attendance entry
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
            className="border bg-white text-black shadow-lg mx-auto w-[210mm] min-h-[297mm] p-0"
            ref={componentRef}
            id="gob-report-container"
          >
            {/* Header */}
            <div className="p-8 border-b-2 border-black/10 text-center space-y-2">
              <h1 className="text-xl font-bold uppercase tracking-widest text-black">
                Grande Oriente do Brasil
              </h1>
              <h2 className="text-lg font-semibold text-black">
                ARLS Templários da Paz - Nº 1234
              </h2>
              <p className="text-sm text-gray-600">Oriente de Botucatu - SP</p>
              <div className="pt-4">
                <h3 className="text-2xl font-bold text-black border-2 border-black inline-block px-6 py-1 rounded-sm">
                  LISTA DE PRESENÇA
                </h3>
              </div>
            </div>

            {/* Event Details */}
            <div className="p-6 bg-gray-50 border-b border-gray-200 print:bg-transparent">
              <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                <div>
                  <span className="text-xs font-bold text-gray-500 uppercase block">
                    Natureza da Sessão
                  </span>
                  <span className="font-medium text-lg text-black">
                    {selectedEvent.title}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-500 uppercase block">
                    Data
                  </span>
                  <span className="font-medium text-lg capitalize text-black">
                    {format(
                      new Date(selectedEvent.date),
                      "EEEE, dd 'de' MMMM 'de' yyyy",
                      { locale: ptBR },
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-500 uppercase block">
                    Local
                  </span>
                  <span className="font-medium text-black">
                    {locationName || 'Templo Principal'}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-500 uppercase block">
                    Estatística
                  </span>
                  <span className="font-medium text-black">
                    {presentCount} Presentes de {totalCount} Irmãos (
                    {percentage}
                    %)
                  </span>
                </div>
              </div>
            </div>

            {/* Attendance Table */}
            <div className="p-6">
              <Table>
                <TableHeader>
                  <TableRow className="border-b-2 border-black">
                    <TableHead className="text-black font-bold w-[100px]">
                      CIM/ID
                    </TableHead>
                    <TableHead className="text-black font-bold">
                      Nome do Irmão
                    </TableHead>
                    <TableHead className="text-black font-bold w-[120px]">
                      Grau
                    </TableHead>
                    <TableHead className="text-black font-bold w-[120px]">
                      Status
                    </TableHead>
                    <TableHead className="text-black font-bold w-[200px]">
                      Assinatura
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {eventAttendance.map(({ brother, status }) => (
                    <TableRow
                      key={brother.id}
                      className="border-b border-gray-200"
                    >
                      <TableCell className="font-mono text-sm text-black">
                        {brother.id.padStart(6, '0')}
                      </TableCell>
                      <TableCell className="font-medium text-black">
                        {brother.name}
                      </TableCell>
                      <TableCell className="text-black">
                        {brother.degree}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`font-semibold ${
                            status === 'Presente'
                              ? 'text-black'
                              : status === 'Ausente'
                                ? 'text-gray-400'
                                : 'text-gray-600'
                          }`}
                        >
                          {status.toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell>
                        {status === 'Presente' ? (
                          <div className="border-b border-dotted border-gray-400 h-6 w-full"></div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">
                            -
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Footer Signatures */}
            <div className="p-8 mt-4 grid grid-cols-2 gap-16">
              <div className="text-center pt-8 border-t border-black text-black">
                <p className="font-bold">Venerável Mestre</p>
              </div>
              <div className="text-center pt-8 border-t border-black text-black">
                <p className="font-bold">Secretário / Chanceler</p>
              </div>
            </div>

            <div className="pb-4 text-center text-[10px] text-gray-400">
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
