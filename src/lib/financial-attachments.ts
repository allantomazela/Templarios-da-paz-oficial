import { supabase } from '@/lib/supabase/client'
import { logError } from '@/lib/logger'
import { toErrorMessage, withTimeout } from '@/lib/async-utils'
import { invalidateAttachmentSignedUrl, createAttachmentDownloadUrl } from '@/lib/financial-attachment-access'
import {
  isFinancialImageUpload,
  prepareFinancialImageUpload,
} from '@/lib/financial-attachment-image'
import type { FinancialDocumentType } from '@/lib/financial-document-types'

export {
  FINANCIAL_DOCUMENT_TYPES,
  getFinancialDocumentTypeLabel,
} from '@/lib/financial-document-types'
export type { FinancialDocumentType } from '@/lib/financial-document-types'

export const FINANCIAL_DOCUMENTS_BUCKET = 'financial-documents'

export interface FinancialTransactionAttachment {
  id: string
  transactionId: string
  documentType: FinancialDocumentType
  filePath: string
  fileName: string
  fileSize: number
  mimeType: string
  thumbnailPath: string | null
  uploadedBy: string | null
  createdAt: string
}

export const FINANCIAL_ATTACHMENTS_PAGE_SIZE = 5

const UPLOAD_TIMEOUT_MS = 300000
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
])

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.jpg', '.jpeg', '.png', '.webp'])

const ATTACHMENT_SELECT_COLUMNS =
  'id, transaction_id, document_type, file_path, file_name, file_size, mime_type, thumbnail_path, uploaded_by, created_at'

function normalizeUploadContentType(file: File): string {
  const extension = `.${file.name.split('.').pop()?.toLowerCase() ?? ''}`

  if (file.type && ALLOWED_MIME_TYPES.has(file.type)) {
    return file.type
  }

  switch (extension) {
    case '.pdf':
      return 'application/pdf'
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg'
    case '.png':
      return 'image/png'
    case '.webp':
      return 'image/webp'
    default:
      return file.type || 'application/octet-stream'
  }
}

export function validateFinancialAttachmentFile(file: File): string | null {
  const extension = `.${file.name.split('.').pop()?.toLowerCase() ?? ''}`
  const isValidType =
    ALLOWED_MIME_TYPES.has(file.type) || ALLOWED_EXTENSIONS.has(extension)

  if (!isValidType) {
    return 'Formato inválido. Use PDF, JPG, PNG ou WebP.'
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return 'O arquivo deve ter no máximo 10 MB.'
  }

  return null
}

function mapAttachmentRow(row: Record<string, unknown>): FinancialTransactionAttachment {
  return {
    id: String(row.id),
    transactionId: String(row.transaction_id),
    documentType: row.document_type as FinancialDocumentType,
    filePath: String(row.file_path),
    fileName: String(row.file_name),
    fileSize: Number(row.file_size),
    mimeType: String(row.mime_type),
    thumbnailPath: row.thumbnail_path ? String(row.thumbnail_path) : null,
    uploadedBy: row.uploaded_by ? String(row.uploaded_by) : null,
    createdAt: String(row.created_at),
  }
}

function buildStoragePath(transactionId: string, fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase() || 'bin'
  const safeName = `${crypto.randomUUID()}.${extension}`
  return `transactions/${transactionId}/${safeName}`
}

export async function fetchTransactionAttachments(
  transactionId: string,
): Promise<FinancialTransactionAttachment[]> {
  const supabaseAny = supabase as any
  const { data, error } = await supabaseAny
    .from('financial_transaction_attachments')
    .select(ATTACHMENT_SELECT_COLUMNS)
    .eq('transaction_id', transactionId)
    .order('created_at', { ascending: true })

  if (error) throw new Error(toErrorMessage(error, 'Falha ao carregar anexos.'))
  return (data || []).map(mapAttachmentRow)
}

const ATTACHMENT_BATCH_SIZE = 100

export async function fetchAttachmentsByTransactionIds(
  transactionIds: string[],
): Promise<Record<string, FinancialTransactionAttachment[]>> {
  if (transactionIds.length === 0) return {}

  const supabaseAny = supabase as any
  const grouped: Record<string, FinancialTransactionAttachment[]> = {}

  for (let index = 0; index < transactionIds.length; index += ATTACHMENT_BATCH_SIZE) {
    const batch = transactionIds.slice(index, index + ATTACHMENT_BATCH_SIZE)
    const { data, error } = await supabaseAny
      .from('financial_transaction_attachments')
      .select(ATTACHMENT_SELECT_COLUMNS)
      .in('transaction_id', batch)
      .order('created_at', { ascending: true })

    if (error) {
      logError('fetchAttachmentsByTransactionIds', error)
      throw new Error(toErrorMessage(error, 'Falha ao carregar anexos.'))
    }

    for (const row of data || []) {
      const attachment = mapAttachmentRow(row)
      const current = grouped[attachment.transactionId] ?? []
      current.push(attachment)
      grouped[attachment.transactionId] = current
    }
  }

  return grouped
}

export async function fetchAttachmentCountsByTransaction(
  transactionIds: string[],
): Promise<Record<string, number>> {
  if (transactionIds.length === 0) return {}

  const supabaseAny = supabase as any
  const counts: Record<string, number> = {}

  for (let index = 0; index < transactionIds.length; index += ATTACHMENT_BATCH_SIZE) {
    const batch = transactionIds.slice(index, index + ATTACHMENT_BATCH_SIZE)
    const { data, error } = await supabaseAny
      .from('financial_transaction_attachments')
      .select('transaction_id')
      .in('transaction_id', batch)

    if (error) {
      logError('fetchAttachmentCountsByTransaction', error)
      continue
    }

    for (const row of data || []) {
      const id = String(row.transaction_id)
      counts[id] = (counts[id] ?? 0) + 1
    }
  }

  return counts
}

function buildThumbnailStoragePath(transactionId: string): string {
  return `transactions/${transactionId}/thumbs/${crypto.randomUUID()}.webp`
}

async function uploadStorageObject(filePath: string, file: File, contentType: string) {
  const uploadResult = await withTimeout(
    supabase.storage
      .from(FINANCIAL_DOCUMENTS_BUCKET)
      .upload(filePath, file, { contentType, upsert: false }),
    UPLOAD_TIMEOUT_MS,
    'Upload demorou muito. Tente novamente com um arquivo menor.',
  )

  if (uploadResult.error) {
    throw new Error(toErrorMessage(uploadResult.error, 'Falha ao enviar o arquivo.'))
  }
}

export async function uploadTransactionAttachment(
  transactionId: string,
  file: File,
  documentType: FinancialDocumentType,
): Promise<FinancialTransactionAttachment> {
  const validationError = validateFinancialAttachmentFile(file)
  if (validationError) throw new Error(validationError)

  let fileToUpload = file
  let thumbnailFile: File | null = null

  if (isFinancialImageUpload(file)) {
    const prepared = await prepareFinancialImageUpload(file)
    fileToUpload = prepared.file
    thumbnailFile = prepared.thumbnail

    const compressedValidation = validateFinancialAttachmentFile(fileToUpload)
    if (compressedValidation) throw new Error(compressedValidation)
  }

  const filePath = buildStoragePath(transactionId, fileToUpload.name)
  const contentType = normalizeUploadContentType(fileToUpload)
  const uploadedPaths: string[] = []

  try {
    await uploadStorageObject(filePath, fileToUpload, contentType)
    uploadedPaths.push(filePath)

    let thumbnailPath: string | null = null
    if (thumbnailFile) {
      thumbnailPath = buildThumbnailStoragePath(transactionId)
      await uploadStorageObject(thumbnailPath, thumbnailFile, 'image/webp')
      uploadedPaths.push(thumbnailPath)
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const supabaseAny = supabase as any
    const { data, error } = await supabaseAny
      .from('financial_transaction_attachments')
      .insert({
        transaction_id: transactionId,
        document_type: documentType,
        file_path: filePath,
        file_name: file.name,
        file_size: fileToUpload.size,
        mime_type: contentType,
        thumbnail_path: thumbnailPath,
        uploaded_by: user?.id ?? null,
      })
      .select(ATTACHMENT_SELECT_COLUMNS)
      .single()

    if (error) {
      throw new Error(toErrorMessage(error, 'Falha ao registrar o anexo.'))
    }

    return mapAttachmentRow(data)
  } catch (error) {
    if (uploadedPaths.length > 0) {
      await supabase.storage.from(FINANCIAL_DOCUMENTS_BUCKET).remove(uploadedPaths)
    }
    throw error instanceof Error ? error : new Error('Falha ao enviar o anexo.')
  }
}

export async function deleteTransactionAttachment(
  attachment: FinancialTransactionAttachment,
): Promise<void> {
  const supabaseAny = supabase as any
  const { error: dbError } = await supabaseAny
    .from('financial_transaction_attachments')
    .delete()
    .eq('id', attachment.id)

  if (dbError) {
    throw new Error(toErrorMessage(dbError, 'Falha ao remover o anexo.'))
  }

  invalidateAttachmentSignedUrl(attachment.filePath)
  if (attachment.thumbnailPath) {
    invalidateAttachmentSignedUrl(attachment.thumbnailPath)
  }

  const pathsToRemove = attachment.thumbnailPath
    ? [attachment.filePath, attachment.thumbnailPath]
    : [attachment.filePath]

  const { error: storageError } = await supabase.storage
    .from(FINANCIAL_DOCUMENTS_BUCKET)
    .remove(pathsToRemove)

  if (storageError) {
    logError('deleteTransactionAttachment storage', storageError)
  }
}

export { createAttachmentDownloadUrl }

export interface UpdateTransactionAttachmentInput {
  documentType?: FinancialDocumentType
  fileName?: string
}

export async function updateTransactionAttachment(
  attachmentId: string,
  updates: UpdateTransactionAttachmentInput,
): Promise<FinancialTransactionAttachment> {
  const payload: Record<string, string> = {}

  if (updates.documentType) {
    payload.document_type = updates.documentType
  }

  const trimmedName = updates.fileName?.trim()
  if (trimmedName) {
    payload.file_name = trimmedName
  }

  if (Object.keys(payload).length === 0) {
    throw new Error('Nenhuma alteração informada.')
  }

  const supabaseAny = supabase as any
  const { data, error } = await supabaseAny
    .from('financial_transaction_attachments')
    .update(payload)
    .eq('id', attachmentId)
    .select('*')
    .single()

  if (error) {
    throw new Error(toErrorMessage(error, 'Falha ao atualizar o anexo.'))
  }

  return mapAttachmentRow(data)
}

