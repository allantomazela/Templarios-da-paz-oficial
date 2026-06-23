import { useEffect, useRef, useState } from 'react'
import {
  Check,
  Download,
  FileText,
  Loader2,
  Paperclip,
  Pencil,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import {
  createAttachmentDownloadUrl,
  deleteTransactionAttachment,
  fetchTransactionAttachments,
  FINANCIAL_DOCUMENT_TYPES,
  getFinancialDocumentTypeLabel,
  updateTransactionAttachment,
  uploadTransactionAttachment,
  validateFinancialAttachmentFile,
  type FinancialDocumentType,
  type FinancialTransactionAttachment,
} from '@/lib/financial-attachments'

export interface PendingFinancialAttachment {
  id: string
  file: File
  documentType: FinancialDocumentType
}

interface TransactionAttachmentsPanelProps {
  transactionId: string | null
  pendingFiles: PendingFinancialAttachment[]
  onPendingFilesChange: (files: PendingFinancialAttachment[]) => void
}

interface AttachmentRowProps {
  attachment: FinancialTransactionAttachment
  onUpdated: (attachment: FinancialTransactionAttachment) => void
  onDeleted: (attachmentId: string) => void
}

function AttachmentRow({ attachment, onUpdated, onDeleted }: AttachmentRowProps) {
  const { toast } = useToast()
  const [isRenaming, setIsRenaming] = useState(false)
  const [draftName, setDraftName] = useState(attachment.fileName)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setDraftName(attachment.fileName)
  }, [attachment.fileName])

  const handleDocumentTypeChange = async (value: FinancialDocumentType) => {
    if (value === attachment.documentType) return

    setIsSaving(true)
    try {
      const updated = await updateTransactionAttachment(attachment.id, {
        documentType: value,
      })
      onUpdated(updated)
      toast({ title: 'Tipo do comprovante atualizado' })
    } catch (error) {
      toast({
        title: 'Erro ao atualizar tipo',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveRename = async () => {
    const trimmed = draftName.trim()
    if (!trimmed) {
      toast({
        title: 'Nome inválido',
        description: 'Informe um nome para o arquivo.',
        variant: 'destructive',
      })
      return
    }

    if (trimmed === attachment.fileName) {
      setIsRenaming(false)
      return
    }

    setIsSaving(true)
    try {
      const updated = await updateTransactionAttachment(attachment.id, {
        fileName: trimmed,
      })
      onUpdated(updated)
      setIsRenaming(false)
      toast({ title: 'Nome do arquivo atualizado' })
    } catch (error) {
      toast({
        title: 'Erro ao renomear',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelRename = () => {
    setDraftName(attachment.fileName)
    setIsRenaming(false)
  }

  const handleDownload = async () => {
    try {
      const url = await createAttachmentDownloadUrl(attachment.filePath)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (error) {
      toast({
        title: 'Erro ao baixar',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async () => {
    try {
      await deleteTransactionAttachment(attachment)
      onDeleted(attachment.id)
      toast({ title: 'Anexo removido' })
    } catch (error) {
      toast({
        title: 'Erro ao remover',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-2 rounded-md border px-3 py-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-2">
          {isRenaming ? (
            <div className="flex items-center gap-2">
              <Input
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                disabled={isSaving}
                className="h-8"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                title="Confirmar"
                disabled={isSaving}
                onClick={() => void handleSaveRename()}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                title="Cancelar"
                disabled={isSaving}
                onClick={handleCancelRename}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <p className="truncate text-sm font-medium">{attachment.fileName}</p>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                title="Renomear"
                disabled={isSaving}
                onClick={() => setIsRenaming(true)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          <Select
            value={attachment.documentType}
            onValueChange={(value) =>
              void handleDocumentTypeChange(value as FinancialDocumentType)
            }
            disabled={isSaving}
          >
            <SelectTrigger className="h-8 max-w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FINANCIAL_DOCUMENT_TYPES.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex shrink-0 gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            title="Baixar"
            disabled={isSaving}
            onClick={() => void handleDownload()}
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-destructive"
            title="Remover"
            disabled={isSaving}
            onClick={() => void handleDelete()}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export function TransactionAttachmentsPanel({
  transactionId,
  pendingFiles,
  onPendingFilesChange,
}: TransactionAttachmentsPanelProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [documentType, setDocumentType] =
    useState<FinancialDocumentType>('nota_fiscal')
  const [attachments, setAttachments] = useState<FinancialTransactionAttachment[]>(
    [],
  )
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!transactionId) {
      setAttachments([])
      return
    }

    let isMounted = true
    setLoading(true)
    void fetchTransactionAttachments(transactionId)
      .then((rows) => {
        if (isMounted) setAttachments(rows)
      })
      .catch((error) => {
        toast({
          title: 'Erro ao carregar anexos',
          description:
            error instanceof Error ? error.message : 'Tente novamente.',
          variant: 'destructive',
        })
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [transactionId, toast])

  const handleSelectFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const validationError = validateFinancialAttachmentFile(file)
    if (validationError) {
      toast({
        title: 'Arquivo inválido',
        description: validationError,
        variant: 'destructive',
      })
      event.target.value = ''
      return
    }

    if (transactionId) {
      void handleUploadExistingTransaction(file, documentType)
    } else {
      onPendingFilesChange([
        ...pendingFiles,
        {
          id: crypto.randomUUID(),
          file,
          documentType,
        },
      ])
    }

    event.target.value = ''
  }

  const handleUploadExistingTransaction = async (
    file: File,
    type: FinancialDocumentType,
  ) => {
    if (!transactionId) return
    setUploading(true)
    try {
      const created = await uploadTransactionAttachment(transactionId, file, type)
      setAttachments((current) => [...current, created])
      toast({ title: 'Comprovante anexado' })
    } catch (error) {
      toast({
        title: 'Erro ao anexar',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }

  const handleRemovePending = (id: string) => {
    onPendingFilesChange(pendingFiles.filter((item) => item.id !== id))
  }

  const handleAttachmentUpdated = (updated: FinancialTransactionAttachment) => {
    setAttachments((current) =>
      current.map((item) => (item.id === updated.id ? updated : item)),
    )
  }

  const handleAttachmentDeleted = (attachmentId: string) => {
    setAttachments((current) => current.filter((item) => item.id !== attachmentId))
  }

  const totalCount = attachments.length + pendingFiles.length

  return (
    <div className="space-y-3 rounded-md border p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Paperclip className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-medium">Comprovantes</Label>
        </div>
        <span className="text-xs text-muted-foreground">{totalCount} anexo(s)</span>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Select
          value={documentType}
          onValueChange={(value) => setDocumentType(value as FinancialDocumentType)}
        >
          <SelectTrigger className="sm:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FINANCIAL_DOCUMENT_TYPES.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          Adicionar arquivo
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/*"
          className="hidden"
          onChange={handleSelectFile}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        PDF ou imagem (JPG, PNG, WebP), até 10 MB. Acesso restrito ao tesoureiro e
        administrador.
      </p>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando anexos...
        </div>
      ) : (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <AttachmentRow
              key={attachment.id}
              attachment={attachment}
              onUpdated={handleAttachmentUpdated}
              onDeleted={handleAttachmentDeleted}
            />
          ))}

          {pendingFiles.map((pending) => (
            <div
              key={pending.id}
              className="flex items-center justify-between gap-2 rounded-md border border-dashed px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{pending.file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {getFinancialDocumentTypeLabel(pending.documentType)} · aguardando
                  salvamento
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-destructive"
                onClick={() => handleRemovePending(pending.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          {totalCount === 0 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              Nenhum comprovante anexado.
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

export async function uploadPendingTransactionAttachments(
  transactionId: string,
  pendingFiles: PendingFinancialAttachment[],
): Promise<void> {
  for (const pending of pendingFiles) {
    await uploadTransactionAttachment(
      transactionId,
      pending.file,
      pending.documentType,
    )
  }
}
