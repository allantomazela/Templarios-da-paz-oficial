import { useEffect } from 'react'
import { Bell, Search, Menu, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useLocation, Link } from 'react-router-dom'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { AppSidebar } from './AppSidebar'
import { useIsMobile } from '@/hooks/use-mobile'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import useAdminNotificationStore from '@/stores/useAdminNotificationStore'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ScrollArea } from '@/components/ui/scroll-area'

export function AppHeader() {
  const location = useLocation()
  const isMobile = useIsMobile()
  const {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useAdminNotificationStore()

  useEffect(() => {
    fetchNotifications()
    // Poll for new notifications every minute
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  const getPageTitle = () => {
    const path = location.pathname
    if (path.includes('/dashboard/secretariat/minutes'))
      return 'Atas e Balaústres'
    if (path.includes('/dashboard/secretariat')) return 'Secretaria'
    if (path.includes('/dashboard/financial')) return 'Financeiro'
    if (path.includes('/dashboard/chancellor')) return 'Chanceler'
    if (path.includes('/dashboard/agenda')) return 'Agenda'
    if (path.includes('/dashboard/library')) return 'Biblioteca Virtual'
    if (path.includes('/dashboard/admin/media')) return 'Mídia e Notícias'
    if (path.includes('/dashboard/admin')) return 'Gestão de Usuários'
    if (path.includes('/dashboard/settings')) return 'Configurações do Site'
    if (path.includes('/dashboard/reports')) return 'Central de Relatórios'
    return 'Painel Principal'
  }

  return (
    <header className="h-16 border-b border-border bg-background/50 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-4">
        {isMobile && (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="p-0 w-[250px] border-r-sidebar-border bg-sidebar text-sidebar-foreground"
            >
              <AppSidebar />
            </SheetContent>
          </Sheet>
        )}
        <h1 className="text-xl font-bold text-foreground hidden sm:block">
          {getPageTitle()}
        </h1>
      </div>

      <div className="flex items-center gap-3 sm:gap-4 flex-1 justify-end">
        <div className="relative w-full max-w-[300px] hidden md:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar..."
            className="pl-9 h-9 bg-secondary/50 border-transparent focus:border-primary focus:bg-background transition-all"
          />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative hover:bg-secondary/50"
            >
              <Bell className="h-5 w-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-primary text-[10px]">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="p-4 font-semibold border-b flex justify-between items-center">
              <span>Notificações</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-normal">
                  {unreadCount} novas
                </span>
                {unreadCount > 0 && (
                  <Button
                    variant="link"
                    className="h-auto p-0 text-xs"
                    onClick={() => markAllAsRead()}
                  >
                    Ler todas
                  </Button>
                )}
              </div>
            </div>
            <ScrollArea className="max-h-[300px]">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Nenhuma notificação.
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b last:border-0 hover:bg-muted/50 transition-colors relative group ${notification.is_read ? 'opacity-60 bg-muted/20' : 'bg-background'}`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <Link
                        to={notification.link || '#'}
                        className="flex-1 block"
                        onClick={() =>
                          !notification.is_read && markAsRead(notification.id)
                        }
                      >
                        <p className="text-sm font-medium leading-none mb-1">
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-2">
                          {format(
                            new Date(notification.created_at),
                            "dd 'de' MMM, HH:mm",
                            { locale: ptBR },
                          )}
                        </p>
                      </Link>
                      {!notification.is_read && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 shrink-0 text-primary"
                          onClick={() => markAsRead(notification.id)}
                          title="Marcar como lida"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  )
}
