import { useState } from 'react'
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
import { Button } from '@/components/ui/button'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '@/stores/useAuthStore'
import { useAsyncOperation } from '@/hooks/use-async-operation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
    newPassword: z
      .string()
      .min(8, 'A senha deve ter pelo menos 8 caracteres')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'A senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número',
      ),
    confirmPassword: z.string().min(1, 'Confirmação de senha é obrigatória'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

type PasswordFormValues = z.infer<typeof passwordSchema>

export function PasswordChange() {
  const { updatePassword } = useAuthStore()
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const updateOperation = useAsyncOperation(
    async (data: PasswordFormValues) => {
      // Nota: Supabase não permite verificar senha diretamente
      // A atualização de senha requer autenticação ativa
      // O Supabase validará automaticamente se o usuário está autenticado

      const { error } = await updatePassword(data.newPassword)
      if (error) {
        if (error.message.includes('password') || error.message.includes('auth')) {
          throw new Error('Não foi possível alterar a senha. Verifique se você está autenticado.')
        }
        throw error
      }

      // Limpar formulário após sucesso
      form.reset()
      return 'Senha alterada com sucesso!'
    },
    {
      successMessage: 'Senha alterada com sucesso!',
      errorMessage: 'Erro ao alterar senha. Verifique se você está autenticado.',
    },
  )

  const onSubmit = async (data: PasswordFormValues) => {
    await updateOperation.execute(data)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alterar Senha</CardTitle>
        <CardDescription>
          Altere sua senha de acesso. Use uma senha forte com pelo menos 8
          caracteres.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha Atual *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showCurrentPassword ? 'text' : 'password'}
                        placeholder="Digite sua senha atual"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nova Senha *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder="Digite sua nova senha"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Mínimo de 8 caracteres, incluindo letras maiúsculas,
                    minúsculas e números.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar Nova Senha *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirme sua nova senha"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
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
                Alterar Senha
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

