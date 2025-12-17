import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useState } from 'react'
import { ptBR } from 'date-fns/locale'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Clock, MapPin } from 'lucide-react'
import useChancellorStore from '@/stores/useChancellorStore'

export default function Agenda() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const { events } = useChancellorStore()

  const selectedDateEvents = events.filter((event) => {
    if (!date) return false
    return event.date === format(date, 'yyyy-MM-dd')
  })

  // Determine days with events for modifiers
  const daysWithEvents = events.map(
    (event) => new Date(event.date + 'T12:00:00'),
  ) // Avoid timezone shift for display

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Agenda Integrada</h2>
        <p className="text-muted-foreground">
          Calendário centralizado de todas as sessões e eventos da loja.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Calendário</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              locale={ptBR}
              className="rounded-md border"
              modifiers={{
                hasEvent: daysWithEvents,
              }}
              modifiersStyles={{
                hasEvent: {
                  fontWeight: 'bold',
                  textDecoration: 'underline',
                  color: 'hsl(var(--primary))',
                },
              }}
            />
          </CardContent>
        </Card>

        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>
              Eventos do Dia {date ? format(date, 'dd/MM/yyyy') : ''}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDateEvents.length > 0 ? (
              <div className="space-y-4">
                {selectedDateEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex flex-col p-4 border rounded-lg bg-card/50 hover:bg-secondary/20 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-lg">{event.title}</h3>
                      <Badge>{event.type}</Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" /> {event.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" /> {event.location}
                      </span>
                    </div>
                    <p className="mt-3 text-sm">{event.description}</p>
                    {event.attendees > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Participantes esperados: {event.attendees}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <p>Nenhum evento agendado para este dia.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
