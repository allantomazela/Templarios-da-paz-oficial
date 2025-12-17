import { useState } from 'react'
import {
  format,
  addMonths,
  subMonths,
  isSameDay,
  setYear,
  getYear,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  Calendar as CalendarIcon,
  List,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
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

import useChancellorStore from '@/stores/useChancellorStore'
import { CalendarGrid } from '@/components/agenda/CalendarGrid'
import { AgendaEventDialog } from '@/components/agenda/AgendaEventDialog'
import {
  EventDetailsSheet,
  CalendarEvent,
} from '@/components/agenda/EventDetailsSheet'
import { useToast } from '@/hooks/use-toast'
import { Event } from '@/lib/data'

export default function Agenda() {
  const { events, brothers, addEvent, updateEvent, deleteEvent } =
    useChancellorStore()
  const { toast } = useToast()

  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'month' | 'day' | 'list'>('month')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  // Dialogs State
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
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

  // 1. Process standard events
  const standardEvents: CalendarEvent[] = events.map((e) => ({
    id: e.id,
    title: e.title,
    date: e.date, // YYYY-MM-DD
    time: e.time,
    type: e.type,
    description: e.description,
    location: e.location,
    originalEvent: e,
  }))

  // 2. Process Milestones (Birthdays & Masonic)
  const currentYear = getYear(currentDate)
  const milestoneEvents: CalendarEvent[] = []

  brothers.forEach((brother) => {
    // Birthdays
    if (brother.dob && filters.birthday) {
      // Create date for current year
      const dob = new Date(brother.dob) // Typically YYYY-MM-DD
      const birthdayThisYear = setYear(
        new Date(dob.getUTCFullYear(), dob.getUTCMonth(), dob.getUTCDate()),
        currentYear,
      )

      milestoneEvents.push({
        id: `dob-${brother.id}-${currentYear}`,
        title: `Aniversário: Ir. ${brother.name}`,
        date: format(birthdayThisYear, 'yyyy-MM-dd'),
        type: 'Aniversário',
        description: `Aniversário natalício do Irmão ${brother.name} (${brother.degree})`,
        brotherId: brother.id,
      })
    }

    // Initiation Anniversary
    if (brother.initiationDate && filters.masonic) {
      const init = new Date(brother.initiationDate)
      const initThisYear = setYear(
        new Date(init.getUTCFullYear(), init.getUTCMonth(), init.getUTCDate()),
        currentYear,
      )
      const years = currentYear - getYear(init)

      if (years > 0) {
        milestoneEvents.push({
          id: `init-${brother.id}-${currentYear}`,
          title: `Aniversário de Iniciação: Ir. ${brother.name}`,
          date: format(initThisYear, 'yyyy-MM-dd'),
          type: 'Maçônico',
          description: `Completando ${years} anos de vida maçônica.`,
          brotherId: brother.id,
        })
      }
    }
  })

  // Combine and Filter Events
  const allEvents = [...standardEvents, ...milestoneEvents].filter((e) => {
    if (e.type === 'Sessão' && !filters.session) return false
    if (e.type === 'Evento Social' && !filters.social) return false
    if (e.type === 'Reunião' && !filters.meeting) return false
    if (e.type === 'Outro' && !filters.meeting) return false
    return true
  })

  // --- Handlers ---

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1))

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    // If mobile or explicit day view preference, switch view?
    // For now, update selected date which updates side calendar or day view
    if (viewMode === 'month') {
      // Maybe open a small popover or just scroll?
      // Let's keep it simple: selectedDate is used for "New Event" default
    }
  }

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setIsDetailsOpen(true)
  }

  const handleCreateEvent = () => {
    setEventToEdit(null)
    setIsEventDialogOpen(true)
  }

  const handleSaveEvent = (data: any) => {
    if (eventToEdit) {
      updateEvent({ ...eventToEdit, ...data })
      toast({
        title: 'Evento Atualizado',
        description: 'As alterações foram salvas.',
      })
    } else {
      addEvent({ id: crypto.randomUUID(), ...data })
      toast({
        title: 'Evento Criado',
        description: 'Novo evento adicionado à agenda.',
      })
    }
    setIsEventDialogOpen(false)
  }

  const handleEditEventFromDetails = (event: CalendarEvent) => {
    setIsDetailsOpen(false)
    if (event.originalEvent) {
      setEventToEdit(event.originalEvent)
      setIsEventDialogOpen(true)
    }
  }

  const handleDeleteEvent = (id: string) => {
    // Check if it's a real event (not milestone)
    const isReal = events.some((e) => e.id === id)
    if (isReal) {
      deleteEvent(id)
      setIsDetailsOpen(false)
      toast({
        title: 'Evento Excluído',
        description: 'O evento foi removido da agenda.',
      })
    }
  }

  // Derived for Day View / List View
  const selectedDayEvents = allEvents.filter((e) =>
    isSameDay(new Date(e.date + 'T12:00:00'), selectedDate),
  )

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-4 rounded-lg border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-bold min-w-[200px] text-center capitalize">
              {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            </h2>
            <Button variant="outline" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
          >
            Hoje
          </Button>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* View Tabs */}
          <Tabs
            value={viewMode}
            onValueChange={(v: any) => setViewMode(v)}
            className="mr-auto md:mr-0"
          >
            <TabsList>
              <TabsTrigger value="month">
                <CalendarIcon className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Mês</span>
              </TabsTrigger>
              <TabsTrigger value="day">
                <List className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Dia</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

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

          <Button onClick={handleCreateEvent}>
            <Plus className="mr-2 h-4 w-4" /> Novo Evento
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1">
        {/* Sidebar / Mini Calendar & Day List */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Calendário Rápido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => d && setSelectedDate(d)}
                month={currentDate}
                onMonthChange={setCurrentDate}
                className="rounded-md border shadow-sm"
              />
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-sm border-b pb-1">
                Eventos em {format(selectedDate, 'dd/MM')}
              </h3>
              {selectedDayEvents.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Nenhum evento para este dia.
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedDayEvents.map((event) => (
                    <div
                      key={event.id}
                      onClick={() => handleEventClick(event)}
                      className="flex flex-col p-2 rounded bg-muted/30 hover:bg-muted cursor-pointer border text-sm"
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-medium truncate">
                          {event.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px] h-5">
                          {event.type}
                        </Badge>
                        {event.time && (
                          <span className="text-xs text-muted-foreground">
                            {event.time}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Calendar View */}
        <div className="lg:col-span-3 min-h-[600px] flex flex-col">
          <TabsContent value="month" className="mt-0 h-full">
            <CalendarGrid
              currentDate={currentDate}
              events={allEvents}
              onEventClick={handleEventClick}
              onDateClick={handleDateClick}
            />
          </TabsContent>

          <TabsContent value="day" className="mt-0 h-full">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>
                  Agenda do Dia {format(selectedDate, 'dd/MM/yyyy')}
                </CardTitle>
                <CardDescription>
                  Detalhamento dos eventos do dia.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedDayEvents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                    <CalendarIcon className="h-16 w-16 mb-4 opacity-20" />
                    <p>Nenhum evento agendado para hoje.</p>
                    <Button variant="link" onClick={handleCreateEvent}>
                      Adicionar Evento
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedDayEvents.map((event) => (
                      <div
                        key={event.id}
                        className="flex gap-4 p-4 border rounded-lg hover:bg-secondary/10 transition-colors"
                      >
                        <div className="flex flex-col items-center justify-center min-w-[80px] border-r pr-4">
                          <span className="text-xl font-bold">
                            {event.time || 'Dia'}
                          </span>
                          <span className="text-xs text-muted-foreground uppercase">
                            {event.type}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold">{event.title}</h3>
                          <p className="text-muted-foreground text-sm mt-1">
                            {event.description || 'Sem descrição.'}
                          </p>
                          {event.location && (
                            <p className="text-xs font-medium mt-2 flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-primary/50" />{' '}
                              {event.location}
                            </p>
                          )}
                        </div>
                        <div>
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
    </div>
  )
}
