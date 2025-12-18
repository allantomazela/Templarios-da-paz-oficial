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
import SiteSettings from '@/pages/SiteSettings'
import NotFound from '@/pages/NotFound'
import { useEffect } from 'react'
import useSiteSettingsStore from '@/stores/useSiteSettingsStore'

// Component to apply theme globally from App level
function ThemeApplicator() {
  const { primaryColor, fetchSettings } = useSiteSettingsStore()

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  useEffect(() => {
    if (primaryColor) {
      // Helper logic repeated or imported - duplicating logic for reliability in separate bundles if needed,
      // but assuming shared utility logic is better. Reusing the Index.tsx logic here for simplicity.
      // Actually, since Index applies it too, we might get double application but that's safe.
      // Better to apply it here for the Admin dashboard too.

      const hexToHSL = (hex: string) => {
        if (!hex) return '211 100% 50%'
        let r = 0,
          g = 0,
          b = 0
        if (hex.length === 4) {
          r = parseInt('0x' + hex[1] + hex[1])
          g = parseInt('0x' + hex[2] + hex[2])
          b = parseInt('0x' + hex[3] + hex[3])
        } else if (hex.length === 7) {
          r = parseInt('0x' + hex[1] + hex[2])
          g = parseInt('0x' + hex[3] + hex[4])
          b = parseInt('0x' + hex[5] + hex[6])
        }
        r /= 255
        g /= 255
        b /= 255
        const cmin = Math.min(r, g, b),
          cmax = Math.max(r, g, b),
          delta = cmax - cmin
        let h = 0,
          s = 0,
          l = 0
        if (delta === 0) h = 0
        else if (cmax === r) h = ((g - b) / delta) % 6
        else if (cmax === g) h = (b - r) / delta + 2
        else h = (r - g) / delta + 4
        h = Math.round(h * 60)
        if (h < 0) h += 360
        l = (cmax + cmin) / 2
        s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1))
        s = +(s * 100).toFixed(1)
        l = +(l * 100).toFixed(1)
        return `${h} ${s}% ${l}%`
      }

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
          <Route path="settings" element={<SiteSettings />} />
          <Route path="admin" element={<Admin />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </TooltipProvider>
  </BrowserRouter>
)

export default App
