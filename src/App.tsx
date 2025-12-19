import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import DashboardLayout from '@/components/DashboardLayout'
import Index from '@/pages/Index'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Secretariat from '@/pages/Secretariat'
import Financial from '@/pages/Financial'
import Chancellor from '@/pages/Chancellor'
import Reports from '@/pages/Reports'
import Agenda from '@/pages/Agenda'
import Library from '@/pages/Library'
import Admin from '@/pages/Admin'
import MediaManager from '@/pages/admin/MediaManager'
import SiteSettings from '@/pages/SiteSettings'
import NotFound from '@/pages/NotFound'
import { useEffect } from 'react'
import useSiteSettingsStore from '@/stores/useSiteSettingsStore'
import useAuthStore from '@/stores/useAuthStore'
import { hexToHSL } from '@/lib/utils'
import { RoleGuard } from '@/components/RoleGuard'

// Component to apply theme globally from App level
function ThemeApplicator() {
  const { primaryColor, fetchSettings } = useSiteSettingsStore()
  const { initialize } = useAuthStore()

  useEffect(() => {
    fetchSettings()
    initialize() // Init auth
  }, [fetchSettings, initialize])

  useEffect(() => {
    if (primaryColor) {
      const hsl = hexToHSL(primaryColor)
      document.documentElement.style.setProperty('--primary', hsl)
    }
  }, [primaryColor])

  return null
}

const App = () => (
  <BrowserRouter
    future={{ v7_startTransition: false, v7_relativeSplatPath: false }}
  >
    <TooltipProvider>
      <ThemeApplicator />
      <Toaster />
      <Sonner />
      <Routes>
        {/* Public Landing Page */}
        <Route path="/" element={<Index />} />

        {/* Authentication Route */}
        <Route path="/login" element={<Login />} />

        {/* Protected Dashboard Routes */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="secretariat" element={<Secretariat />} />
          <Route path="financial" element={<Financial />} />
          <Route path="chancellor" element={<Chancellor />} />
          <Route path="reports" element={<Reports />} />
          <Route path="agenda" element={<Agenda />} />
          <Route path="library" element={<Library />} />

          {/* Admin / Settings Routes Protected by RoleGuard */}
          <Route
            path="settings"
            element={
              <RoleGuard allowedRoles={['admin', 'editor']}>
                <SiteSettings />
              </RoleGuard>
            }
          />
          <Route
            path="admin"
            element={
              <RoleGuard allowedRoles={['admin']}>
                <Admin />
              </RoleGuard>
            }
          />
          <Route
            path="admin/media"
            element={
              <RoleGuard allowedRoles={['admin']}>
                <MediaManager />
              </RoleGuard>
            }
          />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </TooltipProvider>
  </BrowserRouter>
)

export default App
