import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Loader2, CalendarPlus, AlertTriangle } from 'lucide-react'
import useChancellorStore from '@/stores/useChancellorStore'
import useSiteSettingsStore from '@/stores/useSiteSettingsStore'
import { useToast } from '@/hooks/use-toast'
import { useAsyncOperation } from '@/hooks/use-async-operation'
import type { Event } from '@/lib/data'
import {
  formatGeneratedSessionLabel,
  generateSessionDates,
  getExistingSessionDates,
  partitionGeneratedSessions,
} from '@/lib/session-generator'
import { resolveEventLocationInput } from '@/lib/event-locations'

interface GenerateSessionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DEFAULT_SESSION_DESCRIPTION =
  'Sessão programada conforme calendário padrão da loja.'

export function GenerateSessionsDialog({
  open,
  onOpenChange,
}: GenerateSessionsDialogProps) {
  const { events, bulkAddEvents } = useChancellorStore()
  const { sessionSchedule, siteTitle, contact } = useSiteSettingsStore()
  const locations = useChancellorStore((s) => s.locations)
  const { toast } = useToast()

  const generated = useMemo(
    () =>
      generateSessionDates({
        weekday: sessionSchedule.weekday,
        weeksOfMonth: sessionSchedule.weeksOfMonth,
        monthsAhead: sessionSchedule.monthsAhead,
      }),
    [sessionSchedule],
  )

  const existingDates = useMemo(() => getExistingSessionDates(events), [events])
  const { newSessions, conflicts } = useMemo(
    () => partitionGeneratedSessions(generated, existingDates),
    [generated, existingDates],
  )

  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (open) {
      setSelectedDates(new Set(newSessions.map((session) => session.date)))
    }
  }, [open, newSessions])

  const toggleDate = (date: string, checked: boolean) => {
    setSelectedDates((prev) => {
      const next = new Set(prev)
      if (checked) next.add(date)
      else next.delete(date)
      return next
    })
  }

  const selectAllNew = () => {
    setSelectedDates(new Set(newSessions.map((session) => session.date)))
  }

  const { execute: handleGenerate, loading } = useAsyncOperation(
    async () => {
      const toCreate = newSessions.filter((session) =>
        selectedDates.has(session.date),
      )
      if (toCreate.length === 0) {
        toast({
          variant: 'destructive',
          title: 'Nenhuma sessão selecionada',
          description: 'Marque ao menos uma data para gerar.',
        })
        return
      }

      const resolvedLocation = resolveEventLocationInput({
        locationId: sessionSchedule.defaultLocationId,
        siteTitle,
        contact,
        locations,
      })

      const payload: Event[] = toCreate.map((session) => ({
        id: crypto.randomUUID(),
        title: sessionSchedule.defaultTitle,
        date: session.date,
        time: sessionSchedule.defaultTime,
        type: 'Sessão',
        location: resolvedLocation.location,
        locationId: resolvedLocation.locationId,
        description: DEFAULT_SESSION_DESCRIPTION,
        attendees: 0,
      }))

      const { created, failed } = await bulkAddEvents(payload)
      if (created.length === 0) {
        toast({
          variant: 'destructive',
          title: 'Erro ao gerar sessões',
          description: 'Não foi possível salvar as sessões. Tente novamente.',
        })
        return
      }

      toast({
        title: 'Sessões geradas',
        description:
          failed > 0
            ? `${created.length} sessão(ões) criada(s). ${failed} falha(s).`
            : `${created.length} sessão(ões) adicionada(s) à agenda.`,
      })
      onOpenChange(false)
    },
    {
      onError: () => {
        toast({
          variant: 'destructive',
          title: 'Erro ao gerar sessões',
          description: 'Verifique sua conexão e permissões.',
        })
      },
    },
  )

  const periodLabel = useMemo(() => {
    if (generated.length === 0) return ''
    const first = generated[0].date
    const last = generated[generated.length - 1].date
    const fmt = (iso: string) =>
      format(new Date(`${iso}T12:00:00`), 'MMM/yyyy', { locale: ptBR })
    return `${fmt(first)} — ${fmt(last)}`
  }, [generated])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlus className="h-5 w-5" />
            Gerar sessões automaticamente
          </DialogTitle>
          <DialogDescription>
            Cria sessões para os próximos {sessionSchedule.monthsAhead} meses com
            base no calendário configurado em Configurações da Loja. Depois você
            pode editar qualquer data individualmente na agenda.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="secondary">{periodLabel}</Badge>
          <span>
            {generated.length} data(s) no padrão · {newSessions.length} nova(s) ·{' '}
            {conflicts.length} já existente(s)
          </span>
        </div>

        {conflicts.length > 0 && (
          <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p>
              Datas que já possuem sessão na agenda não serão recriadas. Edite a
              sessão existente se precisar alterar horário ou local.
            </p>
          </div>
        )}

        <div className="flex justify-between items-center">
          <p className="text-sm font-medium">Datas a criar</p>
          <Button type="button" variant="ghost" size="sm" onClick={selectAllNew}>
            Selecionar todas novas
          </Button>
        </div>

        <ScrollArea className="h-[280px] rounded-md border p-2">
          {newSessions.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">
              Todas as sessões do período já estão na agenda.
            </p>
          ) : (
            <ul className="space-y-2">
              {newSessions.map((session) => (
                <li
                  key={session.date}
                  className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted/50"
                >
                  <Checkbox
                    checked={selectedDates.has(session.date)}
                    onCheckedChange={(checked) =>
                      toggleDate(session.date, checked === true)
                    }
                  />
                  <span className="text-sm">
                    {formatGeneratedSessionLabel(
                      session,
                      sessionSchedule.weekday,
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {conflicts.length > 0 && (
            <>
              <p className="mt-4 mb-2 text-xs font-medium text-muted-foreground">
                Já na agenda (ignoradas)
              </p>
              <ul className="space-y-1 opacity-60">
                {conflicts.map((session) => (
                  <li key={`conflict-${session.date}`} className="px-2 text-sm">
                    {formatGeneratedSessionLabel(
                      session,
                      sessionSchedule.weekday,
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={() => handleGenerate()}
            disabled={loading || selectedDates.size === 0}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CalendarPlus className="mr-2 h-4 w-4" />
            )}
            Gerar {selectedDates.size > 0 ? selectedDates.size : ''} sessão
            {selectedDates.size === 1 ? '' : 'ões'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
