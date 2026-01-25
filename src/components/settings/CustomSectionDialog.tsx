import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { FormHeader } from '@/components/ui/form-header'
import { CustomSection } from '@/stores/useSiteSettingsStore'
import { useImageUpload } from '@/hooks/use-image-upload'
import { Loader2, Upload, Layout } from 'lucide-react'

const customSectionSchema = z.object({
  title: z.string().min(3, 'Título é obrigatório'),
  content: z.string().min(10, 'Conteúdo é obrigatório'),
  type: z.enum(['text', 'text-image', 'image-text', 'full-width']),
  imageUrl: z.string().optional(),
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
  visible: z.boolean().default(true),
})

type CustomSectionFormValues = z.infer<typeof customSectionSchema>

interface CustomSectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sectionToEdit: CustomSection | null
  onSave: (data: CustomSectionFormValues) => Promise<void>
}

export function CustomSectionDialog({
  open,
  onOpenChange,
  sectionToEdit,
  onSave,
}: CustomSectionDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const imageUpload = useImageUpload({
    bucket: 'site-assets',
    folder: 'custom-sections',
    maxSize: 1920,
    quality: 0.85,
    successMessage: 'Imagem carregada com sucesso.',
    errorMessage: 'Falha ao fazer upload da imagem.',
  })

  const form = useForm<CustomSectionFormValues>({
    resolver: zodResolver(customSectionSchema),
    defaultValues: {
      title: '',
      content: '',
      type: 'text',
      imageUrl: '',
      backgroundColor: '',
      textColor: '',
      visible: true,
    },
  })

  useEffect(() => {
    if (!open) return

    if (sectionToEdit) {
      form.reset({
        title: sectionToEdit.title,
        content: sectionToEdit.content,
        type: sectionToEdit.type,
        imageUrl: sectionToEdit.imageUrl || '',
        backgroundColor: sectionToEdit.backgroundColor || '',
        textColor: sectionToEdit.textColor || '',
        visible: sectionToEdit.visible,
      })
      setPreviewImage(sectionToEdit.imageUrl || null)
      if (sectionToEdit.imageUrl) {
        imageUpload.reset()
      }
    } else {
      form.reset({
        title: '',
        content: '',
        type: 'text',
        imageUrl: '',
        backgroundColor: '',
        textColor: '',
        visible: true,
      })
      setPreviewImage(null)
      imageUpload.reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionToEdit, open])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const url = await imageUpload.handleUpload(file)
    if (url) {
      form.setValue('imageUrl', url, { shouldDirty: true })
      setPreviewImage(url)
    }
  }

  const handleSubmit = async (data: CustomSectionFormValues) => {
    setIsSubmitting(true)
    await onSave(data)
    setIsSubmitting(false)
  }

  const sectionType = form.watch('type')
  const showImageUpload =
    sectionType === 'text-image' ||
    sectionType === 'image-text' ||
    sectionType === 'full-width'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <FormHeader
          title={sectionToEdit ? 'Editar Seção Customizada' : 'Nova Seção Customizada'}
          description={
            sectionToEdit
              ? 'Atualize as informações da seção.'
              : 'Crie uma nova seção para adicionar à página inicial do site.'
          }
          icon={<Layout className="h-5 w-5" />}
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
                  <FormLabel>Título da Seção</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Nossos Eventos" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Layout</FormLabel>
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
                      <SelectItem value="text">Apenas Texto</SelectItem>
                      <SelectItem value="text-image">Texto + Imagem (lado direito)</SelectItem>
                      <SelectItem value="image-text">Imagem + Texto (lado esquerdo)</SelectItem>
                      <SelectItem value="full-width">Largura Total com Imagem</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Escolha como a seção será exibida na página.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {showImageUpload && (
              <div className="space-y-2">
                <FormLabel>Imagem da Seção</FormLabel>
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
                    <input
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
            )}

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conteúdo</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Digite o conteúdo da seção... (HTML permitido)"
                      className="min-h-[200px] font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Você pode usar HTML para formatar o conteúdo (ex: &lt;p&gt;, &lt;strong&gt;, &lt;br&gt;).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="backgroundColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cor de Fundo (Opcional)</FormLabel>
                    <FormControl>
                      <Input
                        type="color"
                        placeholder="#ffffff"
                        {...field}
                        value={field.value || '#ffffff'}
                      />
                    </FormControl>
                    <FormDescription>
                      Cor de fundo da seção (hex).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="textColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cor do Texto (Opcional)</FormLabel>
                    <FormControl>
                      <Input
                        type="color"
                        placeholder="#000000"
                        {...field}
                        value={field.value || '#000000'}
                      />
                    </FormControl>
                    <FormDescription>
                      Cor do texto da seção (hex).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="visible"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Seção Visível</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Se desmarcado, a seção não será exibida no site.
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
                disabled={isSubmitting || imageUpload.isUploading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || imageUpload.isUploading}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {sectionToEdit ? 'Atualizar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

