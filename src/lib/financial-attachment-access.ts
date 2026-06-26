import { supabase } from '@/lib/supabase/client'
import { toErrorMessage } from '@/lib/async-utils'

export const FINANCIAL_DOCUMENTS_BUCKET = 'financial-documents'

const SIGNED_URL_TTL_SECONDS = 3600
const CACHE_SAFETY_MS = 60_000

const signedUrlCache = new Map<string, { url: string; expiresAt: number }>()

export interface FinancialAttachmentRef {
  filePath: string
  fileName: string
  mimeType: string
}

export function formatAttachmentFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function resolveFinancialAttachmentMimeType(
  source: Pick<FinancialAttachmentRef, 'mimeType' | 'fileName'>,
): string {
  const normalized = source.mimeType?.trim().toLowerCase()
  if (normalized && normalized !== 'application/octet-stream') {
    return normalized
  }

  const extension = source.fileName.split('.').pop()?.toLowerCase()
  switch (extension) {
    case 'pdf':
      return 'application/pdf'
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'png':
      return 'image/png'
    case 'webp':
      return 'image/webp'
    default:
      return normalized || 'application/octet-stream'
  }
}

export function isFinancialAttachmentImage(mimeType: string): boolean {
  return mimeType.startsWith('image/')
}

export function isFinancialAttachmentPdf(mimeType: string): boolean {
  return mimeType === 'application/pdf'
}

export function canPreviewFinancialAttachment(
  source: Pick<FinancialAttachmentRef, 'mimeType' | 'fileName'>,
): boolean {
  const mimeType = resolveFinancialAttachmentMimeType(source)
  return isFinancialAttachmentImage(mimeType) || isFinancialAttachmentPdf(mimeType)
}

export function canPreviewPendingFile(file: File): boolean {
  return canPreviewFinancialAttachment({
    mimeType: file.type,
    fileName: file.name,
  })
}

export function invalidateAttachmentSignedUrl(filePath: string): void {
  signedUrlCache.delete(filePath)
}

export async function createAttachmentDownloadUrl(
  filePath: string,
  expiresInSeconds = SIGNED_URL_TTL_SECONDS,
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(FINANCIAL_DOCUMENTS_BUCKET)
    .createSignedUrl(filePath, expiresInSeconds)

  if (error || !data?.signedUrl) {
    throw new Error(toErrorMessage(error, 'Não foi possível gerar o link de download.'))
  }

  return data.signedUrl
}

export async function getCachedAttachmentSignedUrl(filePath: string): Promise<string> {
  const cached = signedUrlCache.get(filePath)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.url
  }

  const url = await createAttachmentDownloadUrl(filePath, SIGNED_URL_TTL_SECONDS)
  signedUrlCache.set(filePath, {
    url,
    expiresAt: Date.now() + SIGNED_URL_TTL_SECONDS * 1000 - CACHE_SAFETY_MS,
  })
  return url
}

export async function downloadFinancialAttachment(
  attachment: FinancialAttachmentRef,
): Promise<void> {
  const url = await getCachedAttachmentSignedUrl(attachment.filePath)
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('Falha ao baixar o arquivo.')
  }

  const blob = await response.blob()
  const objectUrl = URL.createObjectURL(blob)

  try {
    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = attachment.fileName
    anchor.rel = 'noopener'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

/** Limpa cache em memória (útil em testes). */
export function clearAttachmentSignedUrlCache(): void {
  signedUrlCache.clear()
}
