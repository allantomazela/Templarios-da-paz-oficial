import { useEffect, useState } from 'react'
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
import { format } from 'date-fns'
import { Loader2, FileText } from 'lucide-react'
import { RichTextEditor } from './RichTextEditor'
import { minuteTemplates } from '@/lib/minute-templates'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  
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
      setSelectedTemplate('')
    } else {
      form.reset({
        title: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        content: '',
      })
      setSelectedTemplate('')
    }
  }, [minuteToEdit, form, open])

  const handleTemplateSelect = (templateId: string) => {
    if (templateId === '') return

    const template = minuteTemplates.find((t) => t.id === templateId)
    if (template) {
      // Limpar espaços em branco do template e aplicar
      const cleanedContent = template.content.trim()
      form.setValue('content', cleanedContent, { shouldDirty: true })
      // Resetar o select após aplicar
      setTimeout(() => setSelectedTemplate(''), 100)
    }
  }

  const handleSubmit = async (data: MinuteFormValues) => {
    await onSave(data)
    form.reset()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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

            {/* Template Selector - only for new minutes */}
            {!minuteToEdit && (
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <Select
                  value={selectedTemplate}
                  onValueChange={handleTemplateSelect}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Usar template de ata (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {minuteTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name} - {template.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Texto da Ata</FormLabel>
                  <FormControl>
                    <RichTextEditor
                      content={field.value}
                      onChange={field.onChange}
                      placeholder="Redija o conteúdo da ata aqui..."
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
