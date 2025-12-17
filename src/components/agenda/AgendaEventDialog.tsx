import { useEffect, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import useChancellorStore from '@/stores/useChancellorStore'
import {
  Plus,
  Trash2,
  AlertCircle,
  Clock,
  MapPin,
  Calendar,
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'

const eventSchema = z.object({
  title: z.string().min(3, 'Título é obrigatório'),
  date: z.string().min(1, 'Data é obrigatória'),
  time: z.string().min(1, 'Hora é obrigatória'),
  type: z.enum(['Sessão', 'Reunião', 'Evento Social', 'Outro']),
  locationId: z.string().min(1, 'Local é obrigatório'),
  description: z.string().min(3, 'Descrição é obrigatória'),
  attendees: z.coerce.number().min(0, 'Número de participantes inválido'),
  timeline: z
    .array(
      z.object({
        time: z.string().min(1, 'Hora necessária'),
        title: z.string().min(1, 'Título necessário'),
      }),
    )
    .optional(),
  reminders: z
    .array(
      z.object({
        type: z.enum(['notification', 'email']),
        minutesBefore: z.coerce.number().min(1),
      }),
    )
    .optional(),
})

type EventFormValues = z.infer<typeof eventSchema>

interface AgendaEventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventToEdit: Event | null
  selectedDate?: Date
  onSave: (data: any) => void
}

export function AgendaEventDialog({
  open,
  onOpenChange,
  eventToEdit,
  selectedDate,
  onSave,
}: AgendaEventDialogProps) {
  const { locations, events } = useChancellorStore()
  const [conflictWarning, setConflictWarning] = useState<string | null>(null)

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      date: '',
      time: '20:00',
      type: 'Sessão',
      locationId: '',
      description: '',
      attendees: 0,
      timeline: [],
      reminders: [],
    },
  })

  const {
    fields: timelineFields,
    append: appendTimeline,
    remove: removeTimeline,
  } = useFieldArray({
    control: form.control,
    name: 'timeline',
  })

  const {
    fields: reminderFields,
    append: appendReminder,
    remove: removeReminder,
  } = useFieldArray({
    control: form.control,
    name: 'reminders',
  })

  useEffect(() => {
    if (open) {
      if (eventToEdit) {
        // Try to match legacy location text to an ID if possible, otherwise use existing ID
        let locId = eventToEdit.locationId || ''
        if (!locId && eventToEdit.location) {
          const found = locations.find((l) => l.name === eventToEdit.location)
          if (found) locId = found.id
        }

        form.reset({
          title: eventToEdit.title,
          date: eventToEdit.date,
          time: eventToEdit.time,
          type: eventToEdit.type,
          locationId: locId || (locations[0]?.id ?? ''),
          description: eventToEdit.description,
          attendees: eventToEdit.attendees,
          timeline: eventToEdit.timeline || [],
          reminders: eventToEdit.reminders || [],
        })
      } else {
        form.reset({
          title: '',
          date: selectedDate
            ? format(selectedDate, 'yyyy-MM-dd')
            : format(new Date(), 'yyyy-MM-dd'),
          time: '20:00',
          type: 'Sessão',
          locationId: locations[0]?.id ?? '',
          description: '',
          attendees: 0,
          timeline: [],
          reminders: [],
        })
      }
    }
  }, [eventToEdit, selectedDate, form, open, locations])

  // Conflict Checking
  const checkConflict = () => {
    const date = form.getValues('date')
    const time = form.getValues('time')
    const locId = form.getValues('locationId')

    if (!date || !time || !locId) {
      setConflictWarning(null)
      return
    }

    // Basic check: same location on same date (ignoring time duration logic for simplicity, just start time proximity)
    const conflicts = events.filter(
      (e) =>
        e.id !== eventToEdit?.id &&
        e.date === date &&
        (e.locationId === locId ||
          e.location === locations.find((l) => l.id === locId)?.name) &&
        Math.abs(
          parseInt(e.time.replace(':', '')) - parseInt(time.replace(':', '')),
        ) < 200, // Roughly 2 hours overlap check logic simplified
    )

    if (conflicts.length > 0) {
      setConflictWarning(
        `Conflito detectado: ${conflicts[0].title} está agendado neste local e horário próximo.`,
      )
    } else {
      setConflictWarning(null)
    }
  }

  const handleFormChange = () => {
    checkConflict()
  }

  const handleSubmit = (data: EventFormValues) => {
    // Resolve location Name from ID for legacy support/display
    const loc = locations.find((l) => l.id === data.locationId)
    const formattedData = {
      ...data,
      location: loc ? loc.name : 'Local Indefinido',
      locationId: data.locationId,
    }
    onSave(formattedData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>
            {eventToEdit ? 'Editar Evento' : 'Novo Evento na Agenda'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-col flex-1 overflow-hidden"
            onChange={handleFormChange}
          >
            <ScrollArea className="flex-1 px-6">
              <div className="space-y-6 pb-6">
                <Tabs defaultValue="details" className="w-full">
                  <TabsList className="w-full justify-start">
                    <TabsTrigger value="details">Detalhes</TabsTrigger>
                    <TabsTrigger value="timeline">Minutário</TabsTrigger>
                    <TabsTrigger value="reminders">Lembretes</TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="space-y-4 mt-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título do Evento</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex: Sessão Ordinária"
                              {...field}
                            />
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
                        name="locationId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Local</FormLabel>
                            <Select
                              onValueChange={(val) => {
                                field.onChange(val)
                                checkConflict()
                              }}
                              defaultValue={field.value}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o local" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {locations.map((loc) => (
                                  <SelectItem key={loc.id} value={loc.id}>
                                    {loc.name} ({loc.capacity} lug.)
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {conflictWarning && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Atenção</AlertTitle>
                        <AlertDescription>{conflictWarning}</AlertDescription>
                      </Alert>
                    )}

                    <FormField
                      control={form.control}
                      name="attendees"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Participantes (Estimado)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
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
                          <FormLabel>Descrição e Requisitos</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Detalhes, trajes, requisitos, etc."
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>

                  <TabsContent value="timeline" className="space-y-4 mt-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-medium">
                        Cronograma do Evento
                      </h4>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => appendTimeline({ time: '', title: '' })}
                      >
                        <Plus className="mr-2 h-3 w-3" /> Adicionar Item
                      </Button>
                    </div>

                    {timelineFields.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground border border-dashed rounded-md">
                        Nenhum item no minutário.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {timelineFields.map((field, index) => (
                          <div
                            key={field.id}
                            className="flex gap-2 items-start"
                          >
                            <FormField
                              control={form.control}
                              name={`timeline.${index}.time`}
                              render={({ field }) => (
                                <FormItem className="w-24">
                                  <FormControl>
                                    <Input
                                      type="time"
                                      placeholder="Hora"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`timeline.${index}.title`}
                              render={({ field }) => (
                                <FormItem className="flex-1">
                                  <FormControl>
                                    <Input
                                      placeholder="Descrição da atividade"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeTimeline(index)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="reminders" className="space-y-4 mt-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-medium">
                        Configuração de Lembretes
                      </h4>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          appendReminder({
                            type: 'notification',
                            minutesBefore: 30,
                          })
                        }
                      >
                        <Plus className="mr-2 h-3 w-3" /> Adicionar Lembrete
                      </Button>
                    </div>

                    {reminderFields.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground border border-dashed rounded-md">
                        Nenhum lembrete configurado.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {reminderFields.map((field, index) => (
                          <div
                            key={field.id}
                            className="flex gap-2 items-center border p-3 rounded-md bg-secondary/10"
                          >
                            <FormField
                              control={form.control}
                              name={`reminders.${index}.minutesBefore`}
                              render={({ field }) => (
                                <FormItem className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <Label className="text-xs font-normal">
                                      Minutos antes
                                    </Label>
                                  </div>
                                  <FormControl>
                                    <Input type="number" min="1" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`reminders.${index}.type`}
                              render={({ field }) => (
                                <FormItem className="w-40">
                                  <Label className="text-xs font-normal">
                                    Via
                                  </Label>
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="notification">
                                        Notificação App
                                      </SelectItem>
                                      <SelectItem value="email">
                                        Email
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeReminder(index)}
                              className="self-end mb-0.5 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </ScrollArea>
            <DialogFooter className="px-6 py-4 border-t bg-muted/10">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Salvar Evento</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
