import { Bell, Search, Menu } from 'lucide-react'
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

export function AppHeader() {
  const location = useLocation()
  const isMobile = useIsMobile()

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
              <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-primary text-[10px]">
                3
              </Badge>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="p-4 font-semibold border-b">Notificações</div>
            <div className="max-h-[300px] overflow-y-auto">
              <div className="p-4 border-b hover:bg-muted/50 cursor-pointer transition-colors">
                <p className="text-sm font-medium">Nova Sessão Agendada</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Sessão Magna dia 20/05 às 20h
                </p>
              </div>
              <div className="p-4 border-b hover:bg-muted/50 cursor-pointer transition-colors">
                <p className="text-sm font-medium">Documento Adicionado</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Novo ritual disponível na biblioteca
                </p>
              </div>
              <div className="p-4 hover:bg-muted/50 cursor-pointer transition-colors">
                <p className="text-sm font-medium">Mensalidade Vencendo</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Sua mensalidade de maio vence amanhã
                </p>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  )
}
