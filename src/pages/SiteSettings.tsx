import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LogoSettings } from '@/components/settings/LogoSettings'
import { InstitutionalSettings } from '@/components/settings/InstitutionalSettings'
import { VenerablesManager } from '@/components/settings/VenerablesManager'
import { LayoutTemplate, Users, FileText } from 'lucide-react'
import useAuthStore from '@/stores/useAuthStore'
import { Navigate } from 'react-router-dom'

export default function SiteSettings() {
  const { user } = useAuthStore()

  // Guard: Only Admin or Master can access
  if (user?.role !== 'Administrador' && user?.role !== 'Mestre') {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Configurações do Site
        </h2>
        <p className="text-muted-foreground">
          Gerencie o conteúdo público do portal da loja.
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">
            <LayoutTemplate className="mr-2 h-4 w-4" /> Geral & Logo
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
