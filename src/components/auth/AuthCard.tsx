import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
    password: z
      .string()
      .min(6, { message: 'A senha deve ter no mínimo 6 caracteres' }),
    confirmPassword: z.string(),
    terms: z
      .boolean()
      .refine((val) => val === true, {
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
  const { login } = useAuthStore()
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
      password: '',
      confirmPassword: '',
      terms: false,
    },
  })

  async function onLogin(data: z.infer<typeof loginSchema>) {
    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      // Mock login success
      if (data.email) {
        login({
          id: '1',
          name: 'João Silva',
          email: data.email,
          role: 'Mestre',
          degree: 'Mestre',
        })
        toast({
          title: 'Bem-vindo, Irmão!',
          description: 'Login realizado com sucesso.',
        })
        navigate('/dashboard')
      }
    }, 1500)
  }

  async function onRegister(data: z.infer<typeof registerSchema>) {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      toast({
        title: 'Solicitação Enviada',
        description: 'Seu cadastro foi enviado para aprovação da secretaria.',
      })
      // Reset form or switch to login tab?
    }, 1500)
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
            <Form {...loginForm}>
              <form
                onSubmit={loginForm.handleSubmit(onLogin)}
                className="space-y-4"
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
                  <a href="#" className="text-sm text-primary hover:underline">
                    Esqueceu a senha?
                  </a>
                </div>
                <Button className="w-full" type="submit" disabled={isLoading}>
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Entrar
                </Button>
              </form>
            </Form>
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

                <div className="py-2">
                  <Label>Grau</Label>
                  <Input
                    value="Aprendiz"
                    disabled
                    className="bg-muted text-muted-foreground"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    O grau será verificado pela secretaria.
                  </p>
                </div>

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
