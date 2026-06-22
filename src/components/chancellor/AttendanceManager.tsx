import { useState, useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Event, SessionRecord } from '@/lib/data'
import useChancellorStore from '@/stores/useChancellorStore'
import { AttendanceDialog } from './AttendanceDialog'
import { QRCheckinScanner } from './QRCheckinScanner'
import { CheckCircle, Clock, CalendarIcon, RefreshCw, QrCode } from 'lucide-react'
import {
  formatDateBR,
  getCalendarDateTimestamp,
} from '@/lib/format-utils'
import { useDialog } from '@/hooks/use-dialog'
import { useAsyncOperation } from '@/hooks/use-async-operation'
import { devLog } from '@/lib/logger'

export function AttendanceManager() {
  const { events, sessionRecords } = useChancellorStore()
  
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [selectedRecord, setSelectedRecord] = useState<SessionRecord | null>(
    null,
  )
  const dialog = useDialog()
  const scannerDialog = useDialog()
  // Debug: Log events count
  devLog(`AttendanceManager: Total de eventos no store: ${events.length}`)

  // Merge events from store with records using useMemo for reactivity
  const eventsWithStatus = useMemo(() => {
    devLog(`AttendanceManager: Processando ${events.length} eventos`)
    
    const merged = events.map((event) => {
      const record = sessionRecords.find((r) => r.eventId === event.id)
      return {
        event,
        record,
        status: record ? record.status : 'Pendente',
      }
    })

    // Sort by date descending, handling invalid dates
    merged.sort((a, b) => {
      try {
        const timeA = getCalendarDateTimestamp(a.event.date)
        const timeB = getCalendarDateTimestamp(b.event.date)
        if (!timeA || !timeB) return 0
        return timeB - timeA
      } catch (error) {
        devLog(`Erro ao ordenar eventos: ${error}`)
        return 0
      }
    })

    devLog(`AttendanceManager: Eventos processados: ${merged.length}`)
    return merged
  }, [events, sessionRecords])

  const saveOperation = useAsyncOperation(
    async () => 'As informações de presença foram atualizadas com sucesso.',
    {
      successMessage: 'Registro salvo com sucesso!',
      errorMessage: 'Falha ao salvar o registro.',
    },
  )

  const handleOpen = (event: Event, record?: SessionRecord) => {
    setSelectedEvent(event)
    setSelectedRecord(record || null)
    dialog.openDialog()
  }

  const handleSave = async () => {
    await saveOperation.execute()
  }

  const handleRefresh = () => {
    devLog(`AttendanceManager: Refresh manual - Total de eventos: ${events.length}`)
    // Force re-render by updating a dummy state
    setSelectedEvent(null)
  }

  const handleScannerSuccess = () => {
    // Lista atualiza ao reabrir a sessão no diálogo
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <QrCode className="h-5 w-5" />
            Registrar minha presença
          </CardTitle>
          <CardDescription>
            Escaneie o QR Code exibido no Templo (dentro de 50 m) para assinar a presença, ou peça ao Chanceler para assinar o livro.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => scannerDialog.openDialog()}>
            <QrCode className="mr-2 h-4 w-4" />
            Escanear QR Code da sessão
          </Button>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Controle de Presença</h3>
          <p className="text-sm text-muted-foreground">
            Registre a presença dos irmãos nos eventos da loja.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            {eventsWithStatus.length} evento{eventsWithStatus.length !== 1 ? 's' : ''}
          </Badge>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            title="Atualizar lista"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="hidden md:block rounded-md border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Evento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {eventsWithStatus.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <CalendarIcon className="h-12 w-12 text-muted-foreground opacity-50" />
                    <p className="text-sm font-medium text-muted-foreground">
                      Nenhum evento agendado
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Crie eventos na Agenda ou na seção "Agenda da Loja" para
                      registrar presença.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              eventsWithStatus.map(({ event, record, status }) => (
                <TableRow key={event.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      {formatDateBR(event.date)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{event.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {event.type}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        status === 'Finalizada' ? 'default' : 'secondary'
                      }
                      className={status === 'Finalizada' ? 'bg-green-600' : ''}
                    >
                      {status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant={status === 'Finalizada' ? 'outline' : 'default'}
                      onClick={() => handleOpen(event, record)}
                    >
                      {status === 'Finalizada' ? (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" /> Editar
                        </>
                      ) : (
                        <>
                          <Clock className="mr-2 h-4 w-4" /> Registrar
                        </>
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="md:hidden space-y-3">
        {eventsWithStatus.length === 0 ? (
          <div className="rounded-md border bg-card p-8 text-center">
            <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
            <p className="mt-2 text-sm font-medium text-muted-foreground">
              Nenhum evento agendado
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Crie eventos na Agenda ou em &quot;Agenda da Loja&quot; para registrar
              presença.
            </p>
          </div>
        ) : (
          eventsWithStatus.map(({ event, record, status }) => (
            <Card key={event.id} className="overflow-hidden">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium leading-tight">{event.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {event.type}
                    </p>
                  </div>
                  <Badge
                    variant={status === 'Finalizada' ? 'default' : 'secondary'}
                    className={status === 'Finalizada' ? 'bg-green-600 shrink-0' : 'shrink-0'}
                  >
                    {status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarIcon className="h-4 w-4" />
                  {formatDateBR(event.date)}
                </div>
                <Button
                  className="w-full"
                  size="sm"
                  variant={status === 'Finalizada' ? 'outline' : 'default'}
                  onClick={() => handleOpen(event, record)}
                >
                  {status === 'Finalizada' ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" /> Editar presença
                    </>
                  ) : (
                    <>
                      <Clock className="mr-2 h-4 w-4" /> Registrar presença
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <AttendanceDialog
        open={dialog.open}
        onOpenChange={dialog.onOpenChange}
        event={selectedEvent}
        existingSessionRecord={selectedRecord}
        onSave={handleSave}
      />

      <QRCheckinScanner
        open={scannerDialog.open}
        onOpenChange={scannerDialog.onOpenChange}
        onSuccess={handleScannerSuccess}
      />
    </div>
  )
}
