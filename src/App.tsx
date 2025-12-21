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
import { FONT_OPTIONS } from '@/components/settings/ThemeSettings'
import { SeoManager } from '@/components/SeoManager'
import { RedirectHandler } from '@/components/RedirectHandler'

function ThemeApplicator() {
  const { primaryColor, secondaryColor, fontFamily, fetchSettings } =
    useSiteSettingsStore()
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
    if (secondaryColor) {
      const hsl = hexToHSL(secondaryColor)
      document.documentElement.style.setProperty('--secondary', hsl)
    }
  }, [primaryColor, secondaryColor])

  useEffect(() => {
    if (fontFamily) {
      // Find font configuration
      const fontConfig = FONT_OPTIONS.find((f) => f.value === fontFamily)
      if (fontConfig) {
        // Apply font family to body
        document.body.style.fontFamily = fontConfig.family

        // Inject Google Font link if needed
        const fontName = fontFamily.replace(/ /g, '+')
        const linkId = 'dynamic-font-link'
        let link = document.getElementById(linkId) as HTMLLinkElement

        if (!link) {
          link = document.createElement('link')
          link.id = linkId
          link.rel = 'stylesheet'
          document.head.appendChild(link)
        }

        // Avoid reloading Inter as it is default
        if (fontFamily !== 'Inter') {
          link.href = `https://fonts.googleapis.com/css2?family=${fontName}:wght@300;400;500;600;700&display=swap`
        }
      }
    }
  }, [fontFamily])

  return null
}

const App = () => (
  <BrowserRouter
    future={{ v7_startTransition: false, v7_relativeSplatPath: false }}
  >
    <TooltipProvider>
      <ThemeApplicator />
      <SeoManager />
      <RedirectHandler />
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
          <Route path="secretariat/minutes/:id" element={<MinutesDetail />} />
          <Route path="financial" element={<Financial />} />
          <Route path="chancellor" element={<Chancellor />} />
          <Route path="reports" element={<Reports />} />
          <Route path="agenda" element={<Agenda />} />
          <Route path="library" element={<Library />} />

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
              <RoleGuard allowedRoles={['admin', 'editor']}>
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
