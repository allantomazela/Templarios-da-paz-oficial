import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle2, Calendar } from 'lucide-react'
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

/** Visualização dos consumos do irmão (sem auto-registro). */
export function AgapeMyConsumptions() {
  const { user } = useAuthStore()
  const { sessions, consumptions, loading, fetchSessions, fetchConsumptions } =
    useAgapeStore()

  const [selectedSession, setSelectedSession] = useState<string>('')

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  useEffect(() => {
    if (selectedSession) {
      fetchConsumptions(selectedSession)
    }
  }, [selectedSession, fetchConsumptions])

  const openSessions = sessions.filter((s) => s.status === 'open')
  const closedSessions = sessions.filter((s) => s.status !== 'open')
  const sessionsForView = [...openSessions, ...closedSessions].slice(0, 12)

  const selectedSessionData = sessions.find((s) => s.id === selectedSession)
  const myConsumptions = consumptions.filter(
    (c) => c.session_id === selectedSession && c.brother_id === user?.id,
  )
  const totalMyConsumption = myConsumptions.reduce(
    (sum, c) => sum + c.total_amount,
    0,
  )

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
            Meus consumos
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
          <Calendar className="h-5 w-5" />
          Meus consumos no Ágape
        </CardTitle>
        <CardDescription>
          Os lançamentos são feitos pelo Mestre de Banquete ou pela diretoria.
          Aqui você consulta apenas o que foi registrado em seu nome.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Sessão de Ágape</label>
          <Select value={selectedSession} onValueChange={setSelectedSession}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma sessão" />
            </SelectTrigger>
            <SelectContent>
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

        {selectedSession && selectedSessionData && (
          <>
            <div className="rounded-lg border p-4 bg-muted/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {formatCalendarDate(
                      selectedSessionData.date,
                      "dd 'de' MMMM 'de' yyyy",
                      { locale: ptBR },
                    )}
                  </p>
                  {selectedSessionData.description && (
                    <p className="text-sm text-muted-foreground">
                      {selectedSessionData.description}
                    </p>
                  )}
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
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Aberta
                    </>
                  ) : (
                    'Encerrada'
                  )}
                </Badge>
              </div>
            </div>

            {myConsumptions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum consumo registrado para você nesta sessão.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Itens registrados</h3>
                  <Badge variant="secondary" className="text-lg">
                    Total: {formatCurrencyBRL(totalMyConsumption)}
                  </Badge>
                </div>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Qtd.</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead>Registrado por</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {myConsumptions.map((consumption) => (
                        <TableRow key={consumption.id}>
                          <TableCell>
                            {consumption.menu_item?.name || 'Item removido'}
                          </TableCell>
                          <TableCell>{consumption.quantity}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrencyBRL(consumption.total_amount)}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {consumption.recorded_by_profile?.full_name ||
                              '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
