import { useEffect, useState } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { FormHeader } from '@/components/ui/form-header'
import { NewsEvent } from '@/stores/useNewsStore'
import { Loader2, Upload, Newspaper } from 'lucide-react'
import { useImageUpload } from '@/hooks/use-image-upload'

const newsSchema = z.object({
  title: z.string().min(3, 'Título é obrigatório'),
  content: z.string().min(10, 'Conteúdo muito curto'),
  imageUrl: z.string().optional(),
  eventDate: z.string().optional(),
  isPublished: z.boolean().default(true),
  category: z.enum(['news', 'social']),
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

  const imageUpload = useImageUpload({
    bucket: 'site-assets',
    folder: 'news',
    maxSize: 1280,
    quality: 0.85,
    successMessage: 'Imagem da notícia carregada com sucesso.',
    errorMessage: 'Falha ao fazer upload da imagem.',
  })

  const form = useForm<NewsFormValues>({
    resolver: zodResolver(newsSchema),
    defaultValues: {
      title: '',
      content: '',
      imageUrl: '',
      eventDate: '',
      isPublished: true,
      category: 'news',
    },
  })

  useEffect(() => {
    if (!open) return

    if (newsToEdit) {
      form.reset({
        title: newsToEdit.title,
        content: newsToEdit.content,
        imageUrl: newsToEdit.imageUrl || '',
        eventDate: newsToEdit.eventDate
          ? newsToEdit.eventDate.split('T')[0]
          : '',
        isPublished: newsToEdit.isPublished,
        category: newsToEdit.category || 'news',
      })
      setPreviewImage(newsToEdit.imageUrl || null)
      if (newsToEdit.imageUrl) {
        imageUpload.reset()
      }
    } else {
      form.reset({
        title: '',
        content: '',
        imageUrl: '',
        eventDate: '',
        isPublished: true,
        category: 'news',
      })
      setPreviewImage(null)
      imageUpload.reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newsToEdit, open])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const url = await imageUpload.handleUpload(file)
    if (url) {
      form.setValue('imageUrl', url, { shouldDirty: true })
      setPreviewImage(url)
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
        <FormHeader
          title={newsToEdit ? 'Editar Notícia/Evento' : 'Criar Nova Publicação'}
          description={
            newsToEdit
              ? 'Atualize as informações da publicação abaixo.'
              : 'Preencha os campos para publicar uma nova notícia ou evento no site.'
          }
          icon={<Newspaper className="h-5 w-5" />}
        />
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="news">Notícia</SelectItem>
                        <SelectItem value="social">Evento Social</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
            </div>

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

            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <FormLabel>Imagem de Destaque</FormLabel>
                <div className="flex flex-col gap-3">
                  <div className="relative aspect-video w-full border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/30 overflow-hidden group">
                    {imageUpload.isUploading ? (
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    ) : previewImage ? (
                      <img
                        src={previewImage}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center text-muted-foreground text-xs pointer-events-none">
                        <Upload className="h-8 w-8 mb-2 opacity-50" />
                        <span>Clique para enviar</span>
                      </div>
                    )}
                    <Input
                      type="file"
                      ref={imageUpload.inputRef}
                      className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={imageUpload.isUploading}
                    />
                  </div>
                  {previewImage && !imageUpload.isUploading && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setPreviewImage(null)
                        form.setValue('imageUrl', '')
                        imageUpload.reset()
                      }}
                    >
                      Remover Imagem
                    </Button>
                  )}
                </div>
              </div>

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

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting || imageUpload.isUploading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || imageUpload.isUploading}>
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
