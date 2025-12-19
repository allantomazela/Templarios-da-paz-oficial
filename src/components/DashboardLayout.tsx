import { Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AppSidebar } from '@/components/AppSidebar'
import { AppHeader } from '@/components/AppHeader'
import useAuthStore from '@/stores/useAuthStore'
import { useIsMobile } from '@/hooks/use-mobile'
import { Loader2, LogOut } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

export default function DashboardLayout() {
  const { isAuthenticated, user, loading, signOut } = useAuthStore()
  const isMobile = useIsMobile()
  const location = useLocation()
  const navigate = useNavigate()
  const [showTimeout, setShowTimeout] = useState(false)

  // Timeout logic to prevent infinite loading
  useEffect(() => {
    let timeout: NodeJS.Timeout
    if (loading) {
      timeout = setTimeout(() => {
        setShowTimeout(true)
      }, 5000) // 5 seconds timeout
    }
    return () => clearTimeout(timeout)
  }, [loading])

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background gap-6">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">
            Carregando sistema...
          </p>
        </div>

        {showTimeout && (
          <div className="flex flex-col items-center gap-2 animate-fade-in">
            <p className="text-sm text-destructive">
              O carregamento está demorando mais que o esperado.
            </p>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" /> Sair e Tentar Novamente
            </Button>
          </div>
        )}
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Master admin bypass check
  const isMasterAdmin = user?.email === 'allantomazela@gmail.com'
  const userStatus = user?.profile?.status || 'pending'

  // Strict Status Check - Approved users only, others go to Access Denied
  // Master admin bypasses this check
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
    </div>
  )
}
