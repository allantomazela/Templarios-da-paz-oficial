import { Bell, Search, Menu, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useLocation } from 'react-router-dom'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { AppSidebar } from './AppSidebar'
import { useIsMobile } from '@/hooks/use-mobile'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import useChancellorStore from '@/stores/useChancellorStore'
import { format } from 'date-fns'
import { ScrollArea } from '@/components/ui/scroll-area'

export function AppHeader() {
  const location = useLocation()
  const isMobile = useIsMobile()
  const { notifications, markNotificationAsRead } = useChancellorStore()

  const unreadCount = notifications.filter((n) => !n.read).length

  const getPageTitle = () => {
    const path = location.pathname
    if (path.includes('/dashboard/secretariat')) return 'Secretaria'
    if (path.includes('/dashboard/financial')) return 'Financeiro'
    if (path.includes('/dashboard/chancellor')) return 'Chanceler'
    if (path.includes('/dashboard/agenda')) return 'Agenda'
    if (path.includes('/dashboard/library')) return 'Biblioteca Virtual'
    if (path.includes('/dashboard/admin')) return 'Gestão de Usuários'
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
              <span className="text-xs text-muted-foreground font-normal">
                {unreadCount} novas
              </span>
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
                    className={`p-4 border-b last:border-0 hover:bg-muted/50 transition-colors relative group ${notification.read ? 'opacity-60' : ''}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium">
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {format(
                            new Date(notification.date),
                            'dd/MM/yyyy HH:mm',
                          )}
                        </p>
                      </div>
                      {!notification.read && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() =>
                            markNotificationAsRead(notification.id)
                          }
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
