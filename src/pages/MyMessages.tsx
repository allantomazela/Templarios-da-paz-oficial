import { useEffect, useState, useMemo, useRef } from 'react'
import { Message } from '@/lib/data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Mail, Reply, Send, Plus } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { supabase } from '@/lib/supabase/client'
import { useAsyncOperation } from '@/hooks/use-async-operation'
import { Button } from '@/components/ui/button'
import { MessageDialog } from '@/components/secretariat/MessageDialog'
import { useDialog } from '@/hooks/use-dialog'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { logWarning } from '@/lib/logger'

type MessageFormValues = {
  recipientId: string
  subject: string
  content: string
}

export default function MyMessages() {
  const [messages, setMessages] = useState<Message[]>([])
  const [recipients, setRecipients] = useState<Array<{ id: string; name: string }>>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserName, setCurrentUserName] = useState<string>('Você')
  const dialog = useDialog()
  const [replyTo, setReplyTo] = useState<string | undefined>(undefined)
  const supabaseAny = supabase as any

  // Carregar destinatários separadamente
  const loadRecipients = useAsyncOperation(
    async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error('Usuário não autenticado.')
      }

      // Carregar lista de destinatários
      const { data: profileRows, error: profilesError } = await supabaseAny
        .from('profiles')
        .select('id, full_name')
        .neq('id', user.id)
        .order('full_name', { ascending: true })

      if (profilesError) {
        console.error('Erro ao carregar destinatários:', profilesError)
        throw new Error('Não foi possível carregar a lista de destinatários.')
      }

      // Filtrar apenas perfis com nome e mapear
      const recipientsList = (profileRows || [])
        .filter((p: any) => p.full_name) // Filtrar apenas perfis com nome
        .map((p: any) => ({
          id: p.id,
          name: p.full_name || 'Sem nome',
        }))

      setRecipients(recipientsList)
      return null
    },
    {
      showSuccessToast: false,
      errorMessage: 'Falha ao carregar destinatários.',
      showErrorToast: false, // Não mostrar toast de erro para não poluir a UI
    },
  )

  const loadMessages = useAsyncOperation(
    async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error('Usuário não autenticado.')
      }

      setCurrentUserId(user.id)

      // Buscar perfil sem .single() para evitar erro 406
      const { data: profileData, error: profileError } = await supabaseAny
        .from('profiles')
        .select('id, full_name')
        .eq('id', user.id)
        .limit(1)

      if (profileError) {
        console.error('Erro ao carregar perfil:', profileError)
        // Não lançar erro, usar valor padrão
        setCurrentUserName('Você')
      } else {
        const profile = profileData?.[0]
        setCurrentUserName(profile?.full_name || 'Você')
      }

      // Buscar mensagens enviadas e recebidas separadamente (mais confiável que .or())
      const [sentResult, receivedResult] = await Promise.all([
        supabaseAny
          .from('internal_messages')
          .select('*')
          .eq('sender_id', user.id)
          .order('created_at', { ascending: false }),
        supabaseAny
          .from('internal_messages')
          .select('*')
          .eq('recipient_id', user.id)
          .order('created_at', { ascending: false }),
      ])

      if (sentResult.error || receivedResult.error) {
        console.error('Erro ao carregar mensagens:', sentResult.error || receivedResult.error)
        throw new Error('Não foi possível carregar as mensagens.')
      }

      // Combinar e ordenar mensagens por data (mais recentes primeiro)
      const allRows = [
        ...(sentResult.data || []),
        ...(receivedResult.data || []),
      ].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

      const mappedMessages = allRows.map((row: any) => ({
        id: row.id,
        subject: row.subject,
        content: row.content,
        sender: row.sender_name,
        senderId: row.sender_id,
        recipients: [row.recipient_name],
        date: format(new Date(row.created_at), 'yyyy-MM-dd'),
        read: row.is_read || row.recipient_id !== user.id,
        type: row.recipient_id === user.id ? 'received' : 'sent',
      }))

      setMessages(mappedMessages)
      return null
    },
    {
      showSuccessToast: false,
      errorMessage: 'Falha ao carregar mensagens.',
    },
  )

  const sendOperation = useAsyncOperation(
    async (data: any) => {
      if (!currentUserId) {
        throw new Error('Usuário não autenticado.')
      }

      const recipient = recipients.find((r) => r.id === data.recipientId)
      if (!recipient) {
        throw new Error('Destinatário não encontrado.')
      }

      const { data: createdRows, error } = await supabaseAny
        .from('internal_messages')
        .insert({
          sender_id: currentUserId,
          sender_name: currentUserName,
          recipient_id: data.recipientId,
          recipient_name: recipient.name,
          subject: data.subject,
          content: data.content,
        })
        .select('*')

      if (error) {
        throw new Error('Falha ao enviar a mensagem.')
      }

      const newMessages = (createdRows || []).map((row: any) => ({
        id: row.id,
        subject: row.subject,
        content: row.content,
        sender: row.sender_name,
        senderId: row.sender_id,
        recipients: [row.recipient_name],
        date: format(new Date(row.created_at), 'yyyy-MM-dd'),
        read: row.is_read || row.recipient_id !== currentUserId,
        type: row.recipient_id === currentUserId ? 'received' : 'sent',
      }))

      setMessages((prev) => [...newMessages, ...prev])

      // Criar notificação
      const notificationsPayload = [{
        profile_id: data.recipientId,
        title: 'Nova Mensagem Interna',
        message: `Você recebeu uma mensagem: ${data.subject}`,
        link: '/dashboard/messages',
      }]

      const { error: notificationError } = await supabaseAny
        .from('notifications')
        .insert(notificationsPayload)

      if (notificationError) {
        logWarning('Falha ao criar notificações de mensagem', notificationError)
      }

      return 'Mensagem enviada com sucesso.'
    },
    {
      successMessage: 'Mensagem enviada com sucesso!',
      errorMessage: 'Falha ao enviar a mensagem.',
    },
  )

  const markAsRead = async (messageId: string) => {
    if (!currentUserId) return

    await supabaseAny
      .from('internal_messages')
      .update({ is_read: true })
      .eq('id', messageId)
      .eq('recipient_id', currentUserId)

    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, read: true } : msg,
      ),
    )
  }

  const handleSend = async (data: MessageFormValues) => {
    const result = await sendOperation.execute(data)
    if (result) {
      dialog.closeDialog()
      setReplyTo(undefined)
      loadMessages.execute()
    }
  }

  const openNew = () => {
    setReplyTo(undefined)
    dialog.openDialog()
  }

  const handleReply = (senderId: string) => {
    setReplyTo(senderId)
    dialog.openDialog()
  }

  const { execute: loadMessagesExecute, loading: loadMessagesLoading } = loadMessages
  const { execute: loadRecipientsExecute } = loadRecipients
  const receivedMessages = messages.filter((m) => m.type === 'received')
  const sentMessages = messages.filter((m) => m.type === 'sent')
  const unreadCount = receivedMessages.filter((m) => !m.read).length
  const hasLoadedRef = useRef(false)

  useEffect(() => {
    // Evitar loop infinito: só executar uma vez
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true
      // Carregar mensagens e destinatários em paralelo
      loadMessagesExecute()
      loadRecipientsExecute()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Minhas Mensagens</h2>
          <p className="text-muted-foreground">
            Visualize e gerencie suas mensagens internas.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Mensagem
        </Button>
      </div>

      <Tabs defaultValue="received" className="space-y-4">
        <TabsList>
          <TabsTrigger value="received">
            Recebidas
            {unreadCount > 0 && (
              <Badge className="ml-2">{unreadCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent">Enviadas</TabsTrigger>
        </TabsList>

        <TabsContent value="received">
          <Card>
            <CardHeader>
              <CardTitle>Mensagens Recebidas</CardTitle>
            </CardHeader>
            <CardContent>
              {loadMessagesLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando mensagens...
                </div>
              ) : receivedMessages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma mensagem recebida.
                </div>
              ) : (
                <Accordion type="single" collapsible className="w-full">
                  {receivedMessages.map((message) => (
                    <AccordionItem key={message.id} value={message.id}>
                      <AccordionTrigger
                        onClick={() => !message.read && markAsRead(message.id)}
                        className={!message.read ? 'font-semibold' : ''}
                      >
                        <div className="flex items-center gap-2 flex-1 text-left">
                          <Mail className="h-4 w-4" />
                          <span className="flex-1">{message.subject}</span>
                          {!message.read && (
                            <Badge variant="default" className="ml-2">
                              Nova
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(message.date), 'dd/MM/yyyy', {
                              locale: ptBR,
                            })}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pt-2">
                          <div>
                            <p className="text-sm text-muted-foreground">
                              De: {message.sender}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Data: {format(new Date(message.date), 'dd/MM/yyyy HH:mm', {
                                locale: ptBR,
                              })}
                            </p>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">
                            {message.content}
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReply(message.senderId)}
                          >
                            <Reply className="mr-2 h-4 w-4" />
                            Responder
                          </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sent">
          <Card>
            <CardHeader>
              <CardTitle>Mensagens Enviadas</CardTitle>
            </CardHeader>
            <CardContent>
              {sentMessages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma mensagem enviada.
                </div>
              ) : (
                <Accordion type="single" collapsible className="w-full">
                  {sentMessages.map((message) => (
                    <AccordionItem key={message.id} value={message.id}>
                      <AccordionTrigger>
                        <div className="flex items-center gap-2 flex-1 text-left">
                          <Send className="h-4 w-4" />
                          <span className="flex-1">{message.subject}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(message.date), 'dd/MM/yyyy', {
                              locale: ptBR,
                            })}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pt-2">
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Para: {message.recipients.join(', ')}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Data: {format(new Date(message.date), 'dd/MM/yyyy HH:mm', {
                                locale: ptBR,
                              })}
                            </p>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">
                            {message.content}
                          </p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <MessageDialog
        open={dialog.open}
        onOpenChange={dialog.onOpenChange}
        defaultRecipient={replyTo}
        recipients={recipients}
        onSend={handleSend}
      />
    </div>
  )
}
