import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Event } from '@/lib/data'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { format } from 'date-fns'

const eventSchema = z.object({
  title: z.string().min(3, 'Título é obrigatório'),
  date: z.string().min(1, 'Data é obrigatória'),
  time: z.string().min(1, 'Hora é obrigatória'),
  type: z.enum(['Sessão', 'Reunião', 'Evento Social', 'Outro']),
  location: z.string().min(3, 'Local é obrigatório'),
  description: z.string().min(3, 'Descrição é obrigatória'),
  attendees: z.coerce.number().min(0, 'Número de participantes inválido'),
})

type EventFormValues = z.infer<typeof eventSchema>

interface AgendaEventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventToEdit: Event | null
  selectedDate?: Date
  onSave: (data: EventFormValues) => void
}

export function AgendaEventDialog({
  open,
  onOpenChange,
  eventToEdit,
  selectedDate,
  onSave,
}: AgendaEventDialogProps) {
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      date: '',
      time: '20:00',
      type: 'Sessão',
      location: 'Templo Principal',
      description: '',
      attendees: 0,
    },
  })

  useEffect(() => {
    if (eventToEdit) {
      form.reset({
        title: eventToEdit.title,
        date: eventToEdit.date,
        time: eventToEdit.time,
        type: eventToEdit.type,
        location: eventToEdit.location,
        description: eventToEdit.description,
        attendees: eventToEdit.attendees,
      })
    } else {
      form.reset({
        title: '',
        date: selectedDate
          ? format(selectedDate, 'yyyy-MM-dd')
          : format(new Date(), 'yyyy-MM-dd'),
        time: '20:00',
        type: 'Sessão',
        location: 'Templo Principal',
        description: '',
        attendees: 0,
      })
    }
  }, [eventToEdit, selectedDate, form, open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {eventToEdit ? 'Editar Evento' : 'Novo Evento na Agenda'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Sessão Ordinária" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Evento</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Sessão">Sessão</SelectItem>
                        <SelectItem value="Reunião">Reunião</SelectItem>
                        <SelectItem value="Evento Social">
                          Evento Social
                        </SelectItem>
                        <SelectItem value="Outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="attendees"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Participantes (Est.)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Local</FormLabel>
                  <FormControl>
                    <Input placeholder="Local do evento" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Detalhes do evento" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
