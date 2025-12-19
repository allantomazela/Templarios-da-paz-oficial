import { useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LogoSettings } from '@/components/settings/LogoSettings'
import { InstitutionalSettings } from '@/components/settings/InstitutionalSettings'
import { VenerablesManager } from '@/components/settings/VenerablesManager'
import { LayoutSettings } from '@/components/settings/LayoutSettings'
import { ThemeSettings } from '@/components/settings/ThemeSettings'
import {
  LayoutTemplate,
  Users,
  FileText,
  Loader2,
  Palette,
  Grid,
} from 'lucide-react'
import useAuthStore from '@/stores/useAuthStore'
import useSiteSettingsStore from '@/stores/useSiteSettingsStore'
import { Navigate } from 'react-router-dom'

export default function SiteSettings() {
  const { user } = useAuthStore()
  const { fetchSettings, fetchVenerables, loading } = useSiteSettingsStore()

  useEffect(() => {
    fetchSettings()
    fetchVenerables()
  }, [fetchSettings, fetchVenerables])

  // Guard: Only Admin can access
  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Configurações do Site
        </h2>
        <p className="text-muted-foreground">
          Gerencie o conteúdo público, layout e aparência do portal da loja.
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="general">
            <LayoutTemplate className="mr-2 h-4 w-4" /> Geral & Logo
          </TabsTrigger>
          <TabsTrigger value="layout">
            <Grid className="mr-2 h-4 w-4" /> Layout Homepage
          </TabsTrigger>
          <TabsTrigger value="theme">
            <Palette className="mr-2 h-4 w-4" /> Tema & Cores
          </TabsTrigger>
          <TabsTrigger value="content">
            <FileText className="mr-2 h-4 w-4" /> Conteúdo Institucional
          </TabsTrigger>
          <TabsTrigger value="gallery">
            <Users className="mr-2 h-4 w-4" /> Galeria de Veneráveis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="grid gap-6">
            <LogoSettings />
          </div>
        </TabsContent>

        <TabsContent value="layout">
          <LayoutSettings />
        </TabsContent>

        <TabsContent value="theme">
          <ThemeSettings />
        </TabsContent>

        <TabsContent value="content">
          <InstitutionalSettings />
        </TabsContent>

        <TabsContent value="gallery">
          <VenerablesManager />
        </TabsContent>
      </Tabs>
    </div>
  )
}
