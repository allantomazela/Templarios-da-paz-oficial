import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { FormHeader } from '@/components/ui/form-header'
import { useAgapeStore, type AgapeSession } from '@/stores/useAgapeStore'
import { useToast } from '@/hooks/use-toast'
import { getSaveErrorMessage } from '@/lib/auth-utils'
import { Calendar } from 'lucide-react'
import { todayLocalISODate, toDateInputValue } from '@/lib/format-utils'

const sessionSchema = z.object({
  date: z.string().min(1, 'Data é obrigatória'),
  description: z.string().optional(),
})

type SessionFormValues = z.infer<typeof sessionSchema>

interface AgapeSessionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sessionToEdit?: AgapeSession | null
}

export function AgapeSessionDialog({
  open,
  onOpenChange,
  sessionToEdit,
}: AgapeSessionDialogProps) {
  const { createSession, updateSession, loading } = useAgapeStore()
  const { toast } = useToast()
  const isEditing = Boolean(sessionToEdit?.id)
  const isAgendaLinked = sessionToEdit?.source === 'agenda'

  const form = useForm<SessionFormValues>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      date: todayLocalISODate(),
      description: '',
    },
  })

  useEffect(() => {
    if (sessionToEdit) {
      form.reset({
        date: toDateInputValue(sessionToEdit.date),
        description: sessionToEdit.description || '',
      })
    } else if (open) {
      form.reset({
        date: todayLocalISODate(),
        description: '',
      })
    }
  }, [sessionToEdit, open, form])

  const onSubmit = async (data: SessionFormValues) => {
    if (isEditing && sessionToEdit) {
      const updates =
        sessionToEdit.source === 'agenda'
          ? { description: data.description || null }
          : {
              date: data.date,
              description: data.description || null,
            }

      const { error } = await updateSession(sessionToEdit.id, updates)

      if (error) {
        toast({
          title: 'Erro',
          description: getSaveErrorMessage(error),
          variant: 'destructive',
        })
        return
      }

      toast({ title: 'Sessão atualizada' })
      onOpenChange(false)
      return
    }

    const { error } = await createSession({
      date: data.date,
      description: data.description || null,
      status: 'open',
      source: 'manual',
      event_id: null,
      created_by: null,
    })

    if (error) {
      toast({
        title: 'Erro',
        description: getSaveErrorMessage(error),
        variant: 'destructive',
      })
    } else {
      toast({ title: 'Sessão criada' })
      form.reset()
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined}>
        <DialogTitle className="sr-only">
          {isEditing ? 'Editar sessão de Ágape' : 'Nova sessão de Ágape'}
        </DialogTitle>
        <FormHeader
          title={isEditing ? 'Editar sessão de Ágape' : 'Nova sessão de Ágape'}
          description={
            isEditing
              ? isAgendaLinked
                ? 'Sessão vinculada à Agenda. A data vem do evento; você pode ajustar a descrição local.'
                : 'Corrija a data ou a descrição da sessão.'
              : 'Crie uma sessão manual para registrar consumos fora da Agenda.'
          }
          icon={<Calendar className="h-5 w-5" />}
        />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} disabled={isAgendaLinked} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ex: Ágape de encerramento do mês..."
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
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {isEditing ? 'Salvar alterações' : 'Criar sessão'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
