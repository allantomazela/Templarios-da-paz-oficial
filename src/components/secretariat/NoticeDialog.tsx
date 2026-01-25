import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Announcement } from '@/lib/data'
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
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { FormHeader } from '@/components/ui/form-header'
import { Bell } from 'lucide-react'

const noticeSchema = z.object({
  title: z.string().min(3, 'Título é obrigatório'),
  content: z.string().min(10, 'Conteúdo deve ter no mínimo 10 caracteres'),
  isPrivate: z.boolean().default(false),
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
    defaultValues: { title: '', content: '', isPrivate: false },
  })

  useEffect(() => {
    if (noticeToEdit) {
      form.reset({ 
        title: noticeToEdit.title, 
        content: noticeToEdit.content,
        isPrivate: (noticeToEdit as any).isPrivate || false,
      })
    } else {
      form.reset({ title: '', content: '', isPrivate: false })
    }
  }, [noticeToEdit, form, open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <FormHeader
          title={noticeToEdit ? 'Editar Aviso' : 'Criar Novo Aviso'}
          description={
            noticeToEdit
              ? 'Atualize as informações do aviso.'
              : 'Crie um novo aviso para o mural da loja.'
          }
          icon={<Bell className="h-5 w-5" />}
        />
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
            <FormField
              control={form.control}
              name="isPrivate"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Aviso Privado</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Apenas administradores e editores poderão ver este aviso
                    </p>
                  </div>
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
