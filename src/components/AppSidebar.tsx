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
  Mail,
  Wallet,
  Megaphone,
  UtensilsCrossed,
  QrCode,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  BrandLogoImg,
  BRAND_LOGO_INTRINSIC_SIZE,
} from '@/components/brand/BrandLogoImg'
import { Button } from '@/components/ui/button'
import useAuthStore from '@/stores/useAuthStore'
import { isMasterAdminEmail } from '@/config/master-admin'
import useSiteSettingsStore from '@/stores/useSiteSettingsStore'
import { useLodgePositionsStore } from '@/stores/useLodgePositionsStore'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  getProfileInitials,
  resolveProfileAvatarUrl,
} from '@/lib/profile-avatar'
import { CheckinPresenceModal } from '@/components/checkin/CheckinPresenceModal'

export interface AppSidebarProps {
  /** No Sheet do header mobile: ocupa a largura, sempre com rótulos (evita colapso + conflito com .text-muted-foreground global). */
  variant?: 'default' | 'mobileDrawer'
}

export function AppSidebar({ variant = 'default' }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const isMobileDrawer = variant === 'mobileDrawer'
  const effectiveCollapsed = isMobileDrawer ? false : collapsed
  const [checkinModalOpen, setCheckinModalOpen] = useState(false)
  const { user, signOut } = useAuthStore()
  const { logoUrl } = useSiteSettingsStore()
  const { hasPermission, getUserPermissions } = useLodgePositionsStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await signOut()
      // Forçar navegação usando window.location para garantir que funcione
      window.location.href = '/'
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      // Mesmo em caso de erro, forçar navegação
      window.location.href = '/'
    }
  }

  const userRole = user?.role || 'member'
  const isMasterAdmin = isMasterAdminEmail(user?.email)
  
  // Verificar permissões baseadas em cargo
  const userPermissions = user?.id ? getUserPermissions(user.id) : []
  const hasFullAccess = isMasterAdmin || userPermissions.includes('*')
  
  const canAccessModule = (module: string) => {
    if (isMasterAdmin || hasFullAccess) return true
    if (!user?.id) return false
    return hasPermission(user.id, module)
  }

  const canSeeReports = 
    ['admin', 'editor'].includes(userRole) || 
    canAccessModule('reports')

  // Membros podem ver Agenda, Biblioteca e Mídia
  const canSeeAgenda = 
    ['admin', 'editor', 'member'].includes(userRole) || 
    canAccessModule('agenda') ||
    isMasterAdmin

  const canSeeLibrary = 
    ['admin', 'editor', 'member'].includes(userRole) || 
    canAccessModule('library') ||
    isMasterAdmin

  const canSeeAgape =
    ['admin', 'editor', 'member'].includes(userRole) ||
    canAccessModule('agape') ||
    isMasterAdmin
  // Todos os membros aprovados podem consultar; lançamento é Mestre de Banquete + diretoria

  const canSeeMedia = 
    ['admin', 'editor', 'member'].includes(userRole) || 
    isMasterAdmin

  const navItems = [
    { name: 'Painel', icon: LayoutDashboard, path: '/dashboard', end: true },
    ...(canAccessModule('secretariat') || isMasterAdmin
      ? [{ name: 'Secretaria', icon: Users, path: '/dashboard/secretariat' }]
      : []),
    ...(canAccessModule('financial') || isMasterAdmin
      ? [
          {
            name: 'Financeiro',
            icon: Banknote,
            path: '/dashboard/financial',
          },
        ]
      : []),
    ...(canAccessModule('chancellor') || isMasterAdmin
      ? [{ name: 'Chanceler', icon: ShieldCheck, path: '/dashboard/chancellor' }]
      : []),
    ...(canSeeReports
      ? [{ name: 'Relatórios', icon: FileBarChart, path: '/dashboard/reports' }]
      : []),
    ...(canSeeAgenda
      ? [{ name: 'Agenda', icon: Calendar, path: '/dashboard/agenda' }]
      : []),
    ...(canSeeLibrary
      ? [{ name: 'Biblioteca', icon: Library, path: '/dashboard/library' }]
      : []),
    ...(canSeeAgape
      ? [{ name: 'Ágape', icon: UtensilsCrossed, path: '/dashboard/agape' }]
      : []),
    { name: 'Avisos', icon: Megaphone, path: '/dashboard/notices' },
    { name: 'Minhas Mensagens', icon: Mail, path: '/dashboard/messages' },
    { name: 'Meus Pagamentos', icon: Wallet, path: '/dashboard/payments' },
    ...(canSeeMedia
      ? [
          {
            name: 'Mídia e Notícias',
            icon: Newspaper,
            path: '/dashboard/admin/media',
          },
        ]
      : []),
    ...(isMasterAdmin || userRole === 'admin'
      ? [
          {
            name: 'Admin. Usuários',
            icon: Settings,
            path: '/dashboard/admin',
            end: true,
          },
        ]
      : []),
    ...(['admin', 'editor'].includes(userRole) || isMasterAdmin
      ? [
          {
            name: 'Config. Site',
            icon: MonitorCog,
            path: '/dashboard/settings',
          },
        ]
      : []),
    { name: 'Ver Site', icon: Globe, path: '/' },
  ]

  return (
    <div
      className={cn(
        'flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 ease-in-out relative z-20 no-print',
        isMobileDrawer
          ? 'h-full min-h-0 w-full flex-1'
          : cn('h-screen', effectiveCollapsed ? 'w-[70px]' : 'w-[250px]'),
      )}
    >
      <div className="h-16 flex shrink-0 items-center justify-center border-b border-sidebar-border relative">
        <div className="flex items-center gap-2 overflow-hidden px-2 h-full py-2">
          <BrandLogoImg
            logoUrl={logoUrl}
            alt="Logo"
            className={cn(
              'origin-center rounded-full border border-sidebar-border/20 bg-background object-contain shadow-sm',
              'aspect-square p-px',
              effectiveCollapsed ? 'h-9 w-9 scale-[1.1]' : 'h-11 w-11 scale-[1.12] sm:h-12 sm:w-12',
            )}
            fallbackClassName="w-8 h-8 shrink-0 scale-100"
            width={BRAND_LOGO_INTRINSIC_SIZE}
            height={BRAND_LOGO_INTRINSIC_SIZE}
            sizes={effectiveCollapsed ? '36px' : '(max-width: 640px) 44px, 48px'}
            fetchPriority="low"
          />
          {!effectiveCollapsed && (
            <span className="font-bold text-lg whitespace-nowrap animate-fade-in text-primary">
              Templários da Paz
            </span>
          )}
        </div>
        {!isMobileDrawer && (
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
        )}
      </div>

      <div className="shrink-0 px-2 pb-2">
        <Button
          variant="default"
          size={effectiveCollapsed ? 'icon' : 'default'}
          className="w-full"
          onClick={() => setCheckinModalOpen(true)}
        >
          <QrCode className="h-5 w-5 shrink-0" />
          {!effectiveCollapsed && <span className="ml-2">Registrar presença</span>}
        </Button>
      </div>

      <nav className="min-h-0 flex-1 space-y-2 overflow-y-auto px-2 py-4 no-scrollbar">
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
              end={item.end !== undefined ? item.end : item.path === '/dashboard/admin'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 group relative',
                  isActive && item.path !== '/'
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  effectiveCollapsed && 'justify-center px-0',
                )
              }
            >
              <item.icon
                className={cn(
                  'w-5 h-5 shrink-0',
                  effectiveCollapsed ? 'w-6 h-6' : '',
                )}
              />
              {!effectiveCollapsed && (
                <span className="font-medium text-sm whitespace-nowrap">
                  {item.name}
                </span>
              )}
              {effectiveCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap border border-border">
                  {item.name}
                </div>
              )}
            </NavLink>
          )
        })}
      </nav>

      <div className="shrink-0 border-t border-sidebar-border p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                'flex w-full items-center gap-3 outline-none group',
                effectiveCollapsed ? 'justify-center' : '',
              )}
            >
              <Avatar className="h-9 w-9 border border-sidebar-accent transition-transform group-hover:scale-105">
                <AvatarImage
                  src={resolveProfileAvatarUrl(user?.profile?.avatar_url)}
                  alt={user?.profile?.full_name || 'Perfil'}
                />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                  {getProfileInitials(user?.profile?.full_name || user?.email)}
                </AvatarFallback>
              </Avatar>
              {!effectiveCollapsed && (
                <div className="flex flex-col items-start overflow-hidden text-left">
                  <span className="w-32 truncate text-sm font-medium text-sidebar-foreground">
                    {user?.profile?.full_name || user?.email}
                  </span>
                  <span className="w-32 truncate text-xs capitalize text-sidebar-foreground/70">
                    {user?.role || 'Membro'}
                  </span>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56" side="right">
            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/dashboard/profile')}>
              <UserCircle className="mr-2 h-4 w-4" />
              <span>Meu Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/dashboard/settings/user')}>
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

      <CheckinPresenceModal
        open={checkinModalOpen}
        onOpenChange={setCheckinModalOpen}
      />
    </div>
  )
}
