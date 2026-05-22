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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { Profile } from '@/stores/useAuthStore'
import type { UserProfileUpdate } from '@/stores/useUserStore'

const userEditSchema = z.object({
  full_name: z.string().min(2, 'Nome é obrigatório'),
  email: z.union([z.string().email('E-mail inválido'), z.literal('')]),
  role: z.enum(['admin', 'editor', 'member']),
  status: z.enum([
    'pending',
    'approved',
    'blocked',
    'in_memoriam',
    'adormecido',
  ]),
  masonic_degree: z.enum(['Aprendiz', 'Companheiro', 'Mestre']),
})

type UserEditFormValues = z.infer<typeof userEditSchema>

interface UserEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: Profile | null
  onSave: (id: string, updates: UserProfileUpdate) => Promise<void>
}

export function UserEditDialog({
  open,
  onOpenChange,
  user,
  onSave,
}: UserEditDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<UserEditFormValues>({
    resolver: zodResolver(userEditSchema),
    defaultValues: {
      full_name: '',
      email: '',
      role: 'member',
      status: 'pending',
      masonic_degree: 'Aprendiz',
    },
  })

  useEffect(() => {
    if (!open || !user) return
    form.reset({
      full_name: user.full_name || '',
      email: user.email || '',
      role: user.role,
      status: user.status,
      masonic_degree:
        (user.masonic_degree as UserEditFormValues['masonic_degree']) || 'Aprendiz',
    })
  }, [open, user, form])

  async function handleSubmit(values: UserEditFormValues) {
    if (!user) return
    setIsSubmitting(true)
    try {
      await onSave(user.id, {
        full_name: values.full_name,
        email: values.email || undefined,
        role: values.role,
        status: values.status,
        masonic_degree: values.masonic_degree,
      })
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar usuário</DialogTitle>
          <DialogDescription>
            Altere os dados do perfil. Ações disponíveis apenas para administradores do sistema.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome completo</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Nome do irmão" />
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
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="email@exemplo.com"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="masonic_degree"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grau maçônico</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Aprendiz">Aprendiz</SelectItem>
                        <SelectItem value="Companheiro">Companheiro</SelectItem>
                        <SelectItem value="Mestre">Mestre</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Função no sistema</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="member">Membro</SelectItem>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="approved">Aprovado</SelectItem>
                      <SelectItem value="blocked">Bloqueado</SelectItem>
                      <SelectItem value="in_memoriam">In Memoriam</SelectItem>
                      <SelectItem value="adormecido">Adormecido</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar alterações'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
