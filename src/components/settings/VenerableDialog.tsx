import { useEffect, useState, useRef } from 'react'
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
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { FormHeader } from '@/components/ui/form-header'
import { Venerable } from '@/stores/useSiteSettingsStore'
import { Loader2, Upload, Trash2, UserCircle } from 'lucide-react'
import { useImageUpload } from '@/hooks/use-image-upload'

const venerableSchema = z.object({
  name: z.string().min(3, 'Nome é obrigatório'),
  period: z.string().min(1, 'Período é obrigatório'),
  imageUrl: z.string().optional(),
})

type VenerableFormValues = z.infer<typeof venerableSchema>

interface VenerableDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  venerableToEdit: Venerable | null
  onSave: (data: VenerableFormValues) => Promise<void>
}

export function VenerableDialog({
  open,
  onOpenChange,
  venerableToEdit,
  onSave,
}: VenerableDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const prevVenerableRef = useRef<string>('')
  const prevOpenRef = useRef<boolean>(false)
  const previewBlobRef = useRef<string | null>(null)

  const revokePreviewBlob = () => {
    if (previewBlobRef.current) {
      URL.revokeObjectURL(previewBlobRef.current)
      previewBlobRef.current = null
    }
  }

  const imageUpload = useImageUpload({
    bucket: 'site-assets',
    folder: 'venerables',
    maxSize: 400,
    quality: 0.8,
    successMessage: 'Foto do venerável carregada com sucesso.',
    errorMessage: 'Falha ao carregar a imagem. Tente novamente.',
  })

  const form = useForm<VenerableFormValues>({
    resolver: zodResolver(venerableSchema),
    defaultValues: {
      name: '',
      period: '',
      imageUrl: '',
    },
  })

  useEffect(() => {
    if (!open) {
      prevVenerableRef.current = ''
      prevOpenRef.current = false
      revokePreviewBlob()
      setPreviewImage(null)
      return
    }
    revokePreviewBlob()

    // Verificar se realmente mudou para evitar loops
    const currentKey = venerableToEdit ? `${venerableToEdit.id}` : 'new'
    const hasChanged = prevVenerableRef.current !== currentKey || prevOpenRef.current !== open

    if (!hasChanged) return

    prevVenerableRef.current = currentKey
    prevOpenRef.current = open

    if (venerableToEdit) {
      form.reset({
        name: venerableToEdit.name,
        period: venerableToEdit.period,
        imageUrl: venerableToEdit.imageUrl || '',
      })
      setPreviewImage(null)
      if (venerableToEdit.imageUrl) {
        imageUpload.reset()
      }
    } else {
      form.reset({
        name: '',
        period: '',
        imageUrl: '',
      })
      setPreviewImage(null)
      imageUpload.reset()
    }
    return () => revokePreviewBlob()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, venerableToEdit?.id])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    revokePreviewBlob()
    const blobUrl = URL.createObjectURL(file)
    previewBlobRef.current = blobUrl
    setPreviewImage(blobUrl)

    const url = await imageUpload.handleUpload(file)
    revokePreviewBlob()
    if (url) {
      setPreviewImage(null)
      form.setValue('imageUrl', url, { shouldDirty: true })
    } else {
      setPreviewImage(null)
    }
  }

  const handleSubmit = async (data: VenerableFormValues) => {
    setIsSubmitting(true)
    await onSave(data)
    setIsSubmitting(false)
  }

  const imageUrl = form.watch('imageUrl')
  const displayUrl = previewImage ?? imageUrl

  const dialogTitle = venerableToEdit ? 'Editar Venerável' : 'Adicionar Venerável'
  const dialogDescription = venerableToEdit
    ? 'Edite as informações do venerável abaixo.'
    : 'Preencha os dados do venerável para adicionar à galeria.'
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined}>
        <DialogTitle className="sr-only">{dialogTitle}</DialogTitle>
        <FormHeader
          title={dialogTitle}
          description={dialogDescription}
          icon={<UserCircle className="h-5 w-5" />}
        />
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <div className="flex items-center gap-4 mb-4">
              <Avatar className="h-20 w-20 border-2 relative">
                <AvatarImage src={displayUrl || undefined} alt="Preview" />
                <AvatarFallback>
                  {!displayUrl && imageUpload.isUploading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  ) : (
                    'VM'
                  )}
                </AvatarFallback>
                {displayUrl && imageUpload.isUploading && (
                  <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                    <span className="sr-only">Enviando foto...</span>
                  </div>
                )}
              </Avatar>
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => imageUpload.inputRef.current?.click()}
                  disabled={imageUpload.isUploading}
                >
                  {imageUpload.isUploading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  Alterar Foto
                </Button>
                <input
                  type="file"
                  ref={imageUpload.inputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileSelect}
                />
                {displayUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive text-xs"
                    onClick={() => {
                      setPreviewImage(null)
                      form.setValue('imageUrl', '')
                      imageUpload.reset()
                    }}
                  >
                    <Trash2 className="mr-2 h-3 w-3" /> Remover
                  </Button>
                )}
              </div>
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do Venerável" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="period"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Período de Mandato</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: 2022 - 2024" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Hidden URL input to maintain compatibility if user wants to paste URL, but mostly driven by upload */}
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem className="sr-only">
                  <FormLabel>URL da Foto</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
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
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
