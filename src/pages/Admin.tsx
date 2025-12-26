import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, Shield, History, ArrowRightLeft, Gauge, Crown } from 'lucide-react'
import { UserManagement } from '@/components/admin/UserManagement'
import { AuditLogViewer } from '@/components/admin/AuditLogViewer'
import { RedirectsManager } from '@/components/admin/RedirectsManager'
import { ImageOptimizer } from '@/components/admin/ImageOptimizer'
import { LodgePositionsManager } from '@/components/admin/LodgePositionsManager'

export default function Admin() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Gestão de Usuários e Sistema
        </h2>
        <p className="text-muted-foreground">
          Controle centralizado de perfis, permissões, redirecionamentos e
          performance.
        </p>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="users">
            <Users className="mr-2 h-4 w-4" /> Gestão de Perfis
          </TabsTrigger>
          <TabsTrigger value="positions">
            <Crown className="mr-2 h-4 w-4" /> Cargos Maçônicos
          </TabsTrigger>
          <TabsTrigger value="redirects">
            <ArrowRightLeft className="mr-2 h-4 w-4" /> Redirecionamentos
          </TabsTrigger>
          <TabsTrigger value="performance">
            <Gauge className="mr-2 h-4 w-4" /> Performance & Imagens
          </TabsTrigger>
          <TabsTrigger value="audit">
            <History className="mr-2 h-4 w-4" /> Histórico (Logs)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Controle de Acesso
              </CardTitle>
              <CardDescription>
                Gerencie cadastros, aprove novos membros, defina graus maçônicos
                e atribua funções administrativas (Admin, Editor).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="positions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                Gestão de Cargos Maçônicos
              </CardTitle>
              <CardDescription>
                Atribua e gerencie os cargos da diretoria da loja (Venerável
                Mestre, Secretário, Chanceler, Tesoureiro, Orador). Cada cargo
                possui permissões específicas de acesso aos módulos do sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LodgePositionsManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="redirects" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <RedirectsManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <ImageOptimizer />
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                Auditoria do Sistema
              </CardTitle>
              <CardDescription>
                Registro completo de todas as alterações críticas realizadas no
                painel administrativo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AuditLogViewer />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
