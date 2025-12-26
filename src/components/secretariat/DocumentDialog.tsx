import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { LodgeDocument } from '@/lib/data'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const documentSchema = z.object({
  title: z.string().min(3, 'Título é obrigatório'),
  description: z.string().min(5, 'Descrição é obrigatória'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  // File upload is mocked, so we just validate if it's "present" in logic or skip for edit
})

type DocumentFormValues = z.infer<typeof documentSchema>

interface DocumentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentToEdit: LodgeDocument | null
  onSave: (data: DocumentFormValues) => void
}

export function DocumentDialog({
  open,
  onOpenChange,
  documentToEdit,
  onSave,
}: DocumentDialogProps) {
  const form = useForm<DocumentFormValues>({
    resolver: zodResolver(documentSchema),
    defaultValues: { title: '', description: '', category: '' },
  })

  useEffect(() => {
    if (documentToEdit) {
      form.reset({
        title: documentToEdit.title,
        description: documentToEdit.description,
        category: documentToEdit.category,
      })
    } else {
      form.reset({ title: '', description: '', category: '' })
    }
  }, [documentToEdit, form, open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {documentToEdit ? 'Editar Documento' : 'Upload de Documento'}
          </DialogTitle>
          <DialogDescription>
            {documentToEdit
              ? 'Atualize as informações do documento.'
              : 'Faça upload de um novo documento para a biblioteca da loja.'}
          </DialogDescription>
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
                    <Input placeholder="Nome do documento" {...field} />
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
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input placeholder="Breve descrição" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Atas">Atas</SelectItem>
                      <SelectItem value="Balaústres">Balaústres</SelectItem>
                      <SelectItem value="Jurídico">Jurídico</SelectItem>
                      <SelectItem value="Diversos">Diversos</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!documentToEdit && (
              <div className="space-y-2">
                <FormLabel>Arquivo</FormLabel>
                <Input type="file" />
                <p className="text-[10px] text-muted-foreground">
                  Formatos aceitos: PDF, DOCX. Máx: 10MB.
                </p>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
