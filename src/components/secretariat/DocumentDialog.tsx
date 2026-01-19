import { useEffect, useState, useRef } from 'react'
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
import { Loader2, Upload, X } from 'lucide-react'
import { uploadToStorage } from '@/lib/upload-utils'
import { useToast } from '@/hooks/use-toast'

const documentSchema = z.object({
  title: z.string().min(3, 'Título é obrigatório'),
  description: z.string().min(5, 'Descrição é obrigatória'),
  category: z.string().min(1, 'Categoria é obrigatória'),
})

type DocumentFormValues = z.infer<typeof documentSchema>

interface DocumentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentToEdit: LodgeDocument | null
  onSave: (data: DocumentFormValues & { fileUrl?: string; fileName?: string; fileSize?: number; fileType?: string }) => void
}

export function DocumentDialog({
  open,
  onOpenChange,
  documentToEdit,
  onSave,
}: DocumentDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

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
      setSelectedFile(null)
    } else {
      form.reset({ title: '', description: '', category: '' })
      setSelectedFile(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [documentToEdit, form, open])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de arquivo
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    ]
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx']

    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    const isValidType = allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension)

    if (!isValidType) {
      toast({
        variant: 'destructive',
        title: 'Tipo de arquivo inválido',
        description: 'Por favor, selecione um arquivo PDF, DOC, DOCX, XLS ou XLSX.',
      })
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    // Validar tamanho (10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB em bytes
    if (file.size > maxSize) {
      toast({
        variant: 'destructive',
        title: 'Arquivo muito grande',
        description: 'O arquivo deve ter no máximo 10MB.',
      })
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    setSelectedFile(file)
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (data: DocumentFormValues) => {
    // Se estiver editando, não precisa fazer upload
    if (documentToEdit) {
      onSave(data)
      return
    }

    // Se não tiver arquivo selecionado, mostrar erro
    if (!selectedFile) {
      toast({
        variant: 'destructive',
        title: 'Arquivo obrigatório',
        description: 'Por favor, selecione um arquivo para upload.',
      })
      return
    }

    setIsUploading(true)
    setUploadProgress('Enviando arquivo...')

    try {
      // Fazer upload do arquivo
      const fileUrl = await uploadToStorage(
        selectedFile,
        'site-assets',
        'documents'
      )

      setUploadProgress('Arquivo enviado com sucesso!')

      // Chamar onSave com os dados do arquivo
      onSave({
        ...data,
        fileUrl,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type,
      })
    } catch (error) {
      console.error('Erro no upload:', error)
      toast({
        variant: 'destructive',
        title: 'Erro no Upload',
        description: error instanceof Error ? error.message : 'Falha ao fazer upload do arquivo.',
      })
    } finally {
      setIsUploading(false)
      setUploadProgress('')
    }
  }

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
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
                <FormLabel>Arquivo *</FormLabel>
                {selectedFile ? (
                  <div className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Upload className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{selectedFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleRemoveFile}
                      disabled={isUploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div>
                    <Input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept=".pdf,.doc,.docx,.xls,.xlsx"
                      disabled={isUploading}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Formatos aceitos: PDF, DOC, DOCX, XLS, XLSX. Máx: 10MB.
                    </p>
                  </div>
                )}
                {isUploading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {uploadProgress}
                  </div>
                )}
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
              <Button type="submit" disabled={isUploading || (!documentToEdit && !selectedFile)}>
                {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {documentToEdit ? 'Salvar' : 'Enviar Documento'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
