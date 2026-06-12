import { supabase } from '@/lib/supabase/client'
import { withTimeout, toError } from '@/lib/async-utils'
import { logError, logWarning } from '@/lib/logger'
import { resolveProfileAvatarUrl } from '@/lib/profile-avatar'
import { fetchBrotherForProfile } from '@/lib/brothers-api'
import { SECRETARIAT_OP_TIMEOUT_MS } from '@/lib/secretariat/constants'

const SYNC_TIMEOUT_MS = SECRETARIAT_OP_TIMEOUT_MS

/**
 * Mantém brothers.photo_url alinhado ao avatar do perfil (menu / Meu Perfil).
 */
export async function syncBrotherPhotoFromProfile(
  profileId: string,
  email: string | undefined | null,
  avatarUrl: string | null | undefined,
): Promise<void> {
  if (!profileId) return

  try {
    const brother = await fetchBrotherForProfile(profileId, email)
    if (!brother?.id) return

    const storedUrl = resolveProfileAvatarUrl(avatarUrl) ?? null
    const supabaseAny = supabase as any

    const { error } = await withTimeout(
      supabaseAny
        .from('brothers')
        .update({
          photo_url: storedUrl,
          profile_id: profileId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', brother.id),
      SYNC_TIMEOUT_MS,
      'Sincronização da foto na secretaria expirou.',
    )

    if (error) {
      logWarning('Não foi possível sincronizar foto na secretaria', error)
    }
  } catch (error) {
    logError('Erro ao sincronizar foto do irmão com o perfil', toError(error))
  }
}
