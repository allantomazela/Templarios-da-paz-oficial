import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Banknote,
  Calendar,
  Library,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  UserCircle,
  FileBarChart,
  Globe,
  MonitorCog,
  Newspaper,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import useAuthStore from '@/stores/useAuthStore'
import useSiteSettingsStore from '@/stores/useSiteSettingsStore'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { user, signOut } = useAuthStore()
  const { logoUrl } = useSiteSettingsStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    navigate('/')
  }

  const userRole = user?.role || 'member'
  const canSeeReports = ['admin', 'editor'].includes(userRole)

  const navItems = [
    { name: 'Painel', icon: LayoutDashboard, path: '/dashboard', end: true },
    { name: 'Secretaria', icon: Users, path: '/dashboard/secretariat' },
    {
      name: 'Financeiro',
      icon: Banknote,
      path: '/dashboard/financial',
      allowedRoles: ['admin', 'editor'],
    },
    { name: 'Chanceler', icon: ShieldCheck, path: '/dashboard/chancellor' },
    ...(canSeeReports
      ? [{ name: 'Relatórios', icon: FileBarChart, path: '/dashboard/reports' }]
      : []),
    { name: 'Agenda', icon: Calendar, path: '/dashboard/agenda' },
    { name: 'Biblioteca', icon: Library, path: '/dashboard/library' },
    {
      name: 'Mídia e Notícias',
      icon: Newspaper,
      path: '/dashboard/admin/media',
      allowedRoles: ['admin', 'editor'],
    },
    {
      name: 'Admin. Usuários',
      icon: Settings,
      path: '/dashboard/admin',
      allowedRoles: ['admin'],
    },
    {
      name: 'Config. Site',
      icon: MonitorCog,
      path: '/dashboard/settings',
      allowedRoles: ['admin', 'editor'],
    },
    { name: 'Ver Site', icon: Globe, path: '/' },
  ]

  return (
    <div
      className={cn(
        'flex flex-col h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 ease-in-out relative z-20 no-print',
        collapsed ? 'w-[70px]' : 'w-[250px]',
      )}
    >
      <div className="h-16 flex items-center justify-center border-b border-sidebar-border relative">
        <div className="flex items-center gap-2 overflow-hidden px-2 h-full py-2">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Logo"
              className={cn(
                'rounded-full object-cover aspect-square shadow-sm bg-background',
                collapsed ? 'h-8 w-8' : 'h-10 w-10',
              )}
            />
          ) : (
            <ShieldCheck className="w-8 h-8 text-primary shrink-0" />
          )}
          {!collapsed && (
            <span className="font-bold text-lg whitespace-nowrap animate-fade-in text-primary">
              Templários
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-6 h-6 w-6 rounded-full bg-sidebar-border border border-sidebar-accent text-sidebar-foreground hover:bg-sidebar-accent z-30"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </Button>
      </div>

      <nav className="flex-1 py-6 px-2 space-y-2 overflow-y-auto no-scrollbar">
        {navItems.map((item) => {
          if (
            item.allowedRoles &&
            (!user || !item.allowedRoles.includes(user.role || 'member'))
          )
            return null

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 group relative',
                  isActive && item.path !== '/'
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'hover:bg-sidebar-accent hover:text-white text-muted-foreground',
                  collapsed && 'justify-center px-0',
                )
              }
            >
              <item.icon
                className={cn('w-5 h-5 shrink-0', collapsed ? 'w-6 h-6' : '')}
              />
              {!collapsed && (
                <span className="font-medium text-sm whitespace-nowrap">
                  {item.name}
                </span>
              )}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap border border-border">
                  {item.name}
                </div>
              )}
            </NavLink>
          )
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                'flex items-center gap-3 w-full outline-none group',
                collapsed ? 'justify-center' : '',
              )}
            >
              <Avatar className="h-9 w-9 border border-sidebar-accent transition-transform group-hover:scale-105">
                <AvatarImage
                  src={
                    user?.profile?.avatar_url ||
                    `https://img.usecurling.com/ppl/thumbnail?gender=male&seed=${user?.id}`
                  }
                />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {user?.profile?.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex flex-col items-start text-left overflow-hidden">
                  <span className="text-sm font-medium text-white truncate w-32">
                    {user?.profile?.full_name || user?.email}
                  </span>
                  <span className="text-xs text-muted-foreground truncate w-32 capitalize">
                    {user?.role || 'Membro'}
                  </span>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56" side="right">
            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <UserCircle className="mr-2 h-4 w-4" />
              <span>Meu Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Configurações</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
