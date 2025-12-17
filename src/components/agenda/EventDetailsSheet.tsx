import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CalendarDays,
  MapPin,
  Users,
  Clock,
  Edit,
  Trash2,
  FileText,
  ListOrdered,
  Bell,
  Monitor,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import useChancellorStore from '@/stores/useChancellorStore'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Event } from '@/lib/data'

interface EventDetailsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: Event | null
  onEdit?: (event: any) => void
  onDelete?: (id: string) => void
}

export function EventDetailsSheet({
  open,
  onOpenChange,
  event,
  onEdit,
  onDelete,
}: EventDetailsSheetProps) {
  const { locations } = useChancellorStore()
  if (!event) return null

  // Ensure compatibility with CalendarEvent wrapper if necessary, but here assuming Event type
  const isMilestone =
    event.type === 'Aniversário' || (event as any).type === 'Maçônico'

  const locationDetails = locations.find((l) => l.id === event.locationId)

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Sessão':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200'
      case 'Reunião':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200'
      case 'Evento Social':
        return 'bg-green-100 text-green-800 hover:bg-green-100 border-green-200'
      case 'Aniversário':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200'
      case 'Maçônico':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-100 border-purple-200'
      default:
        return 'bg-secondary text-secondary-foreground'
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col h-full sm:max-w-md w-full p-0">
        <div className="p-6 pb-2 border-b">
          <SheetHeader className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge className={getTypeColor(event.type)} variant="outline">
                {event.type}
              </Badge>
            </div>
            <div>
              <SheetTitle className="text-2xl font-bold leading-tight">
                {event.title}
              </SheetTitle>
              <SheetDescription className="flex items-center gap-2 mt-2 text-base">
                <CalendarDays className="h-4 w-4" />
                {event.date &&
                  format(new Date(event.date), "dd 'de' MMMM 'de' yyyy", {
                    locale: ptBR,
                  })}
              </SheetDescription>
            </div>
          </SheetHeader>
        </div>

        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
            {event.time && (
              <div className="flex items-start gap-3">
                <div className="bg-secondary/20 p-2 rounded-md">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Horário</h4>
                  <p className="text-sm text-muted-foreground">{event.time}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <div className="bg-secondary/20 p-2 rounded-md">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-sm">Local</h4>
                <p className="text-sm font-medium">
                  {event.location || locationDetails?.name}
                </p>
                {locationDetails && (
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <p>Capacidade: {locationDetails.capacity} pessoas</p>
                    {locationDetails.equipment && (
                      <div className="flex items-center gap-1 mt-1">
                        <Monitor className="h-3 w-3" />
                        <span>{locationDetails.equipment}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {event.description && (
              <div className="flex items-start gap-3">
                <div className="bg-secondary/20 p-2 rounded-md">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm mb-1">
                    Descrição e Requisitos
                  </h4>
                  <div className="p-3 bg-muted/30 rounded-lg border text-sm leading-relaxed whitespace-pre-wrap">
                    {event.description}
                  </div>
                </div>
              </div>
            )}

            {!isMilestone && (
              <div className="flex items-center gap-3 p-4 border rounded-lg bg-secondary/5">
                <Users className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">
                  Participantes estimados:{' '}
                  <span className="font-bold">{event.attendees || 0}</span>
                </span>
              </div>
            )}

            {/* Timeline Section */}
            {event.timeline && event.timeline.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <ListOrdered className="h-4 w-4 text-primary" />
                  <h4 className="font-semibold text-sm">Minutário</h4>
                </div>
                <div className="relative border-l-2 border-muted ml-2 space-y-6 py-2">
                  {event.timeline
                    .sort((a, b) => a.time.localeCompare(b.time))
                    .map((item) => (
                      <div key={item.id} className="relative pl-6">
                        <div className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary border border-background" />
                        <span className="text-xs font-mono font-bold text-primary block mb-0.5">
                          {item.time}
                        </span>
                        <span className="text-sm font-medium">
                          {item.title}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Reminders Section */}
            {event.reminders && event.reminders.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Bell className="h-4 w-4 text-primary" />
                  <h4 className="font-semibold text-sm">
                    Lembretes Configurados
                  </h4>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {event.reminders.map((reminder) => (
                    <div
                      key={reminder.id}
                      className="flex items-center justify-between text-xs bg-muted/30 p-2 rounded"
                    >
                      <span>{reminder.minutesBefore} min antes</span>
                      <Badge variant="outline" className="text-[10px] h-5">
                        {reminder.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isMilestone && (event as any).brotherId && (
              <div className="flex flex-col items-center justify-center p-6 bg-secondary/10 rounded-lg border border-dashed">
                <Avatar className="w-24 h-24 mb-3 border-4 border-background shadow-sm">
                  <AvatarImage
                    src={`https://img.usecurling.com/ppl/medium?gender=male&seed=${(event as any).brotherId}`}
                    alt="Avatar"
                  />
                  <AvatarFallback className="text-xl bg-muted">
                    Ir
                  </AvatarFallback>
                </Avatar>
                <p className="text-sm font-medium">Irmão da Loja</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {!isMilestone && (
          <SheetFooter className="p-6 border-t mt-auto flex flex-col sm:flex-row gap-3 sm:gap-2">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => onEdit?.(event)}
            >
              <Edit className="mr-2 h-4 w-4" /> Editar
            </Button>
            <Button
              variant="destructive"
              className="w-full sm:w-auto"
              onClick={() => onDelete?.(event.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Excluir
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}
