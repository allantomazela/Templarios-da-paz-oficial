import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Event } from '@/lib/data'
import { Send, Mail, CheckCircle2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import useChancellorStore from '@/stores/useChancellorStore'

interface EventNotificationsProps {
  event: Event
}

export function EventNotifications({ event }: EventNotificationsProps) {
  const { toast } = useToast()
  const { brothers } = useChancellorStore()
  const [template, setTemplate] = useState('invitation')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)

  const activeBrothersCount = brothers.filter(
    (b) => b.status === 'Ativo',
  ).length

  const templates: Record<string, { subject: string; body: string }> = {
    invitation: {
      subject: `Convite: ${event.title}`,
      body: `Prezado Irmão,\n\nConvocamos vossa presença para o evento "${event.title}", a realizar-se no dia ${event.date} às ${event.time}, no local ${event.location}.\n\nContamos com sua presença.\n\nFraternalmente,\nA Secretaria.`,
    },
    reminder: {
      subject: `Lembrete: ${event.title} é amanhã`,
      body: `Prezado Irmão,\n\nLembramos que o evento "${event.title}" ocorrerá em breve. Não esqueça de confirmar sua presença.\n\nDetalhes: ${event.description || 'Sem detalhes adicionais.'}\n\nFraternalmente,\nA Secretaria.`,
    },
    cancellation: {
      subject: `CANCELAMENTO: ${event.title}`,
      body: `Prezado Irmão,\n\nInformamos com pesar que o evento "${event.title}" agendado para ${event.date} foi CANCELADO.\n\nAguarde novas instruções.\n\nFraternalmente,\nA Secretaria.`,
    },
  }

  useEffect(() => {
    if (templates[template]) {
      setSubject(templates[template].subject)
      setMessage(templates[template].body)
    }
  }, [template, event])

  const handleSend = () => {
    setIsSending(true)
    // Simulate API call delay
    setTimeout(() => {
      setIsSending(false)
      toast({
        title: 'Notificações Enviadas',
        description: `Email enviado para ${activeBrothersCount} irmãos ativos com sucesso.`,
      })
    }, 1500)
  }

  return (
    <div className="space-y-6 py-2">
      <Card className="bg-muted/30">
        <CardContent className="pt-6 pb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-full text-primary">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">Comunicação em Massa</h3>
              <p className="text-xs text-muted-foreground">
                Envie emails para todos os {activeBrothersCount} membros ativos.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Modelo de Email</Label>
          <Select value={template} onValueChange={setTemplate}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="invitation">Convite Padrão</SelectItem>
              <SelectItem value="reminder">Lembrete de Evento</SelectItem>
              <SelectItem value="cancellation">
                Aviso de Cancelamento
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Assunto</Label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Assunto do email"
          />
        </div>

        <div className="space-y-2">
          <Label>Mensagem</Label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[200px]"
            placeholder="Corpo do email..."
          />
        </div>

        <Button
          className="w-full"
          onClick={handleSend}
          disabled={isSending || !subject || !message}
        >
          {isSending ? (
            <CheckCircle2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          {isSending
            ? 'Enviando...'
            : `Enviar para ${activeBrothersCount} Irmãos`}
        </Button>
      </div>
    </div>
  )
}
