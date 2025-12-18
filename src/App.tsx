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

const App = () => (
  <BrowserRouter
    future={{ v7_startTransition: false, v7_relativeSplatPath: false }}
  >
    <TooltipProvider>
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
