import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Minute } from '@/stores/useMinutesStore'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { format } from 'date-fns'
import { Loader2 } from 'lucide-react'

const minuteSchema = z.object({
  title: z.string().min(3, 'Título é obrigatório'),
  date: z.string().min(1, 'Data é obrigatória'),
  content: z.string().min(10, 'O conteúdo da ata deve ser detalhado'),
})

type MinuteFormValues = z.infer<typeof minuteSchema>

interface MinutesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  minuteToEdit: Minute | null
  onSave: (data: MinuteFormValues) => Promise<void>
}

export function MinutesDialog({
  open,
  onOpenChange,
  minuteToEdit,
  onSave,
}: MinutesDialogProps) {
  const form = useForm<MinuteFormValues>({
    resolver: zodResolver(minuteSchema),
    defaultValues: {
      title: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      content: '',
    },
  })

  useEffect(() => {
    if (minuteToEdit) {
      form.reset({
        title: minuteToEdit.title,
        date: minuteToEdit.date
          ? format(new Date(minuteToEdit.date), 'yyyy-MM-dd')
          : '',
        content: minuteToEdit.content,
      })
    } else {
      form.reset({
        title: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        content: '',
      })
    }
  }, [minuteToEdit, form, open])

  const handleSubmit = async (data: MinuteFormValues) => {
    await onSave(data)
    form.reset()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{minuteToEdit ? 'Editar Ata' : 'Nova Ata'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título / Referência</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Ata da Sessão Ordinária Nº 123"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data da Sessão</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Texto da Ata</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Redija o conteúdo da ata aqui..."
                      className="min-h-[300px] font-serif"
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
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
