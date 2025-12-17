import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { CalendarEvent } from './EventDetailsSheet'
import { Badge } from '@/components/ui/badge'

interface CalendarGridProps {
  currentDate: Date
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
  onDateClick: (date: Date) => void
}

export function CalendarGrid({
  currentDate,
  events,
  onEventClick,
  onDateClick,
}: CalendarGridProps) {
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  })

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  const getEventsForDay = (day: Date) => {
    return events.filter((event) => {
      // Handle simple date string comparison
      // If event.date is YYYY-MM-DD
      return isSameDay(new Date(event.date + 'T12:00:00'), day)
    })
  }

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'Sessão':
        return 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200'
      case 'Reunião':
        return 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200'
      case 'Evento Social':
        return 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200'
      case 'Aniversário':
        return 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-200'
      case 'Maçônico':
        return 'bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200'
      default:
        return 'bg-secondary text-secondary-foreground'
    }
  }

  return (
    <div className="flex flex-col h-full border rounded-lg overflow-hidden bg-background shadow-sm">
      {/* Header Week Days */}
      <div className="grid grid-cols-7 border-b bg-muted/40">
        {weekDays.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 grid-rows-5 md:grid-rows-auto flex-1 auto-rows-fr">
        {calendarDays.map((day, dayIdx) => {
          const dayEvents = getEventsForDay(day)
          const isCurrentMonth = isSameMonth(day, monthStart)

          return (
            <div
              key={day.toString()}
              onClick={() => onDateClick(day)}
              className={cn(
                'min-h-[100px] md:min-h-[120px] p-2 border-b border-r relative transition-colors cursor-pointer group',
                !isCurrentMonth && 'bg-muted/10 text-muted-foreground',
                isToday(day) && 'bg-primary/5',
                dayIdx % 7 === 6 && 'border-r-0', // Remove right border for last col
                'hover:bg-accent/50',
              )}
            >
              <div className="flex justify-between items-start">
                <span
                  className={cn(
                    'text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full',
                    isToday(day)
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground',
                  )}
                >
                  {format(day, 'd')}
                </span>
                {dayEvents.length > 0 && (
                  <span className="md:hidden text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                    {dayEvents.length}
                  </span>
                )}
              </div>

              {/* Events List (Desktop) */}
              <div className="mt-1 space-y-1 hidden md:block overflow-y-auto max-h-[90px] no-scrollbar">
                {dayEvents.map((event) => (
                  <div
                    key={`${event.id}-${event.type}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      onEventClick(event)
                    }}
                    className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded border truncate cursor-pointer transition-all hover:scale-[1.02]',
                      getTypeStyle(event.type),
                    )}
                    title={event.title}
                  >
                    {event.time && (
                      <span className="opacity-75 mr-1">{event.time}</span>
                    )}
                    <span className="font-medium">{event.title}</span>
                  </div>
                ))}
              </div>

              {/* Mobile Indicator (Dots) */}
              <div className="mt-2 flex flex-wrap gap-1 md:hidden justify-center">
                {dayEvents.slice(0, 4).map((event, i) => (
                  <div
                    key={i}
                    className={cn(
                      'w-1.5 h-1.5 rounded-full',
                      event.type === 'Sessão'
                        ? 'bg-blue-500'
                        : event.type === 'Aniversário'
                          ? 'bg-yellow-500'
                          : 'bg-gray-400',
                    )}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
