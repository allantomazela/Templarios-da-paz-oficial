import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { useProfileStore } from '@/stores/useProfileStore'
import { useAsyncOperation } from '@/hooks/use-async-operation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const profileSchema = z.object({
  full_name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  masonic_degree: z.string().optional(),
})

type ProfileFormValues = z.infer<typeof profileSchema>

interface ProfileInfoProps {
  profile: {
    id: string
    full_name: string
    email?: string
    masonic_degree?: string
  }
}

const masonicDegrees = [
  'Aprendiz',
  'Companheiro',
  'Mestre',
  'Mestre Instalado',
  'Past Master',
]

export function ProfileInfo({ profile }: ProfileInfoProps) {
  const { updateProfile } = useProfileStore()

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile.full_name || '',
      email: profile.email || '',
      masonic_degree: profile.masonic_degree || undefined,
    },
  })

  const updateOperation = useAsyncOperation(
    async (data: ProfileFormValues) => {
      await updateProfile(data)
      return 'Perfil atualizado com sucesso!'
    },
    {
      successMessage: 'Perfil atualizado com sucesso!',
      errorMessage: 'Erro ao atualizar perfil.',
    },
  )

  useEffect(() => {
    form.reset({
      full_name: profile.full_name || '',
      email: profile.email || '',
      masonic_degree: profile.masonic_degree || undefined,
    })
  }, [profile, form])

  const onSubmit = async (data: ProfileFormValues) => {
    // Converter string vazia para undefined
    const submitData = {
      ...data,
      masonic_degree: data.masonic_degree || undefined,
    }
    await updateOperation.execute(submitData)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informações Pessoais</CardTitle>
        <CardDescription>
          Atualize suas informações pessoais. O email será usado para login e
          notificações.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo *</FormLabel>
                  <FormControl>
                    <Input placeholder="Seu nome completo" {...field} />
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
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="seu@email.com"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Você receberá um email de confirmação ao alterar seu email.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="masonic_degree"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grau Maçônico</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value || undefined)}
                    value={field.value || undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione seu grau" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {masonicDegrees.map((degree) => (
                        <SelectItem key={degree} value={degree}>
                          {degree}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Seu grau maçônico atual na loja.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={updateOperation.isLoading || !form.formState.isDirty}
              >
                {updateOperation.isLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Salvar Alterações
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

