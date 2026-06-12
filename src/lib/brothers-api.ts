import { supabase } from '@/lib/supabase/client'
import { withTimeout, toError } from '@/lib/async-utils'
import { mapBrotherFromDB, mapBrotherToDB } from '@/lib/brother-mappers'
import { resolveBrotherProfileIdForSave } from '@/lib/brother-profile-link'
import { syncProfileMasonicDegreeFromBrother } from '@/lib/sync-brother-profile-degree'
import { resolveBrotherPhotoFromProfile } from '@/lib/brother-registration-utils'
import { deleteBrotherAsAdmin } from '@/lib/admin-user-api'
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

export async function fetchBrotherForProfile(
  profileId: string,
  email?: string | null,
): Promise<Brother | null> {
  const supabaseAny = supabase as any

  const { data: byProfile, error: profileError } = await withTimeout(
    supabaseAny
      .from('brothers')
      .select('*')
      .eq('profile_id', profileId)
      .maybeSingle(),
    BROTHER_OP_TIMEOUT_MS,
    'Carregamento do cadastro demorou demais. Tente novamente.',
  )

  if (profileError) {
    throw toError(profileError, 'Não foi possível carregar seu cadastro.')
  }

  if (byProfile) {
    return mapBrotherFromDB(byProfile)
  }

  const normalizedEmail = email?.trim()
  if (!normalizedEmail) return null

  const { data: byEmail, error: emailError } = await withTimeout(
    supabaseAny
      .from('brothers')
      .select('*')
      .ilike('email', normalizedEmail)
      .maybeSingle(),
    BROTHER_OP_TIMEOUT_MS,
    'Carregamento do cadastro demorou demais. Tente novamente.',
  )

  if (emailError) {
    throw toError(emailError, 'Não foi possível carregar seu cadastro.')
  }

  return byEmail ? mapBrotherFromDB(byEmail) : null
}

export async function saveMyBrotherRegistration(
  profileId: string,
  email: string,
  data: BrotherSaveInput,
  existing: Brother | null,
  profileAvatarUrl?: string | null,
): Promise<Brother> {
  const syncedPhoto = resolveBrotherPhotoFromProfile(
    profileAvatarUrl,
    data.photoUrl,
  )

  const payload: BrotherSaveInput = {
    ...data,
    email,
    profileId,
    photoUrl: syncedPhoto,
  }

  if (existing?.id) {
    const dbData = {
      ...mapBrotherToDB({
        ...payload,
        role: existing.role,
        status: existing.status,
        attendanceRate: existing.attendanceRate,
      }),
      profile_id: profileId,
      updated_at: new Date().toISOString(),
    }

    const supabaseAny = supabase as any
    const { data: updatedRow, error } = await withTimeout(
      supabaseAny
        .from('brothers')
        .update(dbData)
        .eq('id', existing.id)
        .select('*')
        .single(),
      BROTHER_OP_TIMEOUT_MS,
      'Salvamento demorou demais. Verifique sua conexão e tente novamente.',
    )

    if (error) {
      throw toError(error, 'Falha ao salvar seu cadastro.')
    }

    const updatedBrother = mapBrotherFromDB(updatedRow)
    scheduleProfileDegreeSync(email, data.degree)
    return updatedBrother
  }

  const newBrother = await createBrother(payload)
  scheduleProfileDegreeSync(email, data.degree)
  return newBrother
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
  await withTimeout(
    deleteBrotherAsAdmin(id),
    BROTHER_OP_TIMEOUT_MS,
    'Exclusão demorou demais. Verifique sua conexão e tente novamente.',
  )

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
