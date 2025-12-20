import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Newspaper, Users, Shield } from 'lucide-react'
import { NewsManager } from '@/components/admin/NewsManager'
import { UserManagement } from '@/components/admin/UserManagement'

export default function Admin() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Painel Administrativo
        </h2>
        <p className="text-muted-foreground">
          Gestão centralizada de usuários, permissões e conteúdo do portal.
        </p>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">
            <Users className="mr-2 h-4 w-4" /> Gestão de Usuários
          </TabsTrigger>
          <TabsTrigger value="news">
            <Newspaper className="mr-2 h-4 w-4" /> Notícias e Eventos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Controle de Acesso e Perfis
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

        <TabsContent value="news">
          <NewsManager />
        </TabsContent>
      </Tabs>
    </div>
  )
}
