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
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { PasswordInput } from '@/components/ui/password-input'
import { useToast } from '@/hooks/use-toast'
import { changeUserEmailAsAdmin } from '@/lib/admin-user-api'
import type { Profile } from '@/stores/useAuthStore'
import { Loader2 } from 'lucide-react'

const schema = z.object({
  newEmail: z.string().email('E-mail inválido'),
  adminPassword: z.string().min(1, 'Informe a sua senha de administrador'),
})

type FormValues = z.infer<typeof schema>

interface AdminChangeEmailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: Profile | null
  onSuccess?: (email: string) => void
}

export function AdminChangeEmailDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
}: AdminChangeEmailDialogProps) {
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      newEmail: '',
      adminPassword: '',
    },
  })

  useEffect(() => {
    if (!open) return
    form.reset({
      newEmail: '',
      adminPassword: '',
    })
  }, [open, form])

  async function onSubmit(values: FormValues) {
    if (!user) return
    setSubmitting(true)
    try {
      const result = await changeUserEmailAsAdmin({
        userId: user.id,
        adminPassword: values.adminPassword,
        newEmail: values.newEmail,
      })
      toast({
        title: 'E-mail atualizado',
        description: `Login de ${user.full_name} agora usa ${result.email}. O e-mail antigo deixa de funcionar.`,
      })
      onOpenChange(false)
      onSuccess?.(result.email)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao alterar e-mail',
        description:
          error instanceof Error
            ? error.message
            : 'Não foi possível alterar o e-mail.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !submitting && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Alterar e-mail</DialogTitle>
          <DialogDescription>
            Use quando o e-mail atual de <strong>{user?.full_name}</strong>
            {user?.email ? ` (${user.email})` : ''} foi desativado ou não
            recebe mais mensagens. O login e o vínculo com a secretaria são
            atualizados juntos.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="newEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Novo e-mail</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      autoComplete="off"
                      placeholder="novo@email.com"
                      disabled={submitting}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    O e-mail antigo deixa de servir para login e recuperação de
                    senha.
                  </FormDescription>
                  <FormMessage />
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
                  'Alterar e-mail'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
