import { AlertCircle, Paperclip } from 'lucide-react'
import type { Transaction } from '@/lib/data'

interface TransactionAttachmentIndicatorProps {
  transaction: Transaction
  visible: boolean
  showMissingReceiptWarning?: boolean
}

export function TransactionAttachmentIndicator({
  transaction,
  visible,
  showMissingReceiptWarning = false,
}: TransactionAttachmentIndicatorProps) {
  if (!visible) return null

  if ((transaction.attachmentCount ?? 0) > 0) {
    return (
      <span
        className="inline-flex items-center gap-1 text-xs text-muted-foreground"
        title={`${transaction.attachmentCount} comprovante(s)`}
      >
        <Paperclip className="h-3 w-3" />
        {transaction.attachmentCount}
      </span>
    )
  }

  if (showMissingReceiptWarning && !transaction.attachmentNotes) {
    return (
      <span
        className="inline-flex items-center gap-1 text-xs text-amber-600"
        title="Sem comprovante anexado"
      >
        <AlertCircle className="h-3 w-3" />
        Sem comprovante
      </span>
    )
  }

  return null
}
