import { lazy, Suspense, useState, type ReactNode } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { DashboardModuleLoader } from '@/components/DashboardModuleLoader'

const BrothersList = lazy(() =>
  import('@/components/secretariat/BrothersList').then((m) => ({
    default: m.BrothersList,
  })),
)
const NoticesList = lazy(() =>
  import('@/components/secretariat/NoticesList').then((m) => ({
    default: m.NoticesList,
  })),
)
const MessagesList = lazy(() =>
  import('@/components/secretariat/MessagesList').then((m) => ({
    default: m.MessagesList,
  })),
)
const ContactMessagesList = lazy(() =>
  import('@/components/secretariat/ContactMessagesList').then((m) => ({
    default: m.ContactMessagesList,
  })),
)
const DocumentsList = lazy(() =>
  import('@/components/secretariat/DocumentsList').then((m) => ({
    default: m.DocumentsList,
  })),
)
const CandidatesList = lazy(() =>
  import('@/components/secretariat/CandidatesList').then((m) => ({
    default: m.CandidatesList,
  })),
)
const MinutesList = lazy(() =>
  import('@/components/minutes/MinutesList').then((m) => ({
    default: m.MinutesList,
  })),
)

type SecretariatTab =
  | 'brothers'
  | 'indications'
  | 'communications'
  | 'docs'
  | 'minutes'

type CommunicationsTab = 'notices' | 'messages' | 'contact'

function SecretariatTabPanel({
  active,
  children,
}: {
  active: boolean
  children: ReactNode
}) {
  if (!active) return null
  return <Suspense fallback={<DashboardModuleLoader />}>{children}</Suspense>
}

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
          <SecretariatTabPanel active={activeTab === 'brothers'}>
            <BrothersList />
          </SecretariatTabPanel>
        </TabsContent>

        <TabsContent value="indications">
          <SecretariatTabPanel active={activeTab === 'indications'}>
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
          </SecretariatTabPanel>
        </TabsContent>

        <TabsContent value="communications" className="space-y-4">
          {activeTab === 'communications' ? (
            <Tabs
              value={communicationsTab}
              onValueChange={(value) =>
                setCommunicationsTab(value as CommunicationsTab)
              }
            >
              <div className="mb-4 flex items-center justify-between">
                <TabsList>
                  <TabsTrigger value="notices">Mural de Avisos</TabsTrigger>
                  <TabsTrigger value="messages">Mensagens Internas</TabsTrigger>
                  <TabsTrigger value="contact">Mensagens do Site</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="notices">
                <SecretariatTabPanel active={communicationsTab === 'notices'}>
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
                </SecretariatTabPanel>
              </TabsContent>

              <TabsContent value="messages">
                <SecretariatTabPanel active={communicationsTab === 'messages'}>
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
                </SecretariatTabPanel>
              </TabsContent>

              <TabsContent value="contact">
                <SecretariatTabPanel active={communicationsTab === 'contact'}>
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
                </SecretariatTabPanel>
              </TabsContent>
            </Tabs>
          ) : null}
        </TabsContent>

        <TabsContent value="docs">
          <SecretariatTabPanel active={activeTab === 'docs'}>
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
          </SecretariatTabPanel>
        </TabsContent>

        <TabsContent value="minutes">
          <SecretariatTabPanel active={activeTab === 'minutes'}>
            <MinutesList />
          </SecretariatTabPanel>
        </TabsContent>
      </Tabs>
    </div>
  )
}
