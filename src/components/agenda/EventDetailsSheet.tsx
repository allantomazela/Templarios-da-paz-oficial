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
import { CalendarDays, MapPin, Users, Clock, Edit, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export interface CalendarEvent {
  id: string
  title: string
  date: string
  time?: string
  type: string
  description?: string
  location?: string
  brotherId?: string
  originalEvent?: any
}

interface EventDetailsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: CalendarEvent | null
  onEdit?: (event: CalendarEvent) => void
  onDelete?: (id: string) => void
}

export function EventDetailsSheet({
  open,
  onOpenChange,
  event,
  onEdit,
  onDelete,
}: EventDetailsSheetProps) {
  if (!event) return null

  const isMilestone = event.type === 'Aniversário' || event.type === 'Maçônico'

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Sessão':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100'
      case 'Reunião':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100'
      case 'Evento Social':
        return 'bg-green-100 text-green-800 hover:bg-green-100'
      case 'Aniversário':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
      case 'Maçônico':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-100'
      default:
        return 'bg-secondary text-secondary-foreground'
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-md">
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
              {format(new Date(event.date), "dd 'de' MMMM 'de' yyyy", {
                locale: ptBR,
              })}
            </SheetDescription>
          </div>
        </SheetHeader>

        <div className="mt-8 space-y-6">
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

          {event.location && (
            <div className="flex items-start gap-3">
              <div className="bg-secondary/20 p-2 rounded-md">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Local</h4>
                <p className="text-sm text-muted-foreground">
                  {event.location}
                </p>
              </div>
            </div>
          )}

          {event.description && (
            <div className="p-4 bg-muted/30 rounded-lg border text-sm leading-relaxed">
              {event.description}
            </div>
          )}

          {!isMilestone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>
                Participantes estimados: {event.originalEvent?.attendees || 0}
              </span>
            </div>
          )}

          {isMilestone && event.brotherId && (
            <div className="flex flex-col items-center justify-center p-6 bg-secondary/10 rounded-lg border border-dashed">
              <img
                src={`https://img.usecurling.com/ppl/medium?gender=male&seed=${event.brotherId}`}
                alt="Avatar"
                className="w-20 h-20 rounded-full mb-3 border-2 border-background shadow-sm"
              />
              <p className="text-sm font-medium">Irmão da Loja</p>
            </div>
          )}
        </div>

        {!isMilestone && (
          <SheetFooter className="mt-10 flex-col sm:flex-row gap-3 sm:gap-2">
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
