import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import DashboardLayout from '@/components/DashboardLayout'
import Index from '@/pages/Index'
import Login from '@/pages/Login'
import ResetPassword from '@/pages/ResetPassword'
import Dashboard from '@/pages/Dashboard'
import Secretariat from '@/pages/Secretariat'
import Financial from '@/pages/Financial'
import Chancellor from '@/pages/Chancellor'
import Reports from '@/pages/Reports'
import Agenda from '@/pages/Agenda'
import Library from '@/pages/Library'
import Minutes from '@/pages/Minutes'
import MinutesDetail from '@/pages/MinutesDetail'
import Admin from '@/pages/Admin'
import MediaManager from '@/pages/admin/MediaManager'
import SiteSettings from '@/pages/SiteSettings'
import NotFound from '@/pages/NotFound'
import AccessDenied from '@/pages/AccessDenied'
import { useEffect } from 'react'
import useSiteSettingsStore from '@/stores/useSiteSettingsStore'
import useAuthStore from '@/stores/useAuthStore'
import { hexToHSL } from '@/lib/utils'
import { RoleGuard } from '@/components/RoleGuard'

function ThemeApplicator() {
  const { primaryColor, fetchSettings } = useSiteSettingsStore()
  const { initialize } = useAuthStore()

  useEffect(() => {
    fetchSettings()
    initialize()
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
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/access-denied" element={<AccessDenied />} />

        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="secretariat" element={<Secretariat />} />
          <Route path="minutes" element={<Minutes />} />
          <Route path="minutes/:id" element={<MinutesDetail />} />
          <Route path="financial" element={<Financial />} />
          <Route path="chancellor" element={<Chancellor />} />
          <Route path="reports" element={<Reports />} />
          <Route path="agenda" element={<Agenda />} />
          <Route path="library" element={<Library />} />

          <Route
            path="settings"
            element={
              <RoleGuard allowedRoles={['admin']}>
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
