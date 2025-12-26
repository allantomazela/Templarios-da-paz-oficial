/**
 * EXEMPLO DE MIGRAÇÃO - VenerableDialog
 * 
 * Este é um exemplo de como o componente ficaria após migração.
 * NÃO substitua o arquivo original ainda - use como referência!
 * 
 * Para aplicar: Renomeie este arquivo para VenerableDialog.tsx
 * (ou faça backup do original primeiro)
 */

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
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
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Venerable } from '@/stores/useSiteSettingsStore'
import { Loader2, Upload, Trash2 } from 'lucide-react'
// ✅ NOVO: Importar hook de upload de imagem
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
  // ✅ ANTES: const [isUploading, setIsUploading] = useState(false)
  // ✅ ANTES: const fileInputRef = useRef<HTMLInputElement>(null)
  // ✅ ANTES: ~30 linhas de lógica de upload manual
  // ✅ DEPOIS: Hook gerencia tudo automaticamente
  const imageUpload = useImageUpload({
    bucket: 'site-assets',
    folder: 'venerables',
    maxSize: 400, // Avatar size
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
    if (venerableToEdit) {
      form.reset({
        name: venerableToEdit.name,
        period: venerableToEdit.period,
        imageUrl: venerableToEdit.imageUrl || '',
      })
      // ✅ NOVO: Sincronizar URL do hook com o form
      if (venerableToEdit.imageUrl) {
        imageUpload.reset() // Reset do hook
        // Não setamos imageUrl no hook porque já está no form
      }
    } else {
      form.reset({
        name: '',
        period: '',
        imageUrl: '',
      })
      imageUpload.reset() // Reset do hook quando criar novo
    }
  }, [venerableToEdit, form, open, imageUpload])

  // ✅ ANTES: ~30 linhas com try/catch, compressImage, uploadToStorage, toast manual
  // ✅ DEPOIS: Apenas 5 linhas - hook faz tudo
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const url = await imageUpload.handleUpload(file)
    if (url) {
      form.setValue('imageUrl', url, { shouldDirty: true })
    }
  }

  const handleSubmit = async (data: VenerableFormValues) => {
    await onSave(data)
  }

  const imageUrl = form.watch('imageUrl')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {venerableToEdit ? 'Editar Venerável' : 'Adicionar Venerável'}
          </DialogTitle>
          <DialogDescription>
            {venerableToEdit
              ? 'Edite as informações do venerável abaixo.'
              : 'Preencha os dados do venerável para adicionar à galeria.'}
          </DialogDescription>
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
                  {imageUpload.isUploading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  ) : (
                    'VM'
                  )}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                {/* ✅ ANTES: ref={fileInputRef} */}
                {/* ✅ DEPOIS: ref={imageUpload.inputRef} */}
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
                {imageUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive text-xs"
                    onClick={() => {
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
                disabled={imageUpload.isUploading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={imageUpload.isUploading}>
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

