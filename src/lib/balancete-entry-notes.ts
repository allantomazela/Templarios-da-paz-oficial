import type { BalanceteAttachmentInfo } from '@/lib/accounting-balancete'

export interface BalanceteEntryNotesDisplay {
  /** Texto compacto para a célula (uma linha). */
  text: string
  /** Texto completo para tooltip / impressão detalhada. */
  title: string
}

/**
 * Formata observações e comprovantes em uma única linha para o razão analítico.
 * Retorna null quando não há conteúdo (célula fica vazia).
 */
export function formatBalanceteEntryNotesCompact(
  attachmentNotes: string | undefined,
  attachments: BalanceteAttachmentInfo[],
): BalanceteEntryNotesDisplay | null {
  const parts: string[] = []
  const note = attachmentNotes?.trim()
  if (note) parts.push(note)

  if (attachments.length > 0) {
    const files = attachments.map(
      (attachment) => `${attachment.documentTypeLabel}: ${attachment.fileName}`,
    )
    if (attachments.length === 1) {
      parts.push(files[0])
    } else {
      parts.push(`${attachments.length} comprovantes (${files.join('; ')})`)
    }
  }

  if (parts.length === 0) return null

  return {
    text: parts.join(' · '),
    title: parts.join('\n'),
  }
}
