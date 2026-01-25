import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FormHeader } from '@/components/ui/form-header'
import { Mail } from 'lucide-react'

const messageSchema = z.object({
  recipientId: z.string().min(1, 'Destinatário é obrigatório'),
  subject: z.string().min(1, 'Assunto é obrigatório'),
  content: z.string().min(1, 'Conteúdo é obrigatório'),
})

type MessageFormValues = z.infer<typeof messageSchema>

interface MessageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSend: (data: MessageFormValues) => void
  defaultRecipient?: string
  recipients: Array<{ id: string; name: string }>
}

export function MessageDialog({
  open,
  onOpenChange,
  onSend,
  defaultRecipient,
  recipients,
}: MessageDialogProps) {
  const form = useForm<MessageFormValues>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      recipientId: defaultRecipient || '',
      subject: '',
      content: '',
    },
  })

  useEffect(() => {
    if (defaultRecipient) {
      form.setValue('recipientId', defaultRecipient)
    }
  }, [defaultRecipient, form])

  const handleSubmit = (data: MessageFormValues) => {
    onSend(data)
    form.reset()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <FormHeader
          title="Nova Mensagem"
          description="Envie uma mensagem interna para outro irmão da loja."
          icon={<Mail className="h-5 w-5" />}
        />
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="recipientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Para</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o destinatário" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {recipients.map((recipient) => (
                        <SelectItem key={recipient.id} value={recipient.id}>
                          {recipient.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assunto</FormLabel>
                  <FormControl>
                    <Input placeholder="Assunto da mensagem" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mensagem</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Escreva sua mensagem aqui..."
                      className="min-h-[150px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Enviar Mensagem</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
