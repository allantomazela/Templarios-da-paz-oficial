import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BrothersList } from '@/components/secretariat/BrothersList'
import { NoticesList } from '@/components/secretariat/NoticesList'
import { MessagesList } from '@/components/secretariat/MessagesList'
import { DocumentsList } from '@/components/secretariat/DocumentsList'
import { MinutesList } from '@/components/minutes/MinutesList'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function Secretariat() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Secretaria</h2>
        <p className="text-muted-foreground">
          Gestão de irmãos, comunicações e documentação oficial da loja.
        </p>
      </div>

      <Tabs defaultValue="brothers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="brothers">Irmãos</TabsTrigger>
          <TabsTrigger value="communications">Comunicações</TabsTrigger>
          <TabsTrigger value="docs">Documentos</TabsTrigger>
          <TabsTrigger value="minutes">Atas e Balaústres</TabsTrigger>
        </TabsList>

        <TabsContent value="brothers">
          <BrothersList />
        </TabsContent>

        <TabsContent value="communications" className="space-y-4">
          <Tabs defaultValue="notices">
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="notices">Mural de Avisos</TabsTrigger>
                <TabsTrigger value="messages">Mensagens Internas</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="notices">
              <Card>
                <CardHeader>
                  <CardTitle>Mural de Avisos</CardTitle>
                  <CardDescription>
                    Gerencie os avisos oficiais da loja.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <NoticesList />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="messages">
              <Card>
                <CardHeader>
                  <CardTitle>Mensagens Internas</CardTitle>
                  <CardDescription>
                    Comunicação direta entre irmãos.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MessagesList />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="docs">
          <Card>
            <CardHeader>
              <CardTitle>Documentos da Loja</CardTitle>
              <CardDescription>
                Gerencie o acervo digital de documentos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentsList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="minutes">
          <MinutesList />
        </TabsContent>
      </Tabs>
    </div>
  )
}
