import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { FormHeader } from '@/components/ui/form-header'
import { useAgapeStore } from '@/stores/useAgapeStore'
import { useToast } from '@/hooks/use-toast'
import { getSaveErrorMessage } from '@/lib/auth-utils'
import {
  getLinkedAgendaEventIds,
  listImportableAgendaEvents,
  type AgendaEventRow,
} from '@/lib/agape-agenda-import'
import { formatDateBR } from '@/lib/format-utils'

interface AgapeImportFromAgendaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatEventLabel(event: AgendaEventRow): string {
  const time = event.time?.slice(0, 5)
  const timeSuffix = time ? ` às ${time}` : ''
  return `${formatDateBR(event.date)}${timeSuffix} — ${event.title}`
}

export function AgapeImportFromAgendaDialog({
  open,
  onOpenChange,
}: AgapeImportFromAgendaDialogProps) {
  const { sessions, loading, fetchAgendaEventsForImport, importSessionsFromAgenda } =
    useAgapeStore()
  const { toast } = useToast()
  const [agendaEvents, setAgendaEvents] = useState<AgendaEventRow[]>([])
  const [isLoadingEvents, setIsLoadingEvents] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const importableEvents = useMemo(
    () =>
      listImportableAgendaEvents(
        agendaEvents,
        getLinkedAgendaEventIds(sessions),
      ),
    [agendaEvents, sessions],
  )

  useEffect(() => {
    if (!open) {
      setSelectedIds([])
      return
    }

    let isMounted = true
    setIsLoadingEvents(true)

    void fetchAgendaEventsForImport().then((events) => {
      if (!isMounted) return
      setAgendaEvents(events)
      setIsLoadingEvents(false)
    })

    return () => {
      isMounted = false
    }
  }, [open, fetchAgendaEventsForImport])

  const toggleEvent = (eventId: string, checked: boolean) => {
    setSelectedIds((current) =>
      checked
        ? [...current, eventId]
        : current.filter((id) => id !== eventId),
    )
  }

  const handleImport = async () => {
    const { error, importedCount } = await importSessionsFromAgenda(selectedIds)

    if (error) {
      toast({
        title: 'Erro ao importar',
        description: getSaveErrorMessage(error),
        variant: 'destructive',
      })
      return
    }

    toast({
      title: 'Sessões importadas',
      description:
        importedCount === 1
          ? '1 sessão de ágape foi criada a partir da Agenda.'
          : `${importedCount} sessões de ágape foram criadas a partir da Agenda.`,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-hidden sm:max-w-lg">
        <DialogTitle className="sr-only">Importar sessões da Agenda</DialogTitle>
        <FormHeader
          title="Importar da Agenda"
          description="Selecione sessões ou eventos sociais da Agenda para criar sessões de ágape vinculadas."
          icon={<CalendarDays className="h-5 w-5" />}
        />

        <div className="max-h-[50vh] space-y-3 overflow-y-auto pr-1">
          {isLoadingEvents ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : importableEvents.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Não há eventos disponíveis para importação. Todos os eventos elegíveis
              já possuem sessão de ágape ou a Agenda ainda não tem sessões/eventos
              sociais cadastrados.
            </p>
          ) : (
            importableEvents.map((event) => {
              const checkboxId = `agape-import-event-${event.id}`
              return (
                <div
                  key={event.id}
                  className="flex items-start gap-3 rounded-md border p-3"
                >
                  <Checkbox
                    id={checkboxId}
                    checked={selectedIds.includes(event.id)}
                    onCheckedChange={(checked) =>
                      toggleEvent(event.id, Boolean(checked))
                    }
                  />
                  <div className="space-y-1">
                    <Label htmlFor={checkboxId} className="leading-snug">
                      {formatEventLabel(event)}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {event.type}
                      {event.location ? ` · ${event.location}` : ''}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={loading || selectedIds.length === 0}
            onClick={() => void handleImport()}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Importar selecionados
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
