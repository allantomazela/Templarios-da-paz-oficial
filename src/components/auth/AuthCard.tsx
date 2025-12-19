import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import useAuthStore from '@/stores/useAuthStore'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const loginSchema = z.object({
  email: z.string().email({ message: 'Email inválido' }),
  password: z
    .string()
    .min(6, { message: 'A senha deve ter no mínimo 6 caracteres' }),
})

const registerSchema = z
  .object({
    name: z.string().min(3, { message: 'Nome muito curto' }),
    email: z.string().email({ message: 'Email inválido' }),
    degree: z
      .string({ required_error: 'Selecione seu grau' })
      .min(1, 'Selecione um grau'),
    password: z
      .string()
      .min(6, { message: 'A senha deve ter no mínimo 6 caracteres' }),
    confirmPassword: z.string(),
    terms: z.boolean().refine((val) => val === true, {
      message: 'Você deve aceitar os termos',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

export function AuthCard() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const { signInWithPassword, signUp } = useAuthStore()
  const { toast } = useToast()
  const navigate = useNavigate()

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      degree: '', // Changed default to empty string to force selection
      password: '',
      confirmPassword: '',
      terms: false,
    },
  })

  const getErrorMessage = (error: any) => {
    const msg = (error?.message || error?.toString() || '').toLowerCase()
    if (
      msg.includes('invalid login credentials') ||
      msg.includes('invalid_credentials')
    ) {
      return 'E-mail ou senha inválidos.'
    }
    if (msg.includes('user not found') || msg === 'profile_not_found') {
      return 'Usuário não encontrado.'
    }
    if (msg.includes('email not confirmed')) {
      return 'E-mail não confirmado. Verifique sua caixa de entrada.'
    }
    return 'Ocorreu um erro ao tentar entrar. Por favor, tente novamente mais tarde.'
  }

  async function onLogin(data: z.infer<typeof loginSchema>) {
    setIsLoading(true)
    setLoginError(null)

    try {
      const { error } = await signInWithPassword(data.email, data.password)

      if (error) {
        const friendlyMessage = getErrorMessage(error)
        setLoginError(friendlyMessage)
        toast({
          variant: 'destructive',
          title: 'Erro no Login',
          description: friendlyMessage,
        })
      } else {
        toast({
          title: 'Bem-vindo!',
          description: 'Login realizado com sucesso.',
        })
        navigate('/dashboard')
      }
    } catch (e) {
      setLoginError('Ocorreu um erro inesperado.')
    } finally {
      setIsLoading(false)
    }
  }

  async function onRegister(data: z.infer<typeof registerSchema>) {
    setIsLoading(true)
    const { error } = await signUp(
      data.email,
      data.password,
      data.name,
      data.degree,
    )

    setIsLoading(false)
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro no Registro',
        description: error.message,
      })
    } else {
      toast({
        title: 'Cadastro Realizado',
        description:
          'Sua conta foi criada e está pendente de aprovação. Verifique seu email.',
      })
      // Optionally switch to login tab or show a success message
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto shadow-2xl bg-card border-border/50 animate-fade-in-up">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight text-primary">
          Templários da Paz
        </CardTitle>
        <CardDescription>Acesso exclusivo para membros da loja</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Criar Conta</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <div className="space-y-4">
              {loginError && (
                <Alert variant="destructive" className="animate-fade-in">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Erro</AlertTitle>
                  <AlertDescription>{loginError}</AlertDescription>
                </Alert>
              )}

              <Form {...loginForm}>
                <form
                  onSubmit={loginForm.handleSubmit(onLogin)}
                  className="space-y-4"
                  onChange={() => setLoginError(null)}
                >
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="seu@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end">
                    <a
                      href="#"
                      className="text-sm text-primary hover:underline"
                    >
                      Esqueceu a senha?
                    </a>
                  </div>
                  <Button className="w-full" type="submit" disabled={isLoading}>
                    {isLoading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {isLoading ? 'Entrando...' : 'Entrar'}
                  </Button>
                </form>
              </Form>
            </div>
          </TabsContent>

          <TabsContent value="register">
            <Form {...registerForm}>
              <form
                onSubmit={registerForm.handleSubmit(onRegister)}
                className="space-y-3"
              >
                <FormField
                  control={registerForm.control}
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
                  control={registerForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="seu@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="degree"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grau Maçônico</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o grau" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Aprendiz">Aprendiz</SelectItem>
                          <SelectItem value="Companheiro">
                            Companheiro
                          </SelectItem>
                          <SelectItem value="Mestre">Mestre</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar Senha</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={registerForm.control}
                  name="terms"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Concordo com os termos e condições
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <Button className="w-full" type="submit" disabled={isLoading}>
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Registrar
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
