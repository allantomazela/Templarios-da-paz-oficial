import { useState, useMemo, useEffect } from 'react'
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
import { Event, SessionRecord } from '@/lib/data'
import useChancellorStore from '@/stores/useChancellorStore'
import { AttendanceDialog } from './AttendanceDialog'
import { CheckCircle, Clock, CalendarIcon, RefreshCw } from 'lucide-react'
import { format, parseISO, isValid } from 'date-fns'
import { useDialog } from '@/hooks/use-dialog'
import { useAsyncOperation } from '@/hooks/use-async-operation'
import { devLog } from '@/lib/logger'

export function AttendanceManager() {
  // Usar seletores específicos para garantir reatividade do Zustand
  const events = useChancellorStore((state) => state.events)
  const sessionRecords = useChancellorStore((state) => state.sessionRecords)
  
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [selectedRecord, setSelectedRecord] = useState<SessionRecord | null>(
    null,
  )
  const dialog = useDialog()
  const [refreshKey, setRefreshKey] = useState(0)

  // Força re-render quando eventos mudam
  useEffect(() => {
    devLog(`AttendanceManager: Eventos mudaram - Total: ${events.length}`)
    setRefreshKey((prev) => prev + 1)
  }, [events.length])

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
        const dateA = parseISO(a.event.date)
        const dateB = parseISO(b.event.date)
        
        if (!isValid(dateA) || !isValid(dateB)) {
          return 0
        }
        
        return dateB.getTime() - dateA.getTime()
      } catch (error) {
        devLog(`Erro ao ordenar eventos: ${error}`)
        return 0
      }
    })

    devLog(`AttendanceManager: Eventos processados: ${merged.length}`)
    return merged
  }, [events, sessionRecords, refreshKey])

  const saveOperation = useAsyncOperation(
    async () => {
      return 'As informações de presença e tronco foram atualizadas com sucesso.'
    },
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

  return (
    <div className="space-y-4">
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

      <div className="rounded-md border bg-card">
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
                      {format(parseISO(event.date), 'dd/MM/yyyy')}
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

      <AttendanceDialog
        open={dialog.open}
        onOpenChange={dialog.onOpenChange}
        event={selectedEvent}
        existingSessionRecord={selectedRecord}
        onSave={handleSave}
      />
    </div>
  )
}
