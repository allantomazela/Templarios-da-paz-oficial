import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download, ExternalLink, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { FinancialTransactionAttachment } from '@/lib/financial-attachments'
import {
  canPreviewFinancialAttachment,
  canPreviewPendingFile,
  downloadFinancialAttachment,
  formatAttachmentFileSize,
  getCachedAttachmentSignedUrl,
  isFinancialAttachmentImage,
  isFinancialAttachmentPdf,
  resolveFinancialAttachmentMimeType,
} from '@/lib/financial-attachment-access'
import { getFinancialDocumentTypeLabel } from '@/lib/financial-attachments'

interface FinancialAttachmentPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  attachment: FinancialTransactionAttachment | null
  pendingFile?: File | null
}

export function FinancialAttachmentPreviewDialog({
  open,
  onOpenChange,
  attachment,
  pendingFile = null,
}: FinancialAttachmentPreviewDialogProps) {
  const { toast } = useToast()
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const title = attachment?.fileName ?? pendingFile?.name ?? 'Comprovante'
  const mimeType = attachment
    ? resolveFinancialAttachmentMimeType(attachment)
    : pendingFile
      ? resolveFinancialAttachmentMimeType({
          mimeType: pendingFile.type,
          fileName: pendingFile.name,
        })
      : 'application/octet-stream'

  const fileSize = attachment?.fileSize ?? pendingFile?.size ?? 0
  const canPreview = attachment
    ? canPreviewFinancialAttachment(attachment)
    : pendingFile
      ? canPreviewPendingFile(pendingFile)
      : false

  useEffect(() => {
    if (!open) {
      setPreviewUrl(null)
      return
    }

    let cancelled = false
    let objectUrl: string | null = null

    const loadPreview = async () => {
      setLoading(true)
      try {
        if (pendingFile) {
          objectUrl = URL.createObjectURL(pendingFile)
          if (!cancelled) setPreviewUrl(objectUrl)
          return
        }

        if (attachment) {
          const url = await getCachedAttachmentSignedUrl(attachment.filePath)
          if (!cancelled) setPreviewUrl(url)
        }
      } catch (error) {
        if (!cancelled) {
          toast({
            title: 'Erro ao carregar pré-visualização',
            description: error instanceof Error ? error.message : 'Tente novamente.',
            variant: 'destructive',
          })
          onOpenChange(false)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadPreview()

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [open, attachment, pendingFile, onOpenChange, toast])

  const handleDownload = async () => {
    if (pendingFile) {
      const objectUrl = URL.createObjectURL(pendingFile)
      try {
        const anchor = document.createElement('a')
        anchor.href = objectUrl
        anchor.download = pendingFile.name
        anchor.rel = 'noopener'
        document.body.appendChild(anchor)
        anchor.click()
        anchor.remove()
      } finally {
        URL.revokeObjectURL(objectUrl)
      }
      return
    }

    if (!attachment) return

    setDownloading(true)
    try {
      await downloadFinancialAttachment(attachment)
    } catch (error) {
      toast({
        title: 'Erro ao baixar',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setDownloading(false)
    }
  }

  const handleOpenNewTab = () => {
    if (!previewUrl) return
    window.open(previewUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col gap-4">
        <DialogHeader>
          <DialogTitle className="truncate pr-6">{title}</DialogTitle>
          {attachment ? (
            <p className="text-sm text-muted-foreground">
              {getFinancialDocumentTypeLabel(attachment.documentType)} ·{' '}
              {formatAttachmentFileSize(fileSize)}
            </p>
          ) : pendingFile ? (
            <p className="text-sm text-muted-foreground">
              Aguardando salvamento · {formatAttachmentFileSize(fileSize)}
            </p>
          ) : null}
        </DialogHeader>

        <div className="min-h-[240px] flex-1 overflow-hidden rounded-md border bg-muted/30">
          {loading ? (
            <div className="flex h-[min(60vh,480px)] items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Carregando visualização...
            </div>
          ) : !canPreview || !previewUrl ? (
            <div className="flex h-[min(60vh,480px)] items-center justify-center p-6 text-center text-sm text-muted-foreground">
              Pré-visualização indisponível para este formato. Use o download.
            </div>
          ) : isFinancialAttachmentImage(mimeType) ? (
            <div className="flex h-[min(60vh,480px)] items-center justify-center overflow-auto p-4">
              <img
                src={previewUrl}
                alt={title}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          ) : isFinancialAttachmentPdf(mimeType) ? (
            <iframe
              title={title}
              src={previewUrl}
              className="h-[min(60vh,480px)] w-full bg-white"
            />
          ) : null}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            type="button"
            variant="outline"
            disabled={!previewUrl || loading}
            onClick={handleOpenNewTab}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Abrir em nova aba
          </Button>
          <Button
            type="button"
            disabled={downloading || loading || (!attachment && !pendingFile)}
            onClick={() => void handleDownload()}
          >
            {downloading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Baixar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
