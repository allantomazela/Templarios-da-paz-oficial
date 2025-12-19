import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { AppSidebar } from '@/components/AppSidebar'
import { AppHeader } from '@/components/AppHeader'
import useAuthStore from '@/stores/useAuthStore'
import { useIsMobile } from '@/hooks/use-mobile'
import { Loader2 } from 'lucide-react'

export default function DashboardLayout() {
  const { isAuthenticated, user, loading } = useAuthStore()
  const isMobile = useIsMobile()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">
            Carregando sistema...
          </p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Strict Status Check - Approved users only, others go to Access Denied
  // Master admin bypass check via profile status (ensure it's approved in DB)
  if (user?.profile?.status !== 'approved') {
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
