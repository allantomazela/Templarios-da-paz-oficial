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
import { Input } from '@/components/ui/input'
import { Plus, Search, Pencil, Trash2 } from 'lucide-react'
import useChancellorStore from '@/stores/useChancellorStore'
import { Event } from '@/lib/data'
import { EventDialog } from './EventDialog'
import { format, parseISO } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { useDialog } from '@/hooks/use-dialog'
import { useAsyncOperation } from '@/hooks/use-async-operation'

export function EventsManager() {
  const { events, addEvent, updateEvent, deleteEvent } = useChancellorStore()
  const [searchTerm, setSearchTerm] = useState('')
  const dialog = useDialog()
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)

  const filteredEvents = events.filter((event) =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const saveOperation = useAsyncOperation(
    async (data: any) => {
      if (selectedEvent) {
        updateEvent({ ...selectedEvent, ...data })
        return 'Evento atualizado com sucesso.'
      } else {
        addEvent({ id: crypto.randomUUID(), ...data })
        return 'Evento criado com sucesso.'
      }
    },
    {
      successMessage: 'Operação realizada com sucesso!',
      errorMessage: 'Falha ao salvar o evento.',
    },
  )

  const deleteOperation = useAsyncOperation(
    async (id: string) => {
      deleteEvent(id)
      return 'Evento removido.'
    },
    {
      successMessage: 'Evento removido com sucesso!',
      errorMessage: 'Falha ao remover o evento.',
    },
  )

  const handleSave = async (data: any) => {
    const result = await saveOperation.execute(data)
    if (result) {
      dialog.closeDialog()
    }
  }

  const handleDelete = (id: string) => {
    deleteOperation.execute(id)
  }

  const openNew = () => {
    setSelectedEvent(null)
    dialog.openDialog()
  }

  const openEdit = (event: Event) => {
    setSelectedEvent(event)
    dialog.openDialog()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar eventos..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" /> Novo Evento / Sessão
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Hora</TableHead>
              <TableHead>Evento</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Local</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEvents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Nenhum evento encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>
                    {format(parseISO(event.date), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell>{event.time}</TableCell>
                  <TableCell className="font-medium">{event.title}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{event.type}</Badge>
                  </TableCell>
                  <TableCell>{event.location}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(event)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(event.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <EventDialog
        open={dialog.open}
        onOpenChange={dialog.onOpenChange}
        eventToEdit={selectedEvent}
        onSave={handleSave}
      />
    </div>
  )
}
