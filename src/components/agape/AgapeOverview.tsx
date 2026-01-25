import { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAgapeStore } from '@/stores/useAgapeStore'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar, UtensilsCrossed, Users, DollarSign, Loader2 } from 'lucide-react'

export function AgapeOverview() {
  const { sessions, menuItems, consumptions, loading, fetchSessions, fetchMenuItems, fetchConsumptions } = useAgapeStore()

  useEffect(() => {
    fetchSessions()
    fetchMenuItems()
    fetchConsumptions()
  }, [fetchSessions, fetchMenuItems, fetchConsumptions])

  const openSessions = sessions.filter(s => s.status === 'open')
  const activeMenuItems = menuItems.filter(m => m.is_active)
  const totalConsumptions = consumptions.length
  const totalAmount = consumptions.reduce((sum, c) => sum + c.total_amount, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessões Abertas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openSessions.length}</div>
            <p className="text-xs text-muted-foreground">
              de {sessions.length} sessões totais
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Itens do Cardápio</CardTitle>
            <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeMenuItems.length}</div>
            <p className="text-xs text-muted-foreground">
              itens ativos no cardápio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Consumos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalConsumptions}</div>
            <p className="text-xs text-muted-foreground">
              registros de consumo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(totalAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              em consumos registrados
            </p>
          </CardContent>
        </Card>
      </div>

      {openSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sessões Abertas</CardTitle>
            <CardDescription>
              Sessões de ágape que estão atualmente abertas para registro de consumo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {openSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <p className="font-medium">
                      {format(new Date(session.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                    {session.description && (
                      <p className="text-sm text-muted-foreground">{session.description}</p>
                    )}
                  </div>
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                    Aberta
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
