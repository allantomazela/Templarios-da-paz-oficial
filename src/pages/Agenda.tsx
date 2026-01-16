import { useState } from 'react'
import {
  format,
  addMonths,
  subMonths,
  isSameDay,
  setYear,
  getYear,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  parseISO,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  Calendar as CalendarIcon,
  List,
  LayoutGrid,
  MapPin,
  Clock,
  MoreVertical,
  CalendarDays,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import useAuthStore from '@/stores/useAuthStore'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

import useChancellorStore from '@/stores/useChancellorStore'
import { CalendarGrid } from '@/components/agenda/CalendarGrid'
import { WeeklyCalendar } from '@/components/agenda/WeeklyCalendar'
import { AgendaEventDialog } from '@/components/agenda/AgendaEventDialog'
import {
  EventDetailsSheet,
  CalendarEvent,
} from '@/components/agenda/EventDetailsSheet'
import { LocationManagerDialog } from '@/components/agenda/LocationManagerDialog'
import { useToast } from '@/hooks/use-toast'
import { logError, devLog } from '@/lib/logger'
import { Event } from '@/lib/data'
import { cn } from '@/lib/utils'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function Agenda() {
  const { events, brothers, addEvent, updateEvent, deleteEvent } =
    useChancellorStore()
  const { user } = useAuthStore()
  const userRole = user?.role || 'member'
  const canEdit = ['admin', 'editor'].includes(userRole)
  const { toast } = useToast()

  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  // Dialogs State
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [eventToEdit, setEventToEdit] = useState<Event | null>(null)

  // Filters State
  const [filters, setFilters] = useState({
    session: true,
    social: true,
    meeting: true,
    birthday: true,
    masonic: true,
  })

  // --- Data Processing ---

  const standardEvents: CalendarEvent[] = events.map((e) => ({
    id: e.id,
    title: e.title,
    date: e.date,
    time: e.time,
    type: e.type,
    description: e.description,
    location: e.location,
    originalEvent: e,
    ...e,
  }))

  const currentYear = getYear(currentDate)
  const milestoneEvents: CalendarEvent[] = []

  brothers.forEach((brother) => {
    if (brother.dob && filters.birthday) {
      const dob = new Date(brother.dob)
      if (!isNaN(dob.getTime())) {
        const birthdayThisYear = setYear(
          new Date(dob.getUTCFullYear(), dob.getUTCMonth(), dob.getUTCDate()),
          currentYear,
        )
        milestoneEvents.push({
          id: `dob-${brother.id}-${currentYear}`,
          title: `Aniv. Ir. ${brother.name}`,
          date: format(birthdayThisYear, 'yyyy-MM-dd'),
          type: 'Aniversário',
          description: `Aniversário natalício do Irmão ${brother.name} (${brother.degree})`,
          brotherId: brother.id,
        })
      }
    }

    if (brother.initiationDate && filters.masonic) {
      const init = new Date(brother.initiationDate)
      if (!isNaN(init.getTime())) {
        const initThisYear = setYear(
          new Date(
            init.getUTCFullYear(),
            init.getUTCMonth(),
            init.getUTCDate(),
          ),
          currentYear,
        )
        const years = currentYear - getYear(init)

        if (years > 0) {
          milestoneEvents.push({
            id: `init-${brother.id}-${currentYear}`,
            title: `Iniciação Ir. ${brother.name}`,
            date: format(initThisYear, 'yyyy-MM-dd'),
            type: 'Maçônico',
            description: `Completando ${years} anos de vida maçônica.`,
            brotherId: brother.id,
          })
        }
      }
    }
  })

  const allEvents = [...standardEvents, ...milestoneEvents].filter((e) => {
    if (e.type === 'Sessão' && !filters.session) return false
    if (e.type === 'Evento Social' && !filters.social) return false
    if (e.type === 'Reunião' && !filters.meeting) return false
    if (e.type === 'Outro' && !filters.meeting) return false
    return true
  })

  // --- Handlers ---

  const handlePrev = () => {
    if (viewMode === 'month') setCurrentDate(subMonths(currentDate, 1))
    if (viewMode === 'week') setCurrentDate(subWeeks(currentDate, 1))
    if (viewMode === 'day') setCurrentDate(subDays(currentDate, 1))
  }

  const handleNext = () => {
    if (viewMode === 'month') setCurrentDate(addMonths(currentDate, 1))
    if (viewMode === 'week') setCurrentDate(addWeeks(currentDate, 1))
    if (viewMode === 'day') setCurrentDate(addDays(currentDate, 1))
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    // If double click logic needed, could go here, but single click selects day for sidebar
  }

  const handleEventClick = (event: CalendarEvent) => {
    const fullEvent = event.originalEvent ? event.originalEvent : event
    setSelectedEvent(fullEvent)
    setIsDetailsOpen(true)
  }

  const handleCreateEvent = () => {
    setEventToEdit(null)
    setIsEventDialogOpen(true)
  }

  const handleSaveEvent = (data: any) => {
    try {
      if (eventToEdit) {
        updateEvent({ ...eventToEdit, ...data })
        devLog('Agenda: Evento atualizado:', { ...eventToEdit, ...data })
        toast({
          title: 'Evento Atualizado',
          description: 'As alterações foram salvas com sucesso.',
        })
      } else {
        const newEvent = { id: crypto.randomUUID(), ...data }
        addEvent(newEvent)
        devLog('Agenda: Novo evento criado:', newEvent)
        // Verificar se foi salvo corretamente
        setTimeout(() => {
          const currentEvents = useChancellorStore.getState().events
          devLog(`Agenda: Total de eventos após adicionar: ${currentEvents.length}`)
          devLog('Agenda: Último evento no store:', currentEvents[currentEvents.length - 1])
        }, 100)
        toast({
          title: 'Evento Criado',
          description: 'Novo evento adicionado à agenda.',
        })
      }
      setIsEventDialogOpen(false)
    } catch (error) {
      logError('Error saving event', error)
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível salvar o evento. Tente novamente.',
      })
    }
  }

  const handleEditEventFromDetails = (event: any) => {
    setIsDetailsOpen(false)
    if (
      event.id &&
      !event.id.startsWith('dob-') &&
      !event.id.startsWith('init-')
    ) {
      setEventToEdit(event)
      setIsEventDialogOpen(true)
    }
  }

  const handleDeleteEvent = (id: string) => {
    try {
      const isReal = events.some((e) => e.id === id)
      if (isReal) {
        deleteEvent(id)
        setIsDetailsOpen(false)
        toast({
          title: 'Evento Excluído',
          description: 'O evento foi removido da agenda.',
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Falha ao excluir o evento.',
      })
    }
  }

  const selectedDayEvents = allEvents
    .filter((e) => isSameDay(new Date(e.date + 'T12:00:00'), selectedDate))
    .sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'))

  const getHeaderTitle = () => {
    if (viewMode === 'day')
      return format(currentDate, "dd 'de' MMMM", { locale: ptBR })
    if (viewMode === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 })
      const end = endOfWeek(currentDate, { weekStartsOn: 0 })
      return `${format(start, 'dd MMM', { locale: ptBR })} - ${format(end, 'dd MMM', { locale: ptBR })}`
    }
    return format(currentDate, 'MMMM yyyy', { locale: ptBR })
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Sessão':
        return 'bg-blue-500'
      case 'Reunião':
        return 'bg-gray-500'
      case 'Evento Social':
        return 'bg-green-500'
      case 'Aniversário':
        return 'bg-yellow-500'
      case 'Maçônico':
        return 'bg-purple-500'
      default:
        return 'bg-primary'
    }
  }

  return (
    <Tabs
      value={viewMode}
      onValueChange={(v) => setViewMode(v as 'month' | 'week' | 'day')}
      className="flex flex-col h-[calc(100vh-8rem)]"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-4 rounded-lg border shadow-sm shrink-0 mb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={handlePrev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-bold min-w-[200px] text-center capitalize">
              {getHeaderTitle()}
            </h2>
            <Button variant="outline" size="icon" onClick={handleNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCurrentDate(new Date())
              setSelectedDate(new Date())
            }}
          >
            Hoje
          </Button>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <TabsList className="mr-auto md:mr-0">
            <TabsTrigger value="month">
              <CalendarIcon className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Mês</span>
            </TabsTrigger>
            <TabsTrigger value="week">
              <LayoutGrid className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Semana</span>
            </TabsTrigger>
            <TabsTrigger value="day">
              <List className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Dia</span>
            </TabsTrigger>
          </TabsList>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56" align="end">
              <div className="space-y-4">
                <h4 className="font-medium leading-none">
                  Filtros de Exibição
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="f-session"
                      checked={filters.session}
                      onCheckedChange={(c) =>
                        setFilters((p) => ({ ...p, session: !!c }))
                      }
                    />
                    <Label htmlFor="f-session">Sessões</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="f-meeting"
                      checked={filters.meeting}
                      onCheckedChange={(c) =>
                        setFilters((p) => ({ ...p, meeting: !!c }))
                      }
                    />
                    <Label htmlFor="f-meeting">Reuniões</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="f-social"
                      checked={filters.social}
                      onCheckedChange={(c) =>
                        setFilters((p) => ({ ...p, social: !!c }))
                      }
                    />
                    <Label htmlFor="f-social">Sociais</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="f-bday"
                      checked={filters.birthday}
                      onCheckedChange={(c) =>
                        setFilters((p) => ({ ...p, birthday: !!c }))
                      }
                    />
                    <Label htmlFor="f-bday">Aniversários</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="f-mas"
                      checked={filters.masonic}
                      onCheckedChange={(c) =>
                        setFilters((p) => ({ ...p, masonic: !!c }))
                      }
                    />
                    <Label htmlFor="f-mas">Maçônicos</Label>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsLocationDialogOpen(true)}
            title="Gerenciar Locais"
          >
            <MapPin className="h-4 w-4" />
          </Button>

          {canEdit && (
            <Button onClick={handleCreateEvent}>
              <Plus className="mr-2 h-4 w-4" /> Novo
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 overflow-hidden min-h-0">
        {/* Sidebar */}
        <div className="w-full lg:w-80 flex-shrink-0 flex flex-col bg-card border rounded-lg shadow-sm h-full overflow-hidden">
          <div className="p-4 flex justify-center border-b bg-muted/5">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => {
                if (d) {
                  setSelectedDate(d)
                  setCurrentDate(d)
                }
              }}
              month={currentDate}
              onMonthChange={setCurrentDate}
              className="rounded-md bg-background border shadow-sm"
              modifiers={{
                hasEvent: (date) =>
                  allEvents.some((e) =>
                    isSameDay(new Date(e.date + 'T12:00:00'), date),
                  ),
              }}
              modifiersClassNames={{
                hasEvent:
                  "after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-primary after:rounded-full",
              }}
            />
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            <div className="px-4 py-3 bg-muted/10 border-b flex justify-between items-center">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
              </h3>
              <Badge variant="secondary" className="text-xs">
                {selectedDayEvents.length} eventos
              </Badge>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-3 space-y-2">
                {selectedDayEvents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                      <Clock className="h-6 w-6 opacity-20" />
                    </div>
                    <p className="text-sm">Nenhum evento agendado</p>
                    <p className="text-xs opacity-60 mt-1">
                      Selecione outra data ou adicione um novo evento.
                    </p>
                  </div>
                ) : (
                  selectedDayEvents.map((event) => (
                    <div
                      key={event.id}
                      onClick={() => handleEventClick(event)}
                      className="group flex items-start gap-3 p-3 rounded-lg border border-transparent hover:border-border hover:bg-accent/50 transition-all cursor-pointer bg-card/50"
                    >
                      <div className="flex flex-col items-center min-w-[3rem] pt-0.5">
                        <span className="text-sm font-bold font-mono">
                          {event.time}
                        </span>
                        <div
                          className={cn(
                            'w-2 h-2 rounded-full mt-1.5 ring-2 ring-background',
                            getTypeColor(event.type),
                          )}
                        />
                      </div>
                      <div className="flex-1 min-w-0 border-l pl-3">
                        <h4 className="font-medium text-sm truncate leading-none mb-1.5">
                          {event.title}
                        </h4>
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Badge
                              variant="outline"
                              className="text-[10px] h-4 px-1 py-0"
                            >
                              {event.type}
                            </Badge>
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1 truncate">
                              <MapPin className="w-3 h-3 shrink-0" />
                              <span className="truncate">{event.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
            {canEdit && (
              <div className="p-3 border-t bg-muted/5">
                <Button
                  variant="outline"
                  className="w-full text-xs h-8"
                  onClick={handleCreateEvent}
                >
                  <Plus className="mr-2 h-3 w-3" /> Adicionar Evento no Dia
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-card border rounded-lg shadow-sm overflow-hidden flex flex-col h-full">
          <TabsContent value="month" className="mt-0 h-full">
            <ErrorBoundary>
              <CalendarGrid
                currentDate={currentDate}
                events={allEvents}
                onEventClick={handleEventClick}
                onDateClick={(date) => {
                  handleDateClick(date)
                  setViewMode('day')
                }}
              />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="week" className="mt-0 h-full">
            <ErrorBoundary>
              <WeeklyCalendar
                currentDate={currentDate}
                events={allEvents}
                onEventClick={handleEventClick}
                onDateClick={(date) => {
                  handleDateClick(date)
                  setViewMode('day')
                }}
              />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="day" className="mt-0 h-full">
            <ErrorBoundary>
              <Card className="h-full border-0 shadow-none">
                <CardHeader>
                  <CardTitle>
                    Agenda Detalhada -{' '}
                    {format(currentDate, 'dd/MM/yyyy', { locale: ptBR })}
                  </CardTitle>
                  <CardDescription>
                    Visão completa dos eventos e compromissos.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {allEvents.filter((e) =>
                    isSameDay(new Date(e.date + 'T12:00:00'), currentDate),
                  ).length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                      <CalendarIcon className="h-16 w-16 mb-4 opacity-20" />
                      <p>Nenhum evento agendado para este dia.</p>
                      {canEdit && (
                        <Button
                          variant="link"
                          onClick={handleCreateEvent}
                          className="mt-2"
                        >
                          Adicionar Evento
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {allEvents
                        .filter((e) =>
                          isSameDay(
                            new Date(e.date + 'T12:00:00'),
                            currentDate,
                          ),
                        )
                        .sort((a, b) =>
                          (a.time || '00:00').localeCompare(b.time || '00:00'),
                        )
                        .map((event) => (
                          <div
                            key={event.id}
                            className="flex gap-4 p-4 border rounded-lg hover:bg-secondary/10 transition-colors bg-card"
                          >
                            <div className="flex flex-col items-center justify-center min-w-[80px] border-r pr-4">
                              <span className="text-xl font-bold font-mono">
                                {event.time || '-'}
                              </span>
                              <span className="text-xs text-muted-foreground uppercase text-center mt-1">
                                {event.type}
                              </span>
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <h3 className="text-lg font-bold">
                                  {event.title}
                                </h3>
                                <div
                                  className={cn(
                                    'w-3 h-3 rounded-full',
                                    getTypeColor(event.type),
                                  )}
                                  title={event.type}
                                />
                              </div>
                              <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
                                {event.description || 'Sem descrição.'}
                              </p>
                              {event.location && (
                                <p className="text-xs font-medium mt-2 flex items-center gap-1 text-muted-foreground">
                                  <MapPin className="h-3 w-3" />{' '}
                                  {event.location}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col justify-center">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEventClick(event)}
                              >
                                Detalhes
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </ErrorBoundary>
          </TabsContent>
        </div>
      </div>

      <AgendaEventDialog
        open={isEventDialogOpen}
        onOpenChange={setIsEventDialogOpen}
        eventToEdit={eventToEdit}
        selectedDate={selectedDate}
        onSave={handleSaveEvent}
      />

      <EventDetailsSheet
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        event={selectedEvent}
        onEdit={handleEditEventFromDetails}
        onDelete={handleDeleteEvent}
      />

      <LocationManagerDialog
        open={isLocationDialogOpen}
        onOpenChange={setIsLocationDialogOpen}
      />
    </Tabs>
  )
}
