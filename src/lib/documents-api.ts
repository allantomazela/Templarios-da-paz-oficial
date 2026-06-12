import { format } from 'date-fns'
import { supabase } from '@/lib/supabase/client'
import { todayLocalISODate } from '@/lib/format-utils'
import { withTimeout, toError } from '@/lib/async-utils'
import { SECRETARIAT_OP_TIMEOUT_MS } from '@/lib/secretariat/constants'
import type { LodgeDocument } from '@/lib/data'

const TIMEOUT_MSG =
  'Operação demorou demais. Verifique sua conexão e tente novamente.'

export type DocumentSaveInput = {
  title: string
  description: string
  category: string
  fileUrl?: string
  fileName?: string
  fileSize?: number
  fileType?: string
}

function mapDocumentFromDB(row: Record<string, unknown>): LodgeDocument {
  return {
    id: String(row.id),
    title: String(row.title),
    description: String(row.description ?? ''),
    category: String(row.category),
    uploadDate:
      (row.upload_date as string) ||
      format(new Date(String(row.created_at)), 'yyyy-MM-dd'),
    type: (row.file_type as LodgeDocument['type']) || 'PDF',
    url: String(row.file_url),
  }
}

function isMissingTableError(error: { code?: string }): boolean {
  return error.code === '404' || error.code === 'PGRST116'
}

export async function fetchLodgeDocuments(): Promise<LodgeDocument[]> {
  const supabaseAny = supabase as any
  const { data: rows, error } = await withTimeout(
    supabaseAny
      .from('lodge_documents')
      .select('*')
      .order('upload_date', { ascending: false })
      .order('created_at', { ascending: false }),
    SECRETARIAT_OP_TIMEOUT_MS,
    TIMEOUT_MSG,
  )

  if (error) {
    if (isMissingTableError(error)) return []
    throw toError(error, 'Não foi possível carregar os documentos.')
  }

  return (rows || []).map(mapDocumentFromDB)
}

export async function updateLodgeDocument(
  id: string,
  data: Pick<DocumentSaveInput, 'title' | 'description' | 'category'>,
): Promise<LodgeDocument> {
  const supabaseAny = supabase as any
  const { data: updatedRows, error } = await withTimeout(
    supabaseAny
      .from('lodge_documents')
      .update({
        title: data.title,
        description: data.description,
        category: data.category,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .limit(1),
    SECRETARIAT_OP_TIMEOUT_MS,
    'Salvamento demorou demais. Verifique sua conexão e tente novamente.',
  )

  if (error) {
    throw toError(error, 'Falha ao atualizar os metadados do documento.')
  }

  const updatedRow = updatedRows?.[0]
  if (!updatedRow) {
    throw new Error('Documento não encontrado após atualização.')
  }

  return mapDocumentFromDB(updatedRow)
}

export async function createLodgeDocument(
  data: DocumentSaveInput,
): Promise<LodgeDocument> {
  if (!data.fileUrl) {
    throw new Error('Arquivo não foi enviado. Por favor, faça o upload do arquivo.')
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const supabaseAny = supabase as any
  const { data: createdRows, error } = await withTimeout(
    supabaseAny
      .from('lodge_documents')
      .insert({
        title: data.title,
        description: data.description,
        category: data.category,
        file_url: data.fileUrl,
        file_name: data.fileName,
        file_size: data.fileSize,
        file_type: data.fileType,
        upload_date: todayLocalISODate(),
        uploaded_by: user?.id || null,
      })
      .select('*')
      .limit(1),
    SECRETARIAT_OP_TIMEOUT_MS,
    'Salvamento demorou demais. Verifique sua conexão e tente novamente.',
  )

  if (error) {
    throw toError(error, 'Falha ao salvar o documento.')
  }

  const createdRow = createdRows?.[0]
  if (!createdRow) {
    throw new Error('Documento não foi criado corretamente.')
  }

  return mapDocumentFromDB(createdRow)
}

export async function deleteLodgeDocument(
  id: string,
  fileUrl?: string,
): Promise<void> {
  const supabaseAny = supabase as any
  const { error } = await withTimeout(
    supabaseAny.from('lodge_documents').delete().eq('id', id),
    SECRETARIAT_OP_TIMEOUT_MS,
    TIMEOUT_MSG,
  )

  if (error) {
    throw toError(error, 'Falha ao remover o documento.')
  }

  if (fileUrl) {
    void removeDocumentFromStorage(fileUrl)
  }
}

async function removeDocumentFromStorage(fileUrl: string): Promise<void> {
  try {
    const filePath = fileUrl.split('/').slice(-2).join('/')
    await withTimeout(
      supabase.storage.from('site-assets').remove([filePath]),
      SECRETARIAT_OP_TIMEOUT_MS,
      'Remoção do arquivo no storage expirou.',
    )
  } catch {
    // Não bloqueia exclusão do registro
  }
}
