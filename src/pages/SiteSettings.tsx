import { useEffect, useState } from 'react'
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function SiteSettings() {
  const { user } = useAuthStore()
  const { fetchSettings, fetchVenerables, loading } = useSiteSettingsStore()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Fetch data only once on mount
    const loadData = async () => {
      try {
        setError(null)
        await Promise.all([fetchSettings(), fetchVenerables()])
      } catch (err) {
        console.error('Error loading site settings:', err)
        setError('Erro ao carregar configurações. Tente novamente.')
      }
    }
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty dependency array to run only once

  // RoleGuard already handles permission check, but keep this as fallback
  if (!user) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const isAdmin = user?.role === 'admin'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <p className="text-destructive">{error}</p>
        <Button onClick={() => window.location.reload()}>
          Recarregar Página
        </Button>
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

      <Tabs defaultValue={isAdmin ? "general" : "content"} className="space-y-4">
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
