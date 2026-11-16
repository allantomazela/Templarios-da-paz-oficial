import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { PasswordInput } from '@/components/ui/password-input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useToast } from '@/hooks/use-toast'
import useAuthStore from '@/stores/useAuthStore'
import { getPasswordUpdateErrorMessage } from '@/lib/auth-utils'
import { Loader2, Lock, ShieldCheck } from 'lucide-react'

const schema = z
  .object({
    password: z
      .string()
      .min(8, { message: 'A senha deve ter no mínimo 8 caracteres' })
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Use maiúscula, minúscula e número',
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

type FormValues = z.infer<typeof schema>

export default function ForceChangePassword() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const {
    isAuthenticated,
    initialized,
    loading,
    user,
    updatePassword,
    clearMustChangePasswordFlag,
    signOut,
  } = useAuthStore()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  if (!initialized || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!user?.profile?.must_change_password) {
    return <Navigate to="/dashboard" replace />
  }

  async function onSubmit(values: FormValues) {
    setIsLoading(true)
    try {
      const { error } = await updatePassword(values.password)
      if (error) {
        toast({
          variant: 'destructive',
          title: 'Não foi possível salvar',
          description: getPasswordUpdateErrorMessage(error),
        })
        return
      }

      const cleared = await clearMustChangePasswordFlag()
      if (!cleared.ok) {
        toast({
          variant: 'destructive',
          title: 'Senha alterada, mas a liberação falhou',
          description:
            cleared.error ||
            'Saia e entre novamente. Se o aviso continuar, fale com a administração.',
        })
        return
      }

      toast({
        title: 'Senha atualizada',
        description: 'Agora você pode usar o sistema normalmente.',
      })
      navigate('/dashboard', { replace: true })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleLogout() {
    await signOut()
    window.location.href = '/login'
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <CardTitle>Troca de senha obrigatória</CardTitle>
          <CardDescription>
            A administração definiu uma senha provisória. Escolha uma senha
            pessoal antes de continuar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nova senha</FormLabel>
                    <FormControl>
                      <PasswordInput
                        autoComplete="new-password"
                        leftIcon={<Lock />}
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar nova senha</FormLabel>
                    <FormControl>
                      <PasswordInput
                        autoComplete="new-password"
                        leftIcon={<Lock />}
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar e continuar'
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                disabled={isLoading}
                onClick={() => void handleLogout()}
              >
                Sair
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
