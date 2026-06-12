import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

export const MASTER_ADMIN_EMAIL = 'allantomazela@gmail.com'

type AdminClient = ReturnType<typeof createClient>

interface BrotherRow {
  id: string
  profile_id: string | null
  email: string | null
}

export interface MemberDeletionResult {
  deletedBrotherIds: string[]
  deletedUserId: string | null
}

function normalizeEmail(email: string | null | undefined): string | null {
  if (!email) return null
  const trimmed = email.trim().toLowerCase()
  return trimmed.length > 0 ? trimmed : null
}

async function findBrotherById(
  adminClient: AdminClient,
  brotherId: string,
): Promise<BrotherRow | null> {
  const { data, error } = await adminClient
    .from('brothers')
    .select('id, profile_id, email')
    .eq('id', brotherId)
    .maybeSingle()

  if (error) throw new Error('Não foi possível localizar o irmão.')
  return data as BrotherRow | null
}

async function findBrothersForUser(
  adminClient: AdminClient,
  userId: string,
  userEmail: string | null | undefined,
): Promise<BrotherRow[]> {
  const normalizedEmail = normalizeEmail(userEmail)
  let query = adminClient.from('brothers').select('id, profile_id, email')

  if (normalizedEmail) {
    query = query.or(
      `profile_id.eq.${userId},email.ilike.${normalizedEmail}`,
    )
  } else {
    query = query.eq('profile_id', userId)
  }

  const { data, error } = await query
  if (error) throw new Error('Não foi possível localizar o cadastro na secretaria.')
  return (data ?? []) as BrotherRow[]
}

async function resolveUserIdFromBrother(
  adminClient: AdminClient,
  brother: BrotherRow,
): Promise<string | null> {
  if (brother.profile_id) return brother.profile_id

  const email = normalizeEmail(brother.email)
  if (!email) return null

  const { data: profile, error } = await adminClient
    .from('profiles')
    .select('id')
    .ilike('email', email)
    .maybeSingle()

  if (error) throw new Error('Não foi possível localizar a conta do usuário.')
  return profile?.id ?? null
}

async function assertUserCanBeDeleted(
  adminClient: AdminClient,
  userId: string,
  actorUserId: string,
): Promise<void> {
  if (userId === actorUserId) {
    throw new Error('Você não pode excluir sua própria conta.')
  }

  const { data: targetAuth, error: fetchError } =
    await adminClient.auth.admin.getUserById(userId)

  if (fetchError || !targetAuth?.user) {
    throw new Error('Usuário não encontrado.')
  }

  if (targetAuth.user.email === MASTER_ADMIN_EMAIL) {
    throw new Error('Não é permitido excluir o administrador principal.')
  }
}

async function deleteBrotherRows(
  adminClient: AdminClient,
  brotherIds: string[],
): Promise<void> {
  if (brotherIds.length === 0) return

  const { error } = await adminClient
    .from('brothers')
    .delete()
    .in('id', brotherIds)

  if (error) {
    throw new Error(
      error.message || 'Não foi possível excluir o cadastro na secretaria.',
    )
  }
}

async function deleteAuthUser(
  adminClient: AdminClient,
  userId: string,
): Promise<void> {
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId)

  if (deleteError) {
    throw new Error(
      deleteError.message || 'Não foi possível excluir a conta de acesso.',
    )
  }
}

export async function deleteMemberFromSystem(
  adminClient: AdminClient,
  params: { userId?: string; brotherId?: string; actorUserId: string },
): Promise<MemberDeletionResult> {
  const brotherIds = new Set<string>()
  let userId = params.userId?.trim() || null

  if (params.brotherId?.trim()) {
    const brother = await findBrotherById(adminClient, params.brotherId.trim())
    if (!brother) {
      throw new Error('Irmão não encontrado na secretaria.')
    }

    brotherIds.add(brother.id)

    if (!userId) {
      userId = await resolveUserIdFromBrother(adminClient, brother)
    }
  }

  if (userId) {
    const { data: targetAuth } = await adminClient.auth.admin.getUserById(userId)
    const linkedBrothers = await findBrothersForUser(
      adminClient,
      userId,
      targetAuth?.user?.email,
    )
    for (const row of linkedBrothers) {
      brotherIds.add(row.id)
    }
  }

  let shouldDeleteAuthUser = false
  if (userId) {
    try {
      await assertUserCanBeDeleted(adminClient, userId, params.actorUserId)
      shouldDeleteAuthUser = true
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Não foi possível excluir a conta.'
      if (!message.includes('não encontrado')) {
        throw error
      }
    }
  }

  const deletedBrotherIds = [...brotherIds]
  await deleteBrotherRows(adminClient, deletedBrotherIds)

  if (userId && shouldDeleteAuthUser) {
    await deleteAuthUser(adminClient, userId)
  }

  return {
    deletedBrotherIds,
    deletedUserId: shouldDeleteAuthUser ? userId : null,
  }
}
