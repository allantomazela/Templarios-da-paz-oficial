import { useEffect, useRef, useState } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FormHeader } from '@/components/ui/form-header'
import { useAgapeStore, AgapeMenuItem } from '@/stores/useAgapeStore'
import { useToast } from '@/hooks/use-toast'
import { useImageUpload } from '@/hooks/use-image-upload'
import {
  AGAPE_MENU_IMAGE_MAX_DIMENSION_PX,
  AGAPE_MENU_IMAGE_MAX_FILE_SIZE_BYTES,
  AGAPE_MENU_IMAGE_RULE_LABEL,
} from '@/constants/upload-rules'
import { Loader2, Upload, UtensilsCrossed } from 'lucide-react'

const menuItemSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Preço deve ser maior ou igual a zero'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  image_url: z.string().optional(),
  is_active: z.boolean().default(true),
})

type MenuItemFormValues = z.infer<typeof menuItemSchema>

interface MenuItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: AgapeMenuItem | null
}

const CATEGORIES = [
  'Bebida',
  'Comida',
  'Sobremesa',
  'Acompanhamento',
  'Outros',
]

export function MenuItemDialog({ open, onOpenChange, item }: MenuItemDialogProps) {
  const { createMenuItem, updateMenuItem, loading } = useAgapeStore()
  const { toast } = useToast()
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null)
  const [isSubmittingLocal, setIsSubmittingLocal] = useState(false)
  const previewBlobRef = useRef<string | null>(null)

  const revokePreviewBlob = () => {
    if (previewBlobRef.current) {
      URL.revokeObjectURL(previewBlobRef.current)
      previewBlobRef.current = null
    }
  }

  const imageUpload = useImageUpload({
    bucket: 'site-assets',
    folder: 'agape-menu',
    maxSize: AGAPE_MENU_IMAGE_MAX_DIMENSION_PX,
    maxFileSizeBytes: AGAPE_MENU_IMAGE_MAX_FILE_SIZE_BYTES,
    quality: 0.75,
    showSuccessToast: false,
    errorMessage: 'Falha no upload. Use imagem de até 512 px e 1,5 MB.',
  })

  const isSavingForm =
    loading || imageUpload.isUploading || isSubmittingLocal

  const form = useForm<MenuItemFormValues>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      category: 'Comida',
      image_url: '',
      is_active: true,
    },
  })

  useEffect(() => {
    if (!open) {
      revokePreviewBlob()
      return
    }

    revokePreviewBlob()

    if (item) {
      form.reset({
        name: item.name,
        description: item.description || '',
        price: item.price,
        category: item.category,
        image_url: item.image_url || '',
        is_active: item.is_active,
      })
      setPreviewImage(item.image_url || null)
      setPendingImageFile(null)
      imageUpload.reset()
    } else {
      form.reset({
        name: '',
        description: '',
        price: 0,
        category: 'Comida',
        image_url: '',
        is_active: true,
      })
      setPreviewImage(null)
      setPendingImageFile(null)
      imageUpload.reset()
    }

    return () => revokePreviewBlob()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id, open, form])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: 'Arquivo inválido',
        description: 'Selecione uma imagem JPG ou PNG.',
      })
      if (imageUpload.inputRef.current) {
        imageUpload.inputRef.current.value = ''
      }
      return
    }

    if (file.size > AGAPE_MENU_IMAGE_MAX_FILE_SIZE_BYTES) {
      toast({
        variant: 'destructive',
        title: 'Arquivo muito grande',
        description: 'Use uma imagem de até 1,5 MB.',
      })
      if (imageUpload.inputRef.current) {
        imageUpload.inputRef.current.value = ''
      }
      return
    }

    revokePreviewBlob()
    const blobUrl = URL.createObjectURL(file)
    previewBlobRef.current = blobUrl
    setPreviewImage(blobUrl)
    setPendingImageFile(file)
  }

  const handleRemoveImage = () => {
    revokePreviewBlob()
    setPreviewImage(null)
    setPendingImageFile(null)
    form.setValue('image_url', '', { shouldDirty: true })
    imageUpload.reset()
  }

  const onSubmit = async (data: MenuItemFormValues) => {
    setIsSubmittingLocal(true)
    try {
      let imageUrl = data.image_url?.trim() || null

      if (pendingImageFile) {
        const url = await imageUpload.handleUpload(pendingImageFile)
        if (!url) return
        imageUrl = url
        setPendingImageFile(null)
        setPreviewImage(url)
        form.setValue('image_url', url)
      }

      const payload = {
        ...data,
        description: data.description?.trim() || null,
        image_url: imageUrl,
      }

      if (item) {
        const { error } = await updateMenuItem(item.id, payload)
        if (error) {
          toast({
            title: 'Erro',
            description: 'Não foi possível atualizar o item.',
            variant: 'destructive',
          })
        } else {
          toast({
            title: 'Sucesso',
            description: 'Item atualizado com sucesso.',
          })
          onOpenChange(false)
        }
      } else {
        const { error } = await createMenuItem(payload)
        if (error) {
          toast({
            title: 'Erro',
            description: 'Não foi possível criar o item.',
            variant: 'destructive',
          })
        } else {
          toast({
            title: 'Sucesso',
            description: 'Item criado com sucesso.',
          })
          form.reset()
          onOpenChange(false)
        }
      }
    } finally {
      setIsSubmittingLocal(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
        <DialogTitle className="sr-only">
          {item ? 'Editar Item do Cardápio' : 'Novo Item do Cardápio'}
        </DialogTitle>
        <FormHeader
          title={item ? 'Editar Item do Cardápio' : 'Novo Item do Cardápio'}
          description={
            item
              ? 'Atualize as informações do item do cardápio.'
              : 'Adicione um novo item ao cardápio de ágape.'
          }
          icon={<UtensilsCrossed className="h-5 w-5" />}
        />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <FormLabel>Imagem do produto (opcional)</FormLabel>
              <p className="text-xs text-muted-foreground">
                {AGAPE_MENU_IMAGE_RULE_LABEL} A imagem é enviada ao clicar em Salvar.
              </p>
              <div className="flex flex-col gap-3">
                <div className="relative aspect-square w-full max-w-[200px] border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/30 overflow-hidden">
                  {previewImage ? (
                    <>
                      <img
                        src={previewImage}
                        alt="Preview do produto"
                        className="w-full h-full object-cover"
                      />
                      {imageUpload.isUploading && (
                        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2 text-white text-xs">
                          <Loader2 className="h-8 w-8 animate-spin" />
                          <span>Enviando imagem...</span>
                        </div>
                      )}
                    </>
                  ) : imageUpload.isUploading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
                    onChange={handleImageSelect}
                    disabled={isSavingForm}
                  />
                </div>
                {previewImage && !isSavingForm && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-fit"
                    onClick={handleRemoveImage}
                  >
                    Remover imagem
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
                    <Input placeholder="Ex: Refrigerante" {...field} />
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
                      placeholder="Descrição do item..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                      />
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSavingForm}>
                {isSavingForm ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {imageUpload.isUploading ? 'Enviando imagem...' : 'Salvando...'}
                  </>
                ) : item ? (
                  'Salvar'
                ) : (
                  'Criar'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
