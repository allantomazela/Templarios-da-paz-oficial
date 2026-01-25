import { Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AppSidebar } from '@/components/AppSidebar'
import { AppHeader } from '@/components/AppHeader'
import useAuthStore from '@/stores/useAuthStore'
import { useIsMobile } from '@/hooks/use-mobile'
import { Loader2, LogOut, RefreshCw, AlertTriangle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { NotificationBanner } from '@/components/NotificationBanner'

export default function DashboardLayout() {
  const { isAuthenticated, user, loading, signOut, initialize } = useAuthStore()
  const isMobile = useIsMobile()
  const location = useLocation()
  const navigate = useNavigate()
  const [showTimeout, setShowTimeout] = useState(false)

  // Resilient Timeout Logic: 3 seconds
  useEffect(() => {
    let timeout: NodeJS.Timeout
    if (loading) {
      setShowTimeout(false)
      timeout = setTimeout(() => {
        setShowTimeout(true)
      }, 3000)
    }
    return () => clearTimeout(timeout)
  }, [loading])

  const handleLogout = async () => {
    try {
      await signOut()
      // Forçar navegação usando window.location para garantir que funcione
      window.location.href = '/login'
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      // Mesmo em caso de erro, forçar navegação
      window.location.href = '/login'
    }
  }

  const handleRetry = () => {
    setShowTimeout(false)
    window.location.reload()
  }

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background gap-6 p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">
            Carregando sistema...
          </p>
        </div>

        {showTimeout && (
          <div className="flex flex-col items-center gap-4 animate-fade-in max-w-sm text-center bg-card p-6 rounded-lg border shadow-sm">
            <div className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="font-semibold">Demora na resposta</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              A conexão está levando mais tempo que o normal. Você pode tentar
              recarregar ou sair.
            </p>
            <div className="flex gap-2 w-full">
              <Button
                variant="default"
                size="sm"
                onClick={handleRetry}
                className="flex-1"
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Tentar Novamente
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex-1"
              >
                <LogOut className="mr-2 h-4 w-4" /> Sair
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  const isMasterAdmin = user?.email === 'allantomazela@gmail.com'
  const userStatus = user?.profile?.status || 'pending'

  if (!isMasterAdmin && userStatus !== 'approved') {
    return <Navigate to="/access-denied" replace />
  }

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      {!isMobile && <AppSidebar />}

      <div className="flex flex-col flex-1 overflow-hidden">
        <AppHeader />

        <main className="flex-1 overflow-y-auto bg-background/95 p-4 sm:p-6 scroll-smooth">
          <div className="max-w-7xl mx-auto w-full animate-fade-in">
            <Outlet />
          </div>

          <footer className="py-6 text-center text-xs text-muted-foreground border-t border-border mt-8">
            <p>
              © 2024 Templários da Paz de Botucatu-SP. Todos os direitos
              reservados.
            </p>
          </footer>
        </main>
      </div>

      <NotificationBanner />
    </div>
  )
}
