import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { PasswordInput } from '@/components/ui/password-input'
import { useToast } from '@/hooks/use-toast'
import {
  generateProvisionalPassword,
  setUserPasswordAsAdmin,
} from '@/lib/admin-user-api'
import type { Profile } from '@/stores/useAuthStore'
import { Loader2, RefreshCw, Copy, Check } from 'lucide-react'

const schema = z
  .object({
    adminPassword: z.string().min(1, 'Informe a sua senha de administrador'),
    newPassword: z
      .string()
      .min(8, 'A senha deve ter no mínimo 8 caracteres')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Use maiúscula, minúscula e número',
      ),
    confirmPassword: z.string().min(1, 'Confirme a nova senha'),
    forcePasswordChange: z.boolean(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

type FormValues = z.infer<typeof schema>

interface AdminChangePasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: Profile | null
  onSuccess?: () => void
}

export function AdminChangePasswordDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
}: AdminChangePasswordDialogProps) {
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      adminPassword: '',
      newPassword: '',
      confirmPassword: '',
      forcePasswordChange: true,
    },
  })

  useEffect(() => {
    if (!open) return
    form.reset({
      adminPassword: '',
      newPassword: '',
      confirmPassword: '',
      forcePasswordChange: true,
    })
    setCopied(false)
  }, [open, form])

  function handleGenerate() {
    const generated = generateProvisionalPassword()
    form.setValue('newPassword', generated, { shouldValidate: true })
    form.setValue('confirmPassword', generated, { shouldValidate: true })
    setCopied(false)
  }

  async function handleCopy() {
    const value = form.getValues('newPassword')
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      toast({
        title: 'Senha copiada',
        description: 'Cole apenas no canal privado com o irmão.',
      })
    } catch {
      toast({
        variant: 'destructive',
        title: 'Não foi possível copiar',
        description: 'Copie a senha manualmente.',
      })
    }
  }

  async function onSubmit(values: FormValues) {
    if (!user) return
    setSubmitting(true)
    try {
      await setUserPasswordAsAdmin({
        userId: user.id,
        adminPassword: values.adminPassword,
        newPassword: values.newPassword,
        forcePasswordChange: values.forcePasswordChange,
      })
      toast({
        title: 'Senha atualizada',
        description: values.forcePasswordChange
          ? `${user.full_name} deverá alterar a senha no próximo login.`
          : `A senha de ${user.full_name} foi alterada.`,
      })
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao alterar senha',
        description:
          error instanceof Error
            ? error.message
            : 'Não foi possível alterar a senha.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !submitting && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Alterar senha</DialogTitle>
          <DialogDescription>
            Defina uma senha provisória para{' '}
            <strong>{user?.full_name}</strong>
            {user?.email ? ` (${user.email})` : ''}. Confirme com a sua senha
            de administrador.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nova senha do membro</FormLabel>
                  <FormControl>
                    <PasswordInput
                      autoComplete="new-password"
                      disabled={submitting}
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
                      disabled={submitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={submitting}
                onClick={handleGenerate}
              >
                <RefreshCw className="mr-2 h-3.5 w-3.5" />
                Gerar provisória
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={submitting || !form.watch('newPassword')}
                onClick={() => void handleCopy()}
              >
                {copied ? (
                  <Check className="mr-2 h-3.5 w-3.5" />
                ) : (
                  <Copy className="mr-2 h-3.5 w-3.5" />
                )}
                Copiar
              </Button>
            </div>

            <FormField
              control={form.control}
              name="forcePasswordChange"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        field.onChange(checked === true)
                      }
                      disabled={submitting}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Exigir troca no próximo login</FormLabel>
                    <FormDescription>
                      Recomendado para senha provisória passada ao irmão.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="adminPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sua senha de administrador</FormLabel>
                  <FormControl>
                    <PasswordInput
                      autoComplete="current-password"
                      disabled={submitting}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Confirma que a alteração foi autorizada por você.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Alterar senha'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
