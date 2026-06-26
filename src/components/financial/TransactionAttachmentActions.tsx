import { useState } from 'react'
import { Download, Eye, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import {
  downloadFinancialAttachment,
  formatAttachmentFileSize,
} from '@/lib/financial-attachment-access'
import {
  fetchTransactionAttachments,
  type FinancialTransactionAttachment,
} from '@/lib/financial-attachments'
import { FinancialAttachmentPreviewDialog } from '@/components/financial/FinancialAttachmentPreviewDialog'

interface TransactionAttachmentActionsProps {
  transactionId: string
  attachmentCount?: number
  visible: boolean
  size?: 'icon' | 'sm'
}

export function TransactionAttachmentActions({
  transactionId,
  attachmentCount = 0,
  visible,
  size = 'icon',
}: TransactionAttachmentActionsProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [attachments, setAttachments] = useState<FinancialTransactionAttachment[] | null>(
    null,
  )
  const [previewAttachment, setPreviewAttachment] =
    useState<FinancialTransactionAttachment | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  if (!visible || attachmentCount <= 0) return null

  const loadAttachments = async (): Promise<FinancialTransactionAttachment[]> => {
    if (attachments) return attachments

    setLoading(true)
    try {
      const rows = await fetchTransactionAttachments(transactionId)
      setAttachments(rows)
      return rows
    } catch (error) {
      toast({
        title: 'Erro ao carregar comprovantes',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      })
      return []
    } finally {
      setLoading(false)
    }
  }

  const handlePreview = async (attachment: FinancialTransactionAttachment) => {
    setPreviewAttachment(attachment)
  }

  const handleDownload = async (attachment: FinancialTransactionAttachment) => {
    setDownloadingId(attachment.id)
    try {
      await downloadFinancialAttachment(attachment)
    } catch (error) {
      toast({
        title: 'Erro ao baixar',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setDownloadingId(null)
    }
  }

  const handleSinglePreview = async () => {
    const rows = await loadAttachments()
    if (rows.length === 1) {
      await handlePreview(rows[0])
    }
  }

  const handleSingleDownload = async () => {
    const rows = await loadAttachments()
    if (rows.length === 1 && rows[0]) {
      await handleDownload(rows[0])
    }
  }

  const handleMenuOpen = (open: boolean) => {
    if (open) void loadAttachments()
  }

  const buttonSize = size === 'sm' ? 'sm' : 'icon'
  const iconClass = size === 'sm' ? 'h-4 w-4' : 'h-4 w-4'

  const renderPickerItem = (
    attachment: FinancialTransactionAttachment,
    action: 'preview' | 'download',
  ) => (
    <DropdownMenuItem
      key={attachment.id}
      className="flex items-center justify-between gap-3"
      onClick={() =>
        void (action === 'preview'
          ? handlePreview(attachment)
          : handleDownload(attachment))
      }
    >
      <span className="truncate">{attachment.fileName}</span>
      <span className="shrink-0 text-xs text-muted-foreground">
        {action === 'download' && downloadingId === attachment.id ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          formatAttachmentFileSize(attachment.fileSize)
        )}
      </span>
    </DropdownMenuItem>
  )

  const previewButton =
    attachmentCount === 1 ? (
      <Button
        type="button"
        variant="ghost"
        size={buttonSize}
        title="Pré-visualizar comprovante"
        disabled={loading}
        onClick={() => void handleSinglePreview()}
      >
        {loading ? (
          <Loader2 className={`${iconClass} animate-spin`} />
        ) : (
          <Eye className={iconClass} />
        )}
      </Button>
    ) : (
      <DropdownMenu onOpenChange={handleMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size={buttonSize}
            title="Pré-visualizar comprovante"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className={`${iconClass} animate-spin`} />
            ) : (
              <Eye className={iconClass} />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="max-w-[min(100vw-2rem,20rem)]">
          {loading && !attachments ? (
            <DropdownMenuItem disabled>Carregando...</DropdownMenuItem>
          ) : attachments && attachments.length > 0 ? (
            attachments.map((attachment) => renderPickerItem(attachment, 'preview'))
          ) : (
            <DropdownMenuItem disabled>Nenhum comprovante</DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    )

  const downloadButton =
    attachmentCount === 1 ? (
      <Button
        type="button"
        variant="ghost"
        size={buttonSize}
        title="Baixar comprovante"
        disabled={loading || downloadingId !== null}
        onClick={() => void handleSingleDownload()}
      >
        {loading || downloadingId ? (
          <Loader2 className={`${iconClass} animate-spin`} />
        ) : (
          <Download className={iconClass} />
        )}
      </Button>
    ) : (
      <DropdownMenu onOpenChange={handleMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size={buttonSize}
            title="Baixar comprovante"
            disabled={loading}
          >
            <Download className={iconClass} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="max-w-[min(100vw-2rem,20rem)]">
          {loading && !attachments ? (
            <DropdownMenuItem disabled>Carregando...</DropdownMenuItem>
          ) : attachments && attachments.length > 0 ? (
            attachments.map((attachment) => renderPickerItem(attachment, 'download'))
          ) : (
            <DropdownMenuItem disabled>Nenhum comprovante</DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    )

  return (
    <>
      {previewButton}
      {downloadButton}
      <FinancialAttachmentPreviewDialog
        open={previewAttachment !== null}
        onOpenChange={(open) => {
          if (!open) setPreviewAttachment(null)
        }}
        attachment={previewAttachment}
      />
    </>
  )
}
