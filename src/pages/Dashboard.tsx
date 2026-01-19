import { useMemo } from 'react'
import useAuthStore from '@/stores/useAuthStore'
import useChancellorStore from '@/stores/useChancellorStore'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { mockAnnouncements, mockLibrary } from '@/lib/data'
import {
  CalendarDays,
  BookOpen,
  Megaphone,
  TrendingUp,
  Users,
} from 'lucide-react'
import { format, parseISO, isAfter, startOfToday, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const { user } = useAuthStore()
  const { events } = useChancellorStore()

  // Filtrar e ordenar próximos eventos (futuros ou do dia atual)
  const upcomingEvents = useMemo(() => {
    const today = startOfToday()

    return events
      .filter((event) => {
        try {
          const eventDate = parseISO(event.date)
          return (
            isAfter(eventDate, today) ||
            isSameDay(eventDate, today)
          )
        } catch {
          return false
        }
      })
      .sort((a, b) => {
        try {
          const dateA = parseISO(a.date)
          const dateB = parseISO(b.date)
          return dateA.getTime() - dateB.getTime()
        } catch {
          return 0
        }
      })
      .slice(0, 3) // Limitar a 3 eventos
  }, [events])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">Painel Principal</h2>
        <p className="text-muted-foreground">
          Bem-vindo, Ir.{' '}
          {user?.profile?.full_name || user?.email || 'Irmão'}!
        </p>
      </div>

      {/* Widgets Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Next Events */}
        <Card className="col-span-1 glass-card border-l-4 border-l-primary hover:shadow-elevation transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Próximos Eventos
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CalendarDays className="h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                <p className="text-sm text-muted-foreground">
                  Nenhum evento agendado
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Adicione eventos na Agenda para visualizá-los aqui
                </p>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="mt-4"
                >
                  <Link to="/dashboard/agenda">Ir para Agenda</Link>
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-4 mt-2">
                  {upcomingEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-start gap-3 pb-3 border-b border-border/50 last:border-0 last:pb-0"
                    >
                      <div className="flex flex-col items-center justify-center bg-secondary w-12 h-12 rounded-md shrink-0">
                        <span className="text-xs font-bold uppercase">
                          {format(parseISO(event.date), 'MMM', { locale: ptBR })}
                        </span>
                        <span className="text-lg font-bold">
                          {format(parseISO(event.date), 'dd')}
                        </span>
                      </div>
                      <div className="space-y-1 flex-1 min-w-0">
                        <p className="text-sm font-medium leading-none">
                          {event.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {event.time} • {event.location}
                        </p>
                        {event.type && (
                          <span className="inline-block text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded mt-1">
                            {event.type}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  asChild
                  variant="link"
                  className="w-full mt-2 h-auto p-0 text-primary"
                >
                  <Link to="/dashboard/agenda">Ver Agenda Completa</Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Announcements */}
        <Card className="col-span-1 glass-card hover:shadow-elevation transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Mural da Secretaria
            </CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mt-2">
              {mockAnnouncements.slice(0, 2).map((ann) => (
                <div key={ann.id} className="bg-muted/30 p-3 rounded-md">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-semibold text-sm">{ann.title}</h4>
                    <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-secondary-foreground">
                      {format(new Date(ann.date), 'dd/MM')}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {ann.content}
                  </p>
                </div>
              ))}
            </div>
            <Button
              asChild
              variant="link"
              className="w-full mt-2 h-auto p-0 text-primary"
            >
              <Link to="/dashboard/notices">Ver Todos os Avisos</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Presence / Stats */}
        <Card className="col-span-1 glass-card hover:shadow-elevation transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Minha Frequência
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center pt-6">
            <div className="relative w-32 h-32 flex items-center justify-center rounded-full border-8 border-secondary border-t-primary">
              <span className="text-2xl font-bold">92%</span>
            </div>
            <p className="mt-4 text-sm text-muted-foreground text-center">
              Sua presença nos últimos 12 meses está excelente.
            </p>
          </CardContent>
        </Card>

        {/* Library */}
        <Card className="col-span-1 md:col-span-2 glass-card hover:shadow-elevation transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Biblioteca Virtual - Novidades
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              {mockLibrary.slice(0, 2).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-secondary/20 transition-colors cursor-pointer"
                >
                  <div className="h-10 w-10 bg-primary/20 rounded flex items-center justify-center text-primary">
                    {item.type === 'PDF' ? 'PDF' : 'DOC'}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Adicionado em{' '}
                      {format(new Date(item.addedAt), 'dd/MM/yyyy')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Button
              asChild
              variant="link"
              className="w-full mt-2 h-auto p-0 text-primary justify-start"
            >
              <Link to="/dashboard/library">Acessar Biblioteca</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Finance Summary */}
        <Card className="col-span-1 glass-card hover:shadow-elevation transition-all bg-gradient-to-br from-card to-secondary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Situação Financeira
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">Mensalidade Atual</p>
              <h3 className="text-2xl font-bold text-green-500">Em dia</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Próximo vencimento: 10/06/2025
              </p>

              <div className="mt-6 pt-4 border-t border-border">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Último Pagamento</span>
                  <span className="font-mono font-medium">R$ 150,00</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
