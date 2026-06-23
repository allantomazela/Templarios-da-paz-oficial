import { supabase } from '@/lib/supabase/client'
import { logError } from '@/lib/logger'
import { toErrorMessage, withTimeout } from '@/lib/async-utils'

export const FINANCIAL_DOCUMENTS_BUCKET = 'financial-documents'

export const FINANCIAL_DOCUMENT_TYPES = [
  { value: 'nota_fiscal', label: 'Nota fiscal' },
  { value: 'recibo', label: 'Recibo' },
  { value: 'cupom_fiscal', label: 'Cupom fiscal' },
  { value: 'outro', label: 'Outro' },
] as const

export type FinancialDocumentType =
  (typeof FINANCIAL_DOCUMENT_TYPES)[number]['value']

export interface FinancialTransactionAttachment {
  id: string
  transactionId: string
  documentType: FinancialDocumentType
  filePath: string
  fileName: string
  fileSize: number
  mimeType: string
  uploadedBy: string | null
  createdAt: string
}

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
    .select('*')
    .eq('transaction_id', transactionId)
    .order('created_at', { ascending: true })

  if (error) throw new Error(toErrorMessage(error, 'Falha ao carregar anexos.'))
  return (data || []).map(mapAttachmentRow)
}

export async function fetchAttachmentCountsByTransaction(
  transactionIds: string[],
): Promise<Record<string, number>> {
  if (transactionIds.length === 0) return {}

  const supabaseAny = supabase as any
  const { data, error } = await supabaseAny
    .from('financial_transaction_attachments')
    .select('transaction_id')
    .in('transaction_id', transactionIds)

  if (error) {
    logError('fetchAttachmentCountsByTransaction', error)
    return {}
  }

  const counts: Record<string, number> = {}
  for (const row of data || []) {
    const id = String(row.transaction_id)
    counts[id] = (counts[id] ?? 0) + 1
  }
  return counts
}

export async function uploadTransactionAttachment(
  transactionId: string,
  file: File,
  documentType: FinancialDocumentType,
): Promise<FinancialTransactionAttachment> {
  const validationError = validateFinancialAttachmentFile(file)
  if (validationError) throw new Error(validationError)

  const filePath = buildStoragePath(transactionId, file.name)
  const contentType = file.type || 'application/octet-stream'

  const uploadPromise = supabase.storage
    .from(FINANCIAL_DOCUMENTS_BUCKET)
    .upload(filePath, file, { contentType, upsert: false })

  const uploadResult = await withTimeout(
    uploadPromise,
    UPLOAD_TIMEOUT_MS,
    'Upload demorou muito. Tente novamente com um arquivo menor.',
  )

  if (uploadResult.error) {
    throw new Error(toErrorMessage(uploadResult.error, 'Falha ao enviar o arquivo.'))
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
      file_size: file.size,
      mime_type: contentType,
      uploaded_by: user?.id ?? null,
    })
    .select('*')
    .single()

  if (error) {
    await supabase.storage.from(FINANCIAL_DOCUMENTS_BUCKET).remove([filePath])
    throw new Error(toErrorMessage(error, 'Falha ao registrar o anexo.'))
  }

  return mapAttachmentRow(data)
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

  const { error: storageError } = await supabase.storage
    .from(FINANCIAL_DOCUMENTS_BUCKET)
    .remove([attachment.filePath])

  if (storageError) {
    logError('deleteTransactionAttachment storage', storageError)
  }
}

export async function createAttachmentDownloadUrl(
  filePath: string,
  expiresInSeconds = 3600,
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(FINANCIAL_DOCUMENTS_BUCKET)
    .createSignedUrl(filePath, expiresInSeconds)

  if (error || !data?.signedUrl) {
    throw new Error(toErrorMessage(error, 'Não foi possível gerar o link de download.'))
  }

  return data.signedUrl
}

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

export function getFinancialDocumentTypeLabel(type: FinancialDocumentType): string {
  return (
    FINANCIAL_DOCUMENT_TYPES.find((item) => item.value === type)?.label ?? type
  )
}
