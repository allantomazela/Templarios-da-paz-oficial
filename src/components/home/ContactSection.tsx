import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { MapPin, Mail, Phone, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import useSiteSettingsStore from '@/stores/useSiteSettingsStore'

const contactFormSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  message: z.string().min(10, 'Mensagem deve ter pelo menos 10 caracteres'),
})

interface ContactSectionProps {
  address: string
  city: string
  zip: string
  email: string
  secondaryEmail?: string
  phone?: string
  messageEmail?: string
}

export function ContactSection({
  address,
  city,
  zip,
  email,
  secondaryEmail,
  phone,
  messageEmail,
}: ContactSectionProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof contactFormSchema>>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: '',
      email: '',
      message: '',
    },
  })

  const onSubmit = async (data: z.infer<typeof contactFormSchema>) => {
    setIsSubmitting(true)
    try {
      // Salvar mensagem no banco de dados
      const { error: insertError } = await supabase
        .from('contact_messages')
        .insert({
          name: data.name,
          email: data.email,
          message: data.message,
          status: 'new',
        })

      if (insertError) {
        // Verificar se é erro de tabela não encontrada (404 ou PGRST116)
        if (
          insertError.code === 'PGRST116' ||
          insertError.message?.includes('relation') ||
          insertError.message?.includes('does not exist') ||
          insertError.message?.includes('404')
        ) {
          throw new Error(
            'A tabela de mensagens ainda não foi criada. Por favor, aplique a migração do banco de dados.',
          )
        }
        throw insertError
      }

      // Tentar enviar email via Edge Function (se disponível)
      const recipientEmail = messageEmail || email
      if (recipientEmail) {
        try {
          const { error: emailError } = await supabase.functions.invoke(
            'send-contact-email',
            {
              body: {
                to: recipientEmail,
                from: data.email,
                name: data.name,
                message: data.message,
                replyTo: data.email,
              },
            },
          )

          if (emailError) {
            // Log do erro mas não falha a operação
            console.warn('Erro ao enviar email (mensagem salva no banco):', emailError)
          }
        } catch (emailErr) {
          // Edge Function pode não existir ainda, não é crítico
          console.warn('Edge Function de email não disponível:', emailErr)
        }
      }

      toast({
        title: 'Mensagem Enviada',
        description:
          'Sua mensagem foi enviada com sucesso! Entraremos em contato em breve.',
      })

      form.reset()
    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao Enviar',
        description:
          error.message ||
          'Não foi possível enviar sua mensagem. Tente novamente mais tarde.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section
      id="contact"
      className="py-16 md:py-24 bg-primary text-primary-foreground scroll-mt-20"
    >
      <div className="container px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl mb-6">
              Entre em Contato
            </h2>
            <p className="text-primary-foreground/80 text-lg mb-8 max-w-[500px] leading-relaxed">
              Interessado em saber mais sobre nossa ordem ou nossa loja? Estamos
              à disposição para esclarecer suas dúvidas.
            </p>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <MapPin className="h-6 w-6 mt-1 opacity-80" />
                <div>
                  <h4 className="font-semibold text-lg">Endereço</h4>
                  <p className="opacity-80 leading-relaxed">{address}</p>
                  <p className="opacity-80 leading-relaxed">{city}</p>
                  <p className="opacity-80 leading-relaxed">{zip}</p>
                </div>
              </div>

              {phone && (
                <div className="flex items-start gap-4">
                  <Phone className="h-6 w-6 mt-1 opacity-80" />
                  <div>
                    <h4 className="font-semibold text-lg">Telefone</h4>
                    <p className="opacity-80 leading-relaxed">{phone}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-4">
                <Mail className="h-6 w-6 mt-1 opacity-80" />
                <div>
                  <h4 className="font-semibold text-lg">Email</h4>
                  <p className="opacity-80 leading-relaxed">{email}</p>
                  {secondaryEmail && (
                    <p className="opacity-80 leading-relaxed">{secondaryEmail}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-background text-foreground rounded-xl p-6 shadow-2xl">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Seu nome" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="seu@email.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mensagem</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Como podemos ajudar?"
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    'Enviar Mensagem'
                  )}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </section>
  )
}
