import { useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LogoSettings } from '@/components/settings/LogoSettings'
import { SeoSettings } from '@/components/settings/SeoSettings'
import { InstitutionalSettings } from '@/components/settings/InstitutionalSettings'
import { VenerablesManager } from '@/components/settings/VenerablesManager'
import { LayoutSettings } from '@/components/settings/LayoutSettings'
import { ThemeSettings } from '@/components/settings/ThemeSettings'
import { AuditLogViewer } from '@/components/admin/AuditLogViewer'
import {
  LayoutTemplate,
  Users,
  FileText,
  Loader2,
  Palette,
  Grid,
  History,
} from 'lucide-react'
import useAuthStore from '@/stores/useAuthStore'
import useSiteSettingsStore from '@/stores/useSiteSettingsStore'
import { Navigate } from 'react-router-dom'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function SiteSettings() {
  const { user } = useAuthStore()
  const { fetchSettings, fetchVenerables, loading } = useSiteSettingsStore()

  useEffect(() => {
    fetchSettings()
    fetchVenerables()
  }, [fetchSettings, fetchVenerables])

  if (user?.role !== 'admin' && user?.role !== 'editor') {
    return <Navigate to="/dashboard" replace />
  }

  const isAdmin = user?.role === 'admin'

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
          Gerencie o conteúdo público, identidade visual e SEO da plataforma.
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto">
          {isAdmin && (
            <TabsTrigger value="general">
              <LayoutTemplate className="mr-2 h-4 w-4" /> Identidade & SEO
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="theme">
              <Palette className="mr-2 h-4 w-4" /> Tema & Visual
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="layout">
              <Grid className="mr-2 h-4 w-4" /> Layout Homepage
            </TabsTrigger>
          )}
          <TabsTrigger value="content">
            <FileText className="mr-2 h-4 w-4" /> Conteúdo Institucional
          </TabsTrigger>
          <TabsTrigger value="gallery">
            <Users className="mr-2 h-4 w-4" /> Galeria de Veneráveis
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="history">
              <History className="mr-2 h-4 w-4" /> Histórico
            </TabsTrigger>
          )}
        </TabsList>

        {isAdmin && (
          <>
            <TabsContent value="general">
              <div className="grid gap-6">
                <LogoSettings />
                <SeoSettings />
              </div>
            </TabsContent>
            <TabsContent value="theme">
              <ThemeSettings />
            </TabsContent>
            <TabsContent value="layout">
              <LayoutSettings />
            </TabsContent>
            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Alterações</CardTitle>
                  <CardDescription>
                    Registro de auditoria de alterações no sistema e
                    configurações.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AuditLogViewer />
                </CardContent>
              </Card>
            </TabsContent>
          </>
        )}

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
