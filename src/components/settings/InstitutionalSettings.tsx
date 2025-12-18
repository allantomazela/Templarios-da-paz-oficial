import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import useSiteSettingsStore from '@/stores/useSiteSettingsStore'
import { useToast } from '@/hooks/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2 } from 'lucide-react'

const institutionalSchema = z.object({
  historyTitle: z.string().min(1, 'Título é obrigatório'),
  historyText: z.string().min(10, 'Texto histórico muito curto'),
  historyImageUrl: z.string().optional(),
  libertyText: z.string().min(10, 'Descrição obrigatória'),
  equalityText: z.string().min(10, 'Descrição obrigatória'),
  fraternityText: z.string().min(10, 'Descrição obrigatória'),
  address: z.string().min(1, 'Endereço obrigatório'),
  city: z.string().min(1, 'Cidade obrigatória'),
  zip: z.string().min(1, 'CEP obrigatório'),
  email: z.string().email('Email inválido'),
  secondaryEmail: z.string().optional(),
})

export function InstitutionalSettings() {
  const {
    history,
    values,
    contact,
    updateHistory,
    updateValues,
    updateContact,
  } = useSiteSettingsStore()
  const { toast } = useToast()

  const form = useForm({
    resolver: zodResolver(institutionalSchema),
    defaultValues: {
      historyTitle: history.title,
      historyText: history.text,
      historyImageUrl: history.imageUrl,
      libertyText: values.liberty,
      equalityText: values.equality,
      fraternityText: values.fraternity,
      address: contact.address,
      city: contact.city,
      zip: contact.zip,
      email: contact.email,
      secondaryEmail: contact.secondaryEmail,
    },
  })

  // Synchronize form when store data changes (initial load)
  useEffect(() => {
    form.reset({
      historyTitle: history.title,
      historyText: history.text,
      historyImageUrl: history.imageUrl,
      libertyText: values.liberty,
      equalityText: values.equality,
      fraternityText: values.fraternity,
      address: contact.address,
      city: contact.city,
      zip: contact.zip,
      email: contact.email,
      secondaryEmail: contact.secondaryEmail,
    })
  }, [history, values, contact, form])

  const onSubmit = async (data: z.infer<typeof institutionalSchema>) => {
    try {
      await updateHistory({
        title: data.historyTitle,
        text: data.historyText,
        imageUrl: data.historyImageUrl || '',
      })
      await updateValues({
        liberty: data.libertyText,
        equality: data.equalityText,
        fraternity: data.fraternityText,
      })
      await updateContact({
        address: data.address,
        city: data.city,
        zip: data.zip,
        email: data.email,
        secondaryEmail: data.secondaryEmail || '',
      })

      toast({
        title: 'Conteúdo Atualizado',
        description: 'As informações institucionais foram salvas com sucesso.',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Falha ao salvar as configurações.',
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="history" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="history">História & Sobre</TabsTrigger>
            <TabsTrigger value="values">Missão & Valores</TabsTrigger>
            <TabsTrigger value="contact">Contato</TabsTrigger>
          </TabsList>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>História da Loja</CardTitle>
                <CardDescription>
                  Gerencie o texto e imagem da seção "Quem Somos".
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="historyTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título da Seção</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Tradição e Modernidade"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="historyText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Texto Histórico</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Conte a história da loja..."
                          className="min-h-[200px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="historyImageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL da Imagem</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="values">
            <Card>
              <CardHeader>
                <CardTitle>Pilares e Valores</CardTitle>
                <CardDescription>
                  Edite as descrições dos pilares maçônicos exibidos no site.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="libertyText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Liberdade</FormLabel>
                      <FormControl>
                        <Textarea className="min-h-[80px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="equalityText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Igualdade</FormLabel>
                      <FormControl>
                        <Textarea className="min-h-[80px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fraternityText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fraternidade</FormLabel>
                      <FormControl>
                        <Textarea className="min-h-[80px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact">
            <Card>
              <CardHeader>
                <CardTitle>Informações de Contato</CardTitle>
                <CardDescription>
                  Dados exibidos no rodapé e seção de contato.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Endereço</FormLabel>
                        <FormControl>
                          <Input placeholder="Rua..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="zip"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CEP</FormLabel>
                        <FormControl>
                          <Input placeholder="00000-000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade/Estado</FormLabel>
                      <FormControl>
                        <Input placeholder="Botucatu - SP" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Principal</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="contato@..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="secondaryEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Secundário</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="secretaria@..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end">
          <Button
            type="submit"
            size="lg"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Salvar Todas as Configurações
          </Button>
        </div>
      </form>
    </Form>
  )
}
