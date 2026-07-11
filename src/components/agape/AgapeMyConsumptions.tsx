import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle2, Calendar, Wallet } from 'lucide-react'
import { useAgapeStore } from '@/stores/useAgapeStore'
import useAuthStore from '@/stores/useAuthStore'
import { ptBR } from 'date-fns/locale'
import { formatCalendarDate, formatCurrencyBRL } from '@/lib/format-utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

const ALL_SESSIONS_VALUE = '__all__'

/** Visualização dos consumos do irmão logado (inclui administradores). */
export function AgapeMyConsumptions() {
  const { user } = useAuthStore()
  const { sessions, consumptions, loading, fetchSessions, fetchConsumptions } =
    useAgapeStore()

  const [selectedSession, setSelectedSession] = useState<string>('')

  useEffect(() => {
    void fetchSessions()
    void fetchConsumptions()
  }, [fetchSessions, fetchConsumptions])

  useEffect(() => {
    if (selectedSession && selectedSession !== ALL_SESSIONS_VALUE) {
      void fetchConsumptions(selectedSession)
    }
  }, [selectedSession, fetchConsumptions])

  const openSessions = sessions.filter((s) => s.status === 'open')
  const closedSessions = sessions.filter((s) => s.status !== 'open')
  const sessionsForView = [...openSessions, ...closedSessions].slice(0, 24)

  const sessionById = useMemo(
    () => new Map(sessions.map((session) => [session.id, session])),
    [sessions],
  )

  const allMyConsumptions = useMemo(() => {
    if (!user?.id) return []
    return consumptions
      .filter((consumption) => consumption.brother_id === user.id)
      .map((consumption) => {
        const session = sessionById.get(consumption.session_id)
        return {
          ...consumption,
          sessionDate: session?.date ?? '',
          sessionDescription: session?.description ?? null,
          sessionStatus: session?.status ?? 'closed',
        }
      })
      .sort((left, right) => {
        const dateCompare = right.sessionDate.localeCompare(left.sessionDate)
        if (dateCompare !== 0) return dateCompare
        return right.created_at.localeCompare(left.created_at)
      })
  }, [consumptions, sessionById, user?.id])

  const myConsumptions = useMemo(() => {
    if (selectedSession === ALL_SESSIONS_VALUE) {
      return allMyConsumptions
    }
    return allMyConsumptions.filter(
      (consumption) => consumption.session_id === selectedSession,
    )
  }, [allMyConsumptions, selectedSession])

  const totalMyConsumption = myConsumptions.reduce(
    (sum, consumption) => sum + consumption.total_amount,
    0,
  )

  const selectedSessionData =
    selectedSession && selectedSession !== ALL_SESSIONS_VALUE
      ? sessions.find((session) => session.id === selectedSession)
      : null

  useEffect(() => {
    if (!selectedSession && sessionsForView.length > 0) {
      setSelectedSession(ALL_SESSIONS_VALUE)
    }
  }, [selectedSession, sessionsForView.length])

  if (loading && sessions.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (sessionsForView.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Meus gastos no Ágape
          </CardTitle>
          <CardDescription>
            Não há sessões de ágape disponíveis no momento.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Meus gastos no Ágape
        </CardTitle>
        <CardDescription>
          Acompanhe o que foi registrado em seu nome — por sessão ou em todas as
          sessões. Útil para seu controle pessoal, mesmo sendo administrador ou
          Mestre de Banquete.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Filtrar por sessão</label>
          <Select value={selectedSession} onValueChange={setSelectedSession}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma sessão" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_SESSIONS_VALUE}>
                Todas as sessões (visão geral)
              </SelectItem>
              {sessionsForView.map((session) => (
                <SelectItem key={session.id} value={session.id}>
                  {formatCalendarDate(session.date, "dd 'de' MMMM 'de' yyyy", {
                    locale: ptBR,
                  })}
                  {session.description && ` - ${session.description}`}
                  {session.status !== 'open' ? ' (encerrada)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedSession && (
          <>
            {selectedSessionData ? (
              <div className="rounded-lg border p-4 bg-muted/50">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">
                      {formatCalendarDate(
                        selectedSessionData.date,
                        "dd 'de' MMMM 'de' yyyy",
                        { locale: ptBR },
                      )}
                    </p>
                    {selectedSessionData.description ? (
                      <p className="text-sm text-muted-foreground">
                        {selectedSessionData.description}
                      </p>
                    ) : null}
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      selectedSessionData.status === 'open'
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : ''
                    }
                  >
                    {selectedSessionData.status === 'open' ? (
                      <>
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Aberta
                      </>
                    ) : (
                      'Encerrada'
                    )}
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                Exibindo seus consumos em todas as sessões carregadas (
                {sessionsForView.length} sessão(ões)).
              </div>
            )}

            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Itens registrados</h3>
              <Badge variant="secondary" className="text-base">
                Total: {formatCurrencyBRL(totalMyConsumption)}
              </Badge>
            </div>

            {myConsumptions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum consumo registrado em seu nome
                {selectedSessionData ? ' nesta sessão' : ''}.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-md border">
                <Table className="w-full table-fixed">
                  <colgroup>
                    {selectedSession === ALL_SESSIONS_VALUE ? (
                      <>
                        <col className="w-[18%]" />
                        <col className="w-[28%]" />
                        <col className="w-[10%]" />
                        <col className="w-[14%]" />
                        <col className="w-[14%]" />
                        <col className="w-[16%]" />
                      </>
                    ) : (
                      <>
                        <col className="w-[34%]" />
                        <col className="w-[12%]" />
                        <col className="w-[18%]" />
                        <col className="w-[18%]" />
                        <col className="w-[18%]" />
                      </>
                    )}
                  </colgroup>
                  <TableHeader>
                    <TableRow>
                      {selectedSession === ALL_SESSIONS_VALUE ? (
                        <TableHead>Sessão</TableHead>
                      ) : null}
                      <TableHead>Item</TableHead>
                      <TableHead className="text-center">Qtd.</TableHead>
                      <TableHead className="text-right">Valor unit.</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Registrado por</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myConsumptions.map((consumption, index) => (
                      <TableRow
                        key={consumption.id}
                        className={cn(
                          index % 2 === 0 ? 'bg-background' : 'bg-muted/40',
                        )}
                      >
                        {selectedSession === ALL_SESSIONS_VALUE ? (
                          <TableCell className="text-sm">
                            {consumption.sessionDate
                              ? formatCalendarDate(
                                  consumption.sessionDate,
                                  'dd/MM/yyyy',
                                  { locale: ptBR },
                                )
                              : '—'}
                          </TableCell>
                        ) : null}
                        <TableCell>
                          {consumption.menu_item?.name || 'Item removido'}
                        </TableCell>
                        <TableCell className="text-center">
                          {consumption.quantity}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrencyBRL(consumption.unit_price)}
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {formatCurrencyBRL(consumption.total_amount)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {consumption.recorded_by_profile?.full_name || '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
