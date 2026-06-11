import { supabase } from '@/lib/supabase/client'
import { withTimeout, toError } from '@/lib/async-utils'
import { mapBrotherFromDB, mapBrotherToDB } from '@/lib/brother-mappers'
import { resolveBrotherProfileIdForSave } from '@/lib/brother-profile-link'
import { syncProfileMasonicDegreeFromBrother } from '@/lib/sync-brother-profile-degree'
import type { Brother } from '@/lib/data'
import { SECRETARIAT_OP_TIMEOUT_MS } from '@/lib/secretariat/constants'

const BROTHER_OP_TIMEOUT_MS = SECRETARIAT_OP_TIMEOUT_MS

export type BrotherSaveInput = Partial<Brother> & {
  profileId?: string
  email: string
  phone: string
  name: string
  initiationDate: string
  degree: Brother['degree']
}

function scheduleProfileDegreeSync(
  email: string | undefined,
  degree: string | undefined,
): void {
  void syncProfileMasonicDegreeFromBrother(email, degree)
}

export async function fetchBrothers(): Promise<Brother[]> {
  const supabaseAny = supabase as any
  const { data: rows, error } = await withTimeout(
    supabaseAny.from('brothers').select('*').order('name', { ascending: true }),
    BROTHER_OP_TIMEOUT_MS,
    'Carregamento demorou demais. Verifique sua conexão e tente novamente.',
  )

  if (error) {
    throw toError(error, 'Não foi possível carregar os irmãos.')
  }

  return (rows || []).map(mapBrotherFromDB)
}

export async function createBrother(data: BrotherSaveInput): Promise<Brother> {
  const profileId = await withTimeout(
    resolveBrotherProfileIdForSave(data.email, data.profileId),
    BROTHER_OP_TIMEOUT_MS,
    'Tempo esgotado ao vincular conta do usuário. Tente novamente.',
  )

  const dbData = {
    ...mapBrotherToDB(data),
    profile_id: profileId,
  }

  const supabaseAny = supabase as any
  const { data: createdRow, error } = await withTimeout(
    supabaseAny.from('brothers').insert(dbData).select('*').single(),
    BROTHER_OP_TIMEOUT_MS,
    'Salvamento demorou demais. Verifique sua conexão e tente novamente.',
  )

  if (error) {
    throw toError(error, 'Falha ao criar o irmão.')
  }

  const newBrother = mapBrotherFromDB(createdRow)
  scheduleProfileDegreeSync(data.email, data.degree)
  return newBrother
}

export async function updateBrother(
  id: string,
  data: BrotherSaveInput,
): Promise<Brother> {
  const profileId = await withTimeout(
    resolveBrotherProfileIdForSave(data.email, data.profileId),
    BROTHER_OP_TIMEOUT_MS,
    'Tempo esgotado ao vincular conta do usuário. Tente novamente.',
  )

  const dbData = {
    ...mapBrotherToDB(data),
    profile_id: profileId,
    updated_at: new Date().toISOString(),
  }

  const supabaseAny = supabase as any
  const { data: updatedRow, error } = await withTimeout(
    supabaseAny.from('brothers').update(dbData).eq('id', id).select('*').single(),
    BROTHER_OP_TIMEOUT_MS,
    'Salvamento demorou demais. Verifique sua conexão e tente novamente.',
  )

  if (error) {
    throw toError(error, 'Falha ao atualizar o irmão.')
  }

  const updatedBrother = mapBrotherFromDB(updatedRow)
  scheduleProfileDegreeSync(data.email, data.degree)
  return updatedBrother
}

export async function toggleBrotherStatus(brother: Brother): Promise<Brother> {
  const newStatus = brother.status === 'Ativo' ? 'Inativo' : 'Ativo'
  const supabaseAny = supabase as any

  const { data: updatedRow, error } = await withTimeout(
    supabaseAny
      .from('brothers')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', brother.id)
      .select('*')
      .single(),
    BROTHER_OP_TIMEOUT_MS,
    'Alteração de status demorou demais. Tente novamente.',
  )

  if (error) {
    throw toError(error, 'Falha ao alterar o status.')
  }

  return mapBrotherFromDB(updatedRow)
}

export async function deleteBrother(
  id: string,
  photoUrl?: string | null,
): Promise<void> {
  const supabaseAny = supabase as any
  const { error } = await withTimeout(
    supabaseAny.from('brothers').delete().eq('id', id),
    BROTHER_OP_TIMEOUT_MS,
    'Exclusão demorou demais. Verifique sua conexão e tente novamente.',
  )

  if (error) {
    throw toError(error, 'Falha ao excluir o irmão.')
  }

  if (photoUrl?.includes('/brothers-photos/')) {
    void removeBrotherPhotoFromStorage(photoUrl)
  }
}

async function removeBrotherPhotoFromStorage(photoUrl: string): Promise<void> {
  try {
    const filePath = photoUrl.split('/brothers-photos/')[1]
    if (!filePath) return
    await withTimeout(
      supabase.storage.from('site-assets').remove([`brothers-photos/${filePath}`]),
      BROTHER_OP_TIMEOUT_MS,
      'Remoção da foto no storage expirou.',
    )
  } catch {
    // Não bloqueia exclusão do cadastro
  }
}
