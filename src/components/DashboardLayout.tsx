import { Outlet, Navigate } from 'react-router-dom'
import { AppSidebar } from '@/components/AppSidebar'
import { AppHeader } from '@/components/AppHeader'
import useAuthStore from '@/stores/useAuthStore'
import { useIsMobile } from '@/hooks/use-mobile'

export default function DashboardLayout() {
  const { isAuthenticated } = useAuthStore()
  const isMobile = useIsMobile()

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
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
