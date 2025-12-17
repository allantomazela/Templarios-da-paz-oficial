import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Announcement } from '@/lib/data'
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

const noticeSchema = z.object({
  title: z.string().min(3, 'Título é obrigatório'),
  content: z.string().min(10, 'Conteúdo deve ter no mínimo 10 caracteres'),
})

type NoticeFormValues = z.infer<typeof noticeSchema>

interface NoticeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  noticeToEdit: Announcement | null
  onSave: (data: NoticeFormValues) => void
}

export function NoticeDialog({
  open,
  onOpenChange,
  noticeToEdit,
  onSave,
}: NoticeDialogProps) {
  const form = useForm<NoticeFormValues>({
    resolver: zodResolver(noticeSchema),
    defaultValues: { title: '', content: '' },
  })

  useEffect(() => {
    if (noticeToEdit) {
      form.reset({ title: noticeToEdit.title, content: noticeToEdit.content })
    } else {
      form.reset({ title: '', content: '' })
    }
  }, [noticeToEdit, form, open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {noticeToEdit ? 'Editar Aviso' : 'Criar Novo Aviso'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Título do aviso" {...field} />
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
                  <FormLabel>Conteúdo</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Escreva o conteúdo do aviso aqui..."
                      className="min-h-[150px]"
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
              <Button type="submit">Salvar Publicação</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
