import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameDay,
  isToday,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { CalendarEvent } from './EventDetailsSheet'
import { ScrollArea } from '@/components/ui/scroll-area'

interface WeeklyCalendarProps {
  currentDate: Date
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
  onDateClick: (date: Date) => void
}

export function WeeklyCalendar({
  currentDate,
  events,
  onEventClick,
  onDateClick,
}: WeeklyCalendarProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 })
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 })

  const weekDays = eachDayOfInterval({
    start: weekStart,
    end: weekEnd,
  })

  const getEventsForDay = (day: Date) => {
    return events
      .filter((event) => {
        return isSameDay(new Date(event.date + 'T12:00:00'), day)
      })
      .sort((a, b) => {
        // Sort by time if available, otherwise push to top/bottom
        if (a.time && b.time) return a.time.localeCompare(b.time)
        return 0
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
      <div className="grid grid-cols-7 border-b bg-muted/40 divide-x">
        {weekDays.map((day) => (
          <div
            key={day.toString()}
            className={cn(
              'py-3 text-center flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors',
              isToday(day) && 'bg-primary/5',
            )}
            onClick={() => onDateClick(day)}
          >
            <span className="text-xs text-muted-foreground uppercase font-semibold">
              {format(day, 'EEE', { locale: ptBR })}
            </span>
            <span
              className={cn(
                'text-sm font-bold w-8 h-8 flex items-center justify-center rounded-full mt-1',
                isToday(day)
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground',
              )}
            >
              {format(day, 'd')}
            </span>
          </div>
        ))}
      </div>

      <ScrollArea className="flex-1">
        <div className="grid grid-cols-7 h-full min-h-[500px] divide-x">
          {weekDays.map((day) => {
            const dayEvents = getEventsForDay(day)
            return (
              <div
                key={day.toString()}
                className={cn(
                  'p-2 space-y-2 min-h-[100px]',
                  isToday(day) ? 'bg-primary/5' : 'bg-background',
                )}
                onClick={() => onDateClick(day)}
              >
                {dayEvents.length === 0 && (
                  <div className="h-full flex items-center justify-center pointer-events-none">
                    <span className="text-[10px] text-muted-foreground/30 font-medium">
                      Sem eventos
                    </span>
                  </div>
                )}
                {dayEvents.map((event) => (
                  <div
                    key={`${event.id}-${event.type}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      onEventClick(event)
                    }}
                    className={cn(
                      'text-xs p-2 rounded border shadow-sm cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md',
                      getTypeStyle(event.type),
                    )}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold line-clamp-2">
                        {event.title}
                      </span>
                      {event.time && (
                        <span className="opacity-80 text-[10px]">
                          {event.time}
                        </span>
                      )}
                      {event.location && (
                        <span className="opacity-70 text-[10px] truncate">
                          {event.location}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
