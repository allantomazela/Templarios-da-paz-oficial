import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Suspense, lazy, useEffect } from 'react'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Loader2 } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import useSiteSettingsStore from '@/stores/useSiteSettingsStore'
import useAuthStore from '@/stores/useAuthStore'
import { useLodgePositionsStore } from '@/stores/useLodgePositionsStore'
import { hexToHSL } from '@/lib/utils'
import { RoleGuard } from '@/components/RoleGuard'
import { FONT_OPTIONS } from '@/components/settings/ThemeSettings'
import { SeoManager } from '@/components/SeoManager'
import { RedirectHandler } from '@/components/RedirectHandler'
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt'

// Lazy load pages for better performance
const Index = lazy(() => import('@/pages/Index'))
const Login = lazy(() => import('@/pages/Login'))
const ResetPassword = lazy(() => import('@/pages/ResetPassword'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Secretariat = lazy(() => import('@/pages/Secretariat'))
const Financial = lazy(() => import('@/pages/Financial'))
const Chancellor = lazy(() => import('@/pages/Chancellor'))
const Reports = lazy(() => import('@/pages/Reports'))
const Agenda = lazy(() => import('@/pages/Agenda'))
const Library = lazy(() => import('@/pages/Library'))
const MinutesDetail = lazy(() => import('@/pages/MinutesDetail'))
const Admin = lazy(() => import('@/pages/Admin'))
const MediaManager = lazy(() => import('@/pages/admin/MediaManager'))
const SiteSettings = lazy(() => import('@/pages/SiteSettings'))
const Profile = lazy(() => import('@/pages/Profile'))
const UserSettings = lazy(() => import('@/pages/UserSettings'))
const NotFound = lazy(() => import('@/pages/NotFound'))
const AccessDenied = lazy(() => import('@/pages/AccessDenied'))

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
)

function ThemeApplicator() {
  const {
    primaryColor,
    secondaryColor,
    fontFamily,
    typography,
    fetchSettings,
  } = useSiteSettingsStore()
  const { initialize } = useAuthStore()
  const { fetchPositions } = useLodgePositionsStore()

  useEffect(() => {
    fetchSettings()
    initialize().then(() => {
      // Carregar cargos após autenticação
      fetchPositions()
    })
  }, [fetchSettings, initialize, fetchPositions])

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

  useEffect(() => {
    // Aplicar estilos de tipografia globalmente
    const root = document.documentElement
    root.style.setProperty(
      '--typography-letter-spacing',
      typography.letterSpacing,
    )
    root.style.setProperty('--typography-line-height', typography.lineHeight)
    root.style.setProperty(
      '--typography-font-weight-base',
      typography.fontWeightBase,
    )
    root.style.setProperty(
      '--typography-font-weight-bold',
      typography.fontWeightBold,
    )
    root.style.setProperty('--typography-font-size-base', typography.fontSizeBase)
    root.style.setProperty('--typography-text-color', typography.textColor)
    root.style.setProperty(
      '--typography-text-color-muted',
      typography.textColorMuted,
    )
    root.style.setProperty(
      '--typography-text-transform',
      typography.textTransform,
    )
    root.style.setProperty(
      '--typography-text-decoration',
      typography.textDecoration,
    )
  }, [typography])

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
      <PWAInstallPrompt />
      <Toaster />
      <Sonner />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/access-denied" element={<AccessDenied />} />

          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route
              path="secretariat"
              element={
                <RoleGuard allowedRoles={['admin', 'editor']} requiredModule="secretariat">
                  <Secretariat />
                </RoleGuard>
              }
            />
            <Route
              path="secretariat/minutes/:id"
              element={
                <RoleGuard allowedRoles={['admin', 'editor']} requiredModule="secretariat">
                  <MinutesDetail />
                </RoleGuard>
              }
            />
            <Route
              path="financial"
              element={
                <RoleGuard allowedRoles={['admin', 'editor']} requiredModule="financial">
                  <Financial />
                </RoleGuard>
              }
            />
            <Route
              path="chancellor"
              element={
                <RoleGuard allowedRoles={['admin', 'editor']} requiredModule="chancellor">
                  <Chancellor />
                </RoleGuard>
              }
            />
            <Route
              path="reports"
              element={
                <RoleGuard allowedRoles={['admin', 'editor', 'member']} requiredModule="reports">
                  <Reports />
                </RoleGuard>
              }
            />
            <Route
              path="agenda"
              element={
                <RoleGuard allowedRoles={['admin', 'editor', 'member']}>
                  <Agenda />
                </RoleGuard>
              }
            />
            <Route
              path="library"
              element={
                <RoleGuard allowedRoles={['admin', 'editor', 'member']}>
                  <Library />
                </RoleGuard>
              }
            />

            <Route path="profile" element={<Profile />} />
            <Route path="settings/user" element={<UserSettings />} />
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
                <RoleGuard allowedRoles={['admin', 'editor', 'member']}>
                  <MediaManager />
                </RoleGuard>
              }
            />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </TooltipProvider>
  </BrowserRouter>
)

export default App
