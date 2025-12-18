import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
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
import { Checkbox } from '@/components/ui/checkbox'
import { NewsEvent } from '@/stores/useNewsStore'
import { compressImage } from '@/lib/image-utils'
import { Loader2, Upload } from 'lucide-react'

const newsSchema = z.object({
  title: z.string().min(3, 'Título é obrigatório'),
  content: z.string().min(10, 'Conteúdo muito curto'),
  imageUrl: z.string().optional(),
  eventDate: z.string().optional(),
  isPublished: z.boolean().default(true),
})

type NewsFormValues = z.infer<typeof newsSchema>

interface NewsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  newsToEdit: NewsEvent | null
  onSave: (data: NewsFormValues) => Promise<void>
}

export function NewsDialog({
  open,
  onOpenChange,
  newsToEdit,
  onSave,
}: NewsDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const form = useForm<NewsFormValues>({
    resolver: zodResolver(newsSchema),
    defaultValues: {
      title: '',
      content: '',
      imageUrl: '',
      eventDate: '',
      isPublished: true,
    },
  })

  useEffect(() => {
    if (newsToEdit) {
      form.reset({
        title: newsToEdit.title,
        content: newsToEdit.content,
        imageUrl: newsToEdit.imageUrl || '',
        eventDate: newsToEdit.eventDate
          ? newsToEdit.eventDate.split('T')[0]
          : '',
        isPublished: newsToEdit.isPublished,
      })
      setPreviewImage(newsToEdit.imageUrl || null)
    } else {
      form.reset({
        title: '',
        content: '',
        imageUrl: '',
        eventDate: '',
        isPublished: true,
      })
      setPreviewImage(null)
    }
  }, [newsToEdit, form, open])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      // Optimize image before 'upload' (mock logic since we don't have real storage bucket setup in this context without specific instructions, assuming external URL or mocked behavior)
      // Since user story asks for optimization:
      const optimizedFile = await compressImage(file)

      // Create a local preview URL
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        setPreviewImage(result)
        form.setValue('imageUrl', result) // In a real app, we would upload optimizedFile to Supabase Storage here and get URL
      }
      reader.readAsDataURL(optimizedFile)
    } catch (error) {
      console.error('Image processing failed', error)
    }
  }

  const handleSubmit = async (data: NewsFormValues) => {
    setIsSubmitting(true)
    await onSave(data)
    setIsSubmitting(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {newsToEdit ? 'Editar Notícia/Evento' : 'Criar Nova Notícia'}
          </DialogTitle>
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
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Título da notícia" {...field} />
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
                      placeholder="Escreva o conteúdo completo..."
                      className="min-h-[150px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <FormLabel>Imagem de Destaque</FormLabel>
                <div className="flex flex-col gap-3">
                  <div className="relative aspect-video w-full border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/30 overflow-hidden">
                    {previewImage ? (
                      <img
                        src={previewImage}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center text-muted-foreground text-xs">
                        <Upload className="h-8 w-8 mb-2 opacity-50" />
                        <span>Clique para enviar</span>
                      </div>
                    )}
                    <Input
                      type="file"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </div>
                  {previewImage && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setPreviewImage(null)
                        form.setValue('imageUrl', '')
                      }}
                    >
                      Remover Imagem
                    </Button>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  A imagem será otimizada automaticamente antes do envio.
                </p>
              </div>

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="eventDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data do Evento (Opcional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isPublished"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Publicar Imediatamente</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Se desmarcado, ficará como rascunho.
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>

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
                {isSubmitting && (
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
