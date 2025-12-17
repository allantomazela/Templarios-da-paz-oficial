import { useState } from 'react'
import { Message, mockMessages } from '@/lib/data'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Mail, Reply, Send } from 'lucide-react'
import { MessageDialog } from './MessageDialog'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

export function MessagesList() {
  const [messages, setMessages] = useState<Message[]>(mockMessages)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [replyTo, setReplyTo] = useState<string | undefined>(undefined)
  const { toast } = useToast()

  const handleSend = (data: any) => {
    const newMessage: Message = {
      id: String(messages.length + 1),
      date: format(new Date(), 'yyyy-MM-dd'),
      sender: 'Você',
      senderId: 'me',
      recipients: [data.recipient],
      read: true,
      type: 'sent',
      ...data,
    }
    setMessages([newMessage, ...messages])
    toast({ title: 'Enviada', description: 'Mensagem enviada com sucesso.' })
    setIsDialogOpen(false)
    setReplyTo(undefined)
  }

  const openNew = () => {
    setReplyTo(undefined)
    setIsDialogOpen(true)
  }

  const handleReply = (sender: string) => {
    setReplyTo(sender) // Simplification for mock
    setIsDialogOpen(true)
  }

  const receivedMessages = messages.filter((m) => m.type === 'received')
  const sentMessages = messages.filter((m) => m.type === 'sent')

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Caixa de Mensagens</h3>
        <Button onClick={openNew}>
          <Send className="mr-2 h-4 w-4" /> Nova Mensagem
        </Button>
      </div>

      <Tabs defaultValue="received" className="w-full">
        <TabsList>
          <TabsTrigger value="received">Recebidas</TabsTrigger>
          <TabsTrigger value="sent">Enviadas</TabsTrigger>
        </TabsList>

        <TabsContent value="received" className="mt-4">
          {receivedMessages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border rounded-md">
              Nenhuma mensagem recebida.
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {receivedMessages.map((msg) => (
                <AccordionItem key={msg.id} value={msg.id}>
                  <AccordionTrigger className="hover:no-underline">
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
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSend={handleSend}
        defaultRecipient={replyTo}
      />
    </div>
  )
}
