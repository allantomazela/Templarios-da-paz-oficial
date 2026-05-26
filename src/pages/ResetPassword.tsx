import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { Input } from '@/components/ui/input'
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
import { supabase } from '@/lib/supabase/client'
import { ShieldCheck, Loader2, Lock } from 'lucide-react'

const resetSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: 'A senha deve ter no mínimo 8 caracteres' }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

export default function ResetPassword() {
  const [isLoading, setIsLoading] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const { updatePassword, isAuthenticated, initialize } = useAuthStore()
  const { toast } = useToast()
  const navigate = useNavigate()

  const form = useForm<z.infer<typeof resetSchema>>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  useEffect(() => {
    let cancelled = false

    async function prepareRecoverySession() {
      await initialize()

      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          toast({
            variant: 'destructive',
            title: 'Link inválido ou expirado',
            description:
              'Solicite novamente a recuperação de senha na tela de login.',
          })
        }
      }

      const hash = window.location.hash
      if (hash.includes('type=recovery') || hash.includes('access_token')) {
        const { data } = await supabase.auth.getSession()
        if (!data.session) {
          await new Promise((r) => setTimeout(r, 500))
        }
      }

      if (!cancelled) {
        setSessionReady(true)
      }
    }

    prepareRecoverySession()
    return () => {
      cancelled = true
    }
  }, [initialize, toast])

  const onSubmit = async (data: z.infer<typeof resetSchema>) => {
    const { data: sessionData } = await supabase.auth.getSession()
    if (!sessionData.session && !isAuthenticated) {
      toast({
        variant: 'destructive',
        title: 'Sessão inválida',
        description:
          'Abra o link do e-mail novamente ou solicite uma nova recuperação de senha.',
      })
      return
    }

    setIsLoading(true)
    const { error } = await updatePassword(data.password)
    setIsLoading(false)

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message || 'Falha ao redefinir a senha.',
      })
    } else {
      await supabase.auth.signOut()
      toast({
        title: 'Senha alterada',
        description:
          'Sua senha foi atualizada. Faça login com a nova senha (após aprovação da conta, se ainda pendente).',
      })
      setTimeout(() => navigate('/login'), 2000)
    }
  }

  if (!sessionReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern opacity-5" />
      </div>

      <Card className="w-full max-w-md mx-auto shadow-2xl bg-card border-border/50 z-10">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <ShieldCheck className="h-10 w-10 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Redefinir Senha
          </CardTitle>
          <CardDescription>Digite sua nova senha abaixo.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nova Senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="password"
                          className="pl-9"
                          placeholder="******"
                          {...field}
                        />
                      </div>
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
                    <FormLabel>Confirmar Nova Senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="password"
                          className="pl-9"
                          placeholder="******"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Nova Senha
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
