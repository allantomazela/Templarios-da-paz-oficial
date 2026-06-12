import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BrothersList } from '@/components/secretariat/BrothersList'
import { NoticesList } from '@/components/secretariat/NoticesList'
import { MessagesList } from '@/components/secretariat/MessagesList'
import { ContactMessagesList } from '@/components/secretariat/ContactMessagesList'
import { DocumentsList } from '@/components/secretariat/DocumentsList'
import { CandidatesList } from '@/components/secretariat/CandidatesList'
import { MinutesList } from '@/components/minutes/MinutesList'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

type SecretariatTab =
  | 'brothers'
  | 'indications'
  | 'communications'
  | 'docs'
  | 'minutes'

type CommunicationsTab = 'notices' | 'messages' | 'contact'

export default function Secretariat() {
  const [activeTab, setActiveTab] = useState<SecretariatTab>('brothers')
  const [communicationsTab, setCommunicationsTab] =
    useState<CommunicationsTab>('notices')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Secretaria</h2>
        <p className="text-muted-foreground">
          Gestão de irmãos, comunicações e documentação oficial da loja.
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as SecretariatTab)}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="brothers">Irmãos</TabsTrigger>
          <TabsTrigger value="indications">Indicações</TabsTrigger>
          <TabsTrigger value="communications">Comunicações</TabsTrigger>
          <TabsTrigger value="docs">Documentos</TabsTrigger>
          <TabsTrigger value="minutes">Atas e Balaústres</TabsTrigger>
        </TabsList>

        <TabsContent value="brothers">
          {activeTab === 'brothers' ? <BrothersList /> : null}
        </TabsContent>

        <TabsContent value="indications">
          {activeTab === 'indications' ? (
            <Card>
              <CardHeader>
                <CardTitle>Candidatos à iniciação</CardTitle>
                <CardDescription>
                  Acompanhamento das indicações e das fases da sindicância
                  (documentação, entrevistas, visita à loja, parecer, votação).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CandidatesList />
              </CardContent>
            </Card>
          ) : null}
        </TabsContent>

        <TabsContent value="communications" className="space-y-4">
          {activeTab === 'communications' ? (
            <Tabs
              value={communicationsTab}
              onValueChange={(value) =>
                setCommunicationsTab(value as CommunicationsTab)
              }
            >
              <div className="flex items-center justify-between mb-4">
                <TabsList>
                  <TabsTrigger value="notices">Mural de Avisos</TabsTrigger>
                  <TabsTrigger value="messages">Mensagens Internas</TabsTrigger>
                  <TabsTrigger value="contact">Mensagens do Site</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="notices">
                {communicationsTab === 'notices' ? (
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
                ) : null}
              </TabsContent>

              <TabsContent value="messages">
                {communicationsTab === 'messages' ? (
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
                ) : null}
              </TabsContent>

              <TabsContent value="contact">
                {communicationsTab === 'contact' ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Mensagens do Site</CardTitle>
                      <CardDescription>
                        Mensagens enviadas através do formulário de contato do
                        site.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ContactMessagesList />
                    </CardContent>
                  </Card>
                ) : null}
              </TabsContent>
            </Tabs>
          ) : null}
        </TabsContent>

        <TabsContent value="docs">
          {activeTab === 'docs' ? (
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
          ) : null}
        </TabsContent>

        <TabsContent value="minutes">
          {activeTab === 'minutes' ? <MinutesList /> : null}
        </TabsContent>
      </Tabs>
    </div>
  )
}
