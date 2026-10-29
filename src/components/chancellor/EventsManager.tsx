import { useState } from 'react'
import useChancellorStore from '@/stores/useChancellorStore'
import { Event } from '@/lib/data'
import { EventDialog, type EventDialogSaveData } from './EventDialog'
import { useDialog } from '@/hooks/use-dialog'
import { useAsyncOperation } from '@/hooks/use-async-operation'
import { todayLocalISODate } from '@/lib/format-utils'
import { LodgeAgendaList } from './LodgeAgendaList'

export function EventsManager() {
  const { events, addEvent, updateEvent, deleteEvent } = useChancellorStore()
  const dialog = useDialog()
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)

  const saveOperation = useAsyncOperation(
    async (data: EventDialogSaveData) => {
      if (selectedEvent) {
        const saved = await updateEvent({ ...selectedEvent, ...data })
        if (!saved) throw new Error('Falha ao atualizar evento')
        return 'Evento atualizado com sucesso.'
      }
      const saved = await addEvent({ id: crypto.randomUUID(), ...data })
      if (!saved) throw new Error('Falha ao criar evento')
      return 'Evento criado com sucesso.'
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

  const handleSave = async (data: EventDialogSaveData) => {
    const result = await saveOperation.execute(data)
    if (result) dialog.closeDialog()
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
      <LodgeAgendaList
        events={events}
        today={todayLocalISODate()}
        onCreate={openNew}
        onEdit={openEdit}
        onDelete={(id) => {
          void deleteOperation.execute(id)
        }}
      />

      <EventDialog
        open={dialog.open}
        onOpenChange={dialog.onOpenChange}
        eventToEdit={selectedEvent}
        onSave={handleSave}
      />
    </div>
  )
}
