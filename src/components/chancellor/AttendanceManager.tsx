import { useState } from 'react'
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
import { mockEvents, Event, SessionRecord } from '@/lib/data'
import useChancellorStore from '@/stores/useChancellorStore'
import { AttendanceDialog } from './AttendanceDialog'
import { CheckCircle, Clock, CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { useToast } from '@/hooks/use-toast'

export function AttendanceManager() {
  const { sessionRecords } = useChancellorStore()
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [selectedRecord, setSelectedRecord] = useState<SessionRecord | null>(
    null,
  )
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()

  // Merge events with records
  const eventsWithStatus = mockEvents.map((event) => {
    const record = sessionRecords.find((r) => r.eventId === event.id)
    return {
      event,
      record,
      status: record ? record.status : 'Pendente',
    }
  })

  const handleOpen = (event: Event, record?: SessionRecord) => {
    setSelectedEvent(event)
    setSelectedRecord(record || null)
    setIsDialogOpen(true)
  }

  const handleSave = () => {
    toast({
      title: 'Registro Salvo',
      description: 'As informações de presença e tronco foram atualizadas.',
    })
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Evento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tronco (R$)</TableHead>
              <TableHead className="text-right">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {eventsWithStatus.map(({ event, record, status }) => (
              <TableRow key={event.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    {format(new Date(event.date), 'dd/MM/yyyy')}
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
                    variant={status === 'Finalizada' ? 'default' : 'secondary'}
                    className={status === 'Finalizada' ? 'bg-green-600' : ''}
                  >
                    {status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {record ? `R$ ${record.charityCollection.toFixed(2)}` : '-'}
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
            ))}
          </TableBody>
        </Table>
      </div>

      <AttendanceDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        event={selectedEvent}
        existingSessionRecord={selectedRecord}
        onSave={handleSave}
      />
    </div>
  )
}
