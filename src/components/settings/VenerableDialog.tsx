import { useEffect, useState, useRef } from 'react'
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
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Venerable } from '@/stores/useSiteSettingsStore'
import { Loader2, Upload, Trash2 } from 'lucide-react'
import { compressImage } from '@/lib/image-utils'
import { uploadToStorage } from '@/lib/upload-utils'
import { useToast } from '@/hooks/use-toast'

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
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const form = useForm<VenerableFormValues>({
    resolver: zodResolver(venerableSchema),
    defaultValues: {
      name: '',
      period: '',
      imageUrl: '',
    },
  })

  useEffect(() => {
    if (venerableToEdit) {
      form.reset({
        name: venerableToEdit.name,
        period: venerableToEdit.period,
        imageUrl: venerableToEdit.imageUrl || '',
      })
    } else {
      form.reset({
        name: '',
        period: '',
        imageUrl: '',
      })
    }
  }, [venerableToEdit, form, open])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const optimizedFile = await compressImage(file, 400) // Avatar size
      const publicUrl = await uploadToStorage(
        optimizedFile,
        'site-assets',
        'venerables',
      )
      form.setValue('imageUrl', publicUrl, { shouldDirty: true })
      toast({
        title: 'Upload Concluído',
        description: 'Foto do venerável carregada.',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Falha ao carregar a imagem.',
      })
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (data: VenerableFormValues) => {
    setIsSubmitting(true)
    await onSave(data)
    setIsSubmitting(false)
  }

  const imageUrl = form.watch('imageUrl')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {venerableToEdit ? 'Editar Venerável' : 'Adicionar Venerável'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <div className="flex items-center gap-4 mb-4">
              <Avatar className="h-20 w-20 border-2">
                <AvatarImage src={imageUrl} alt="Preview" />
                <AvatarFallback>
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  Alterar Foto
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileSelect}
                />
                {imageUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive text-xs"
                    onClick={() => form.setValue('imageUrl', '')}
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
                disabled={isSubmitting || isUploading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || isUploading}>
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
