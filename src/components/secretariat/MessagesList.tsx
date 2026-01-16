import { useEffect, useMemo, useState, useRef } from 'react'
import { Message } from '@/lib/data'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Mail, Reply, Send } from 'lucide-react'
import { MessageDialog } from './MessageDialog'
import { useDialog } from '@/hooks/use-dialog'
import { useAsyncOperation } from '@/hooks/use-async-operation'
import { format } from 'date-fns'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { supabase } from '@/lib/supabase/client'
import { logWarning } from '@/lib/logger'

export function MessagesList() {
  const [messages, setMessages] = useState<Message[]>([])
  const [recipients, setRecipients] = useState<Array<{ id: string; name: string }>>(
    [],
  )
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserName, setCurrentUserName] = useState<string>('Você')
  const dialog = useDialog()
  const [replyTo, setReplyTo] = useState<string | undefined>(undefined)
  const supabaseAny = supabase as any

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

      const { data: profile, error: profileError } = await supabaseAny
        .from('profiles')
        .select('id, full_name')
        .eq('id', user.id)
        .single()

      if (profileError) {
        throw new Error('Não foi possível carregar o perfil do usuário.')
      }

      setCurrentUserName(profile?.full_name || 'Você')

      const { data: rows, error } = await supabaseAny
        .from('internal_messages')
        .select('*')
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error('Não foi possível carregar as mensagens.')
      }

      const mappedMessages = (rows || []).map((row: any) => ({
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

      const { data: profileRows, error: profilesError } = await supabaseAny
        .from('profiles')
        .select('id, full_name')
        .order('full_name', { ascending: true })

      if (profilesError) {
        setRecipients([])
        return null
      }

      const list = (profileRows || [])
        .filter((profile: any) => profile?.id && profile?.full_name)
        .map((profile: any) => ({
          id: profile.id,
          name: profile.full_name,
        }))

      setRecipients(list)
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

      const recipientList =
        data.recipientId === 'ALL'
          ? recipients
          : recipients.filter((recipient) => recipient.id === data.recipientId)

      if (recipientList.length === 0) {
        throw new Error('Selecione um destinatário válido.')
      }

      const payload = recipientList.map((recipient) => ({
        sender_id: currentUserId,
        sender_name: currentUserName,
        recipient_id: recipient.id,
        recipient_name: recipient.name,
        subject: data.subject,
        content: data.content,
        is_read: recipient.id === currentUserId,
      }))

      const { data: createdRows, error } = await supabaseAny
        .from('internal_messages')
        .insert(payload)
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

      if (recipientList.length > 0) {
        const notificationsPayload = recipientList.map((recipient) => ({
          profile_id: recipient.id,
          title: 'Nova Mensagem Interna',
          message: `Você recebeu uma mensagem: ${data.subject}`,
          link: '/dashboard/secretariat?tab=messages',
        }))

        const { error: notificationError } = await supabaseAny
          .from('notifications')
          .insert(notificationsPayload)

        if (notificationError) {
          logWarning('Falha ao criar notificações de mensagem', notificationError)
        }
      }

      return 'Mensagem enviada com sucesso.'
    },
    {
      successMessage: 'Mensagem enviada com sucesso!',
      errorMessage: 'Falha ao enviar a mensagem.',
    },
  )

  const handleSend = async (data: any) => {
    const result = await sendOperation.execute(data)
    if (result) {
      dialog.closeDialog()
      setReplyTo(undefined)
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

  const { execute: loadMessagesExecute, loading: loadMessagesLoading } =
    loadMessages
  const receivedMessages = messages.filter((m) => m.type === 'received')
  const sentMessages = messages.filter((m) => m.type === 'sent')
  const recipientOptions = useMemo(
    () => [
      { id: 'ALL', name: 'Todos os Irmãos' },
      ...recipients,
    ],
    [recipients],
  )

  const hasLoadedRef = useRef(false)

  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true
      loadMessagesExecute()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const markAsRead = async (messageId: string) => {
    if (!currentUserId) return

    setMessages((prev) =>
      prev.map((message) =>
        message.id === messageId ? { ...message, read: true } : message,
      ),
    )

    await supabaseAny
      .from('internal_messages')
      .update({ is_read: true })
      .eq('id', messageId)
      .eq('recipient_id', currentUserId)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Caixa de Mensagens</h3>
        <Button onClick={openNew} disabled={loadMessagesLoading}>
          <Send className="mr-2 h-4 w-4" /> Nova Mensagem
        </Button>
      </div>

      <Tabs defaultValue="received" className="w-full">
        <TabsList>
          <TabsTrigger value="received">Recebidas</TabsTrigger>
          <TabsTrigger value="sent">Enviadas</TabsTrigger>
        </TabsList>

        <TabsContent value="received" className="mt-4">
          {loadMessagesLoading ? (
            <div className="text-center py-8 text-muted-foreground border rounded-md">
              Carregando mensagens...
            </div>
          ) : receivedMessages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border rounded-md">
              Nenhuma mensagem recebida.
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {receivedMessages.map((msg) => (
                <AccordionItem key={msg.id} value={msg.id}>
                  <AccordionTrigger
                    className="hover:no-underline"
                    onClick={() => markAsRead(msg.id)}
                  >
                    <div className="flex items-center gap-4 text-left w-full">
                      <Mail
                        className={`h-4 w-4 ${msg.read ? 'text-muted-foreground' : 'text-primary'}`}
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-sm">
                          {msg.subject}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          De: {msg.sender} • {msg.date}
                        </div>
                      </div>
                      {!msg.read && <Badge variant="secondary">Nova</Badge>}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-4 bg-muted/20 rounded-b-md">
                    <div className="space-y-4">
                      <p className="text-sm">{msg.content}</p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReply(msg.sender)}
                      >
                        <Reply className="mr-2 h-4 w-4" /> Responder
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </TabsContent>

        <TabsContent value="sent" className="mt-4">
          <div className="space-y-2">
            {sentMessages.map((msg) => (
              <Card key={msg.id}>
                <CardHeader className="py-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-medium">
                      {msg.subject}
                    </CardTitle>
                    <span className="text-xs text-muted-foreground">
                      {msg.date}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Para: {msg.recipients.join(', ')}
                  </div>
                </CardHeader>
                <CardContent className="py-3 pt-0">
                  <p className="text-sm text-muted-foreground">{msg.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <MessageDialog
        open={dialog.open}
        onOpenChange={dialog.onOpenChange}
        onSend={handleSend}
        defaultRecipient={replyTo}
        recipients={recipientOptions}
      />
    </div>
  )
}
