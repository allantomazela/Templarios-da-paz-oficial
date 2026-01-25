import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
import { useAgapeStore } from '@/stores/useAgapeStore'
import { useToast } from '@/hooks/use-toast'
import { Calendar } from 'lucide-react'

const sessionSchema = z.object({
  date: z.string().min(1, 'Data é obrigatória'),
  description: z.string().optional(),
})

type SessionFormValues = z.infer<typeof sessionSchema>

interface AgapeSessionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AgapeSessionDialog({ open, onOpenChange }: AgapeSessionDialogProps) {
  const { createSession, loading } = useAgapeStore()
  const { toast } = useToast()

  const form = useForm<SessionFormValues>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      description: '',
    },
  })

  const onSubmit = async (data: SessionFormValues) => {
    const { error } = await createSession({
      date: data.date,
      description: data.description || null,
      status: 'open',
      created_by: null,
    })

    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a sessão.',
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Sucesso',
        description: 'Sessão criada com sucesso.',
      })
      form.reset()
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <FormHeader
          title="Nova Sessão de Ágape"
          description="Crie uma nova sessão de ágape para registrar os consumos dos irmãos."
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
                    <Input type="date" {...field} />
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
                Criar Sessão
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
